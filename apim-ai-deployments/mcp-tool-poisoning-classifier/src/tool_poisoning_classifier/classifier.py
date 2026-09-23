# Copyright (c) 2026, WSO2 LLC. (https://www.wso2.com).
#
# WSO2 LLC. licenses this file to you under the Apache License,
# Version 2.0 (the "License"); you may not use this file except
# in compliance with the License. You may obtain a copy of the
# License at http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""The SetFit model: loading it, naming it, chunking text for it and scoring."""

from __future__ import annotations

import hashlib
import logging
import threading
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Protocol

from .config import Settings, verify_dependencies

LOGGER = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────────
# Chunking: fitting text longer than the model's sequence limit into
# bounded overlapping windows, never by truncating it.
# ──────────────────────────────────────────────────────────────────────────

class TextTooLongError(ValueError):
    """Raised when text needs more chunks than the configured budget allows."""

    def __init__(self, required_chunks: int, max_chunks: int) -> None:
        super().__init__(
            f"text requires {required_chunks} chunks, above the limit of {max_chunks}; "
            "it was not truncated and has not been inspected"
        )
        self.required_chunks = required_chunks
        self.max_chunks = max_chunks


class Tokenizer(Protocol):
    """The slice of the Hugging Face tokenizer API this module needs."""

    def encode(self, text: str, add_special_tokens: bool = ...) -> list[int]: ...

    def decode(self, token_ids: list[int], skip_special_tokens: bool = ...) -> str: ...


def content_window(max_seq_length: int, special_tokens: int) -> int:
    """Tokens available for content once the special tokens are accounted for.

    ``max_seq_length`` is the total the model accepts, and the tokenizer adds
    ``special_tokens`` of its own (``<s>`` and ``</s>`` for MPNet) to every
    sequence. Chunking against the raw maximum would therefore still overflow
    by exactly that many tokens.
    """
    window = max_seq_length - special_tokens
    if window < 1:
        raise ValueError(
            f"max_seq_length {max_seq_length} leaves no room for content after "
            f"{special_tokens} special tokens"
        )
    return window


def chunk_text(
    tokenizer: Tokenizer,
    text: str,
    *,
    window: int,
    overlap: int,
    max_chunks: int,
) -> list[str]:
    """Split text into overlapping windows of at most ``window`` content tokens.

    The overlap keeps an instruction that straddles a window boundary intact in
    at least one chunk. Text that already fits is returned unchanged, so short
    metadata — the overwhelmingly common case — costs nothing extra.

    Raises TextTooLongError when the text needs more than ``max_chunks`` windows.
    """
    if window < 1:
        raise ValueError("window must be at least 1 token")
    if max_chunks < 1:
        raise ValueError("max_chunks must be at least 1")
    if not 0 <= overlap < window:
        raise ValueError(f"overlap must be in [0, {window}), got {overlap}")

    token_ids = tokenizer.encode(text, add_special_tokens=False)
    if len(token_ids) <= window:
        return [text]

    step = window - overlap
    required = 1 + -(-(len(token_ids) - window) // step)  # ceil division
    if required > max_chunks:
        raise TextTooLongError(required, max_chunks)

    chunks: list[str] = []
    for start in range(0, len(token_ids), step):
        piece = token_ids[start : start + window]
        if not piece:
            break
        chunks.append(tokenizer.decode(piece, skip_special_tokens=True))
        if start + window >= len(token_ids):
            break
    return chunks

# ──────────────────────────────────────────────────────────────────────────
# Provenance: naming the artefacts a score actually came from.
# ──────────────────────────────────────────────────────────────────────────

_READ_CHUNK_BYTES = 1024 * 1024


class ArtifactError(ValueError):
    """Raised when a local model directory cannot be identified."""


def artifact_digest(path: str) -> str:
    """Return a deterministic SHA-256 over every file in a model directory.

    Local artefacts have no Hub commit to name them, and nothing stops two
    deployments mounting different weights at the same path. Hashing the
    contents gives the identity a name that follows the bytes: replicas that
    disagree about the model report different revisions, so the gateway's
    cross-batch consistency check can see it, and analytics record which
    artefacts produced a score rather than which ones were configured.

    Both the relative path and the size of each file are mixed in, so moving
    content between files changes the digest even when the bytes do not.
    """
    root = Path(path)
    if not root.is_dir():
        raise ArtifactError(f"model directory {path!r} is not a directory")

    files = sorted(entry for entry in root.rglob("*") if entry.is_file())
    if not files:
        raise ArtifactError(f"model directory {path!r} contains no files")

    digest = hashlib.sha256()
    for entry in files:
        digest.update(entry.relative_to(root).as_posix().encode("utf-8"))
        digest.update(b"\0")
        digest.update(str(entry.stat().st_size).encode("ascii"))
        digest.update(b"\0")
        with entry.open("rb") as handle:
            while chunk := handle.read(_READ_CHUNK_BYTES):
                digest.update(chunk)

    return digest.hexdigest()


def local_identity(model_dir: str) -> tuple[str, str]:
    """Return the (model, revision) pair reported for a local directory.

    Never a Hub repo id and never a Hub commit: nothing has verified that the
    directory holds the artefacts of the pinned commit, and reporting one
    anyway would put a claim in the logs that no one checked.
    """
    return f"local:{model_dir}", f"sha256:{artifact_digest(model_dir)}"

# ──────────────────────────────────────────────────────────────────────────
# The model itself: loading, contract validation, identity and scoring.
# ──────────────────────────────────────────────────────────────────────────

# The model card documents a two-class head: {0: "Safe", 1: "Tool Poisoning"}.
SAFE_LABEL = "Safe"
POISONING_LABEL = "Tool Poisoning"

# Reported by the model card; used only as a fallback when the loaded body does
# not expose its own limit.
DOCUMENTED_MAX_SEQ_LENGTH = 384


class ModelContractError(RuntimeError):
    """Raised when the loaded artefacts do not match the documented contract."""


@dataclass(frozen=True)
class ModelIdentity:
    """What produced a score, reported alongside every result."""

    model: str
    revision: str


class Classifier(Protocol):
    """The interface the HTTP layer depends on.

    Declared so the API can be exercised without loading half a gigabyte of
    model weights.
    """

    @property
    def identity(self) -> ModelIdentity: ...

    @property
    def ready(self) -> bool: ...

    def score(self, texts: list[str]) -> list[float]: ...


class ToolPoisoningClassifier:
    """The SetFit model, loaded once and reused for the process's lifetime."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._model: Any = None
        self._tokenizer: Any = None
        self._window = 0
        self._poisoning_index = -1
        self._ready = False
        self._identity: ModelIdentity | None = None
        # Serialises every use of the model AND its tokenizer. The Rust fast
        # tokenizer mutates shared state, so concurrent tokenization raises
        # "Already borrowed"; torch inference is not worth running concurrently
        # on CPU either. One score() call at a time, with the request-level
        # limiter absorbing the queue and shedding beyond it.
        self._lock = threading.Lock()

    # ── lifecycle ────────────────────────────────────────────────────────────

    def load(self) -> None:
        """Load the complete model, including its classification head.

        Raises ModelContractError when the artefacts are not what the model
        card documents — a missing head, a head that cannot produce
        probabilities, or a class ordering that cannot be resolved.
        """
        verify_dependencies(allow_drift=self._settings.allow_dependency_drift)

        from setfit import SetFitModel  # imported here so config errors surface first

        source = self._resolve_source()
        # Resolved from the artefacts, before they are loaded, so what is served
        # alongside every score names what is actually on disk.
        self._identity = self._resolve_identity(source)
        LOGGER.info(
            "loading model source=%s model=%s revision=%s device=%s local_dir=%s",
            source,
            self._identity.model,
            self._identity.revision,
            self._settings.device,
            self._settings.loads_from_local_dir,
        )

        model = SetFitModel.from_pretrained(source, device=self._settings.device)

        self._model = model
        self._poisoning_index = resolve_poisoning_index(model)
        self._tokenizer = _require_tokenizer(model)
        self._window = content_window(
            _resolve_max_seq_length(model),
            self._tokenizer.num_special_tokens_to_add(pair=False),
        )

        # Prove the head is present and usable before serving readiness, rather
        # than discovering a broken pickle on the first real request. Load runs
        # in the lifespan before the socket is bound, so nothing else can be in
        # the model yet, but the lock is taken anyway so this path has the same
        # ownership rule as every other caller.
        with self._lock:
            probe = self._predict_proba_unlocked(["health probe"])
        if len(probe) != 1:
            raise ModelContractError(
                f"predict_proba returned {len(probe)} rows for one input"
            )

        self._ready = True
        LOGGER.info(
            "model ready poisoning_class_index=%d content_window=%d",
            self._poisoning_index,
            self._window,
        )

    def _resolve_source(self) -> str:
        """Return a concrete local path for SetFit to load from.

        SetFit 1.1.3 forwards `revision` to its own config and head downloads
        but not to the SentenceTransformer body, which then resolves `main` —
        so passing a repo id and a revision pins only half the model, and a
        cached pinned snapshot is not found offline. Materialising the pinned
        commit here and handing SetFit a directory pins every artefact, and
        lets the service run with no egress once the snapshot is in the cache.
        """
        if self._settings.loads_from_local_dir:
            return self._settings.model_dir

        from huggingface_hub import snapshot_download

        return snapshot_download(
            repo_id=self._settings.model_id,
            revision=self._settings.model_revision,
        )

    @property
    def ready(self) -> bool:
        return self._ready

    def _resolve_identity(self, source: str) -> ModelIdentity:
        """Name the artefacts that will produce scores.

        A pinned Hub commit names itself. A local directory does not: nothing
        has verified that it holds the artefacts of the configured revision, so
        reporting that revision would put an unchecked claim into every score,
        every log line and every analytics record — and would hide the case
        where two replicas serve different weights from the same path. Local
        artefacts are identified by their content instead.
        """
        if self._settings.loads_from_local_dir:
            model, revision = local_identity(source)
            return ModelIdentity(model=model, revision=revision)
        return ModelIdentity(
            model=self._settings.model_id,
            revision=self._settings.model_revision,
        )

    @property
    def identity(self) -> ModelIdentity:
        if self._identity is None:
            raise ModelContractError("the model identity is not resolved until the model is loaded")
        return self._identity

    @property
    def content_window_tokens(self) -> int:
        return self._window

    # ── scoring ──────────────────────────────────────────────────────────────

    def score(self, texts: list[str]) -> list[float]:
        """Return the Tool Poisoning probability for each text.

        Text longer than the model's sequence limit is split into overlapping
        chunks and the chunk scores are aggregated by maximum: one poisoned
        passage anywhere in the text poisons the whole field.

        Raises TextTooLongError when a text exceeds the chunk budget. Nothing is
        ever truncated.

        The whole call runs under one lock. Chunking tokenizes, and so does
        inference, and both reach the same Rust fast tokenizer: `tokenizers`
        mutates shared truncation/padding state on the tokenizer object, so two
        threads in these paths at once raise ``RuntimeError: Already borrowed``
        and the request fails with a 500. Holding the lock only around inference
        was not enough — a thread chunking here collided with a thread already
        inside the model. Serialising the whole call is also no throughput loss:
        CPU inference is the bottleneck and was already serialised.

        Callers must not hold this lock while doing HTTP work; request parsing,
        authentication, validation and the capacity check all happen before the
        service dispatches here.
        """
        if not self._ready:
            raise ModelContractError("the model is not loaded")
        if not texts:
            return []

        with self._lock:
            # Chunk everything first so a too-long item fails before inference.
            chunks: list[str] = []
            spans: list[tuple[int, int]] = []
            for text in texts:
                pieces = chunk_text(
                    self._tokenizer,
                    text,
                    window=self._window,
                    overlap=min(self._settings.chunk_overlap_tokens, self._window - 1),
                    max_chunks=self._settings.max_chunks_per_item,
                )
                spans.append((len(chunks), len(chunks) + len(pieces)))
                chunks.extend(pieces)

            probabilities = self._predict_proba_unlocked(chunks)

        if len(probabilities) != len(chunks):
            raise ModelContractError(
                f"predict_proba returned {len(probabilities)} rows for {len(chunks)} chunks"
            )

        scores: list[float] = []
        for start, end in spans:
            scores.append(max(probabilities[start:end]))
        return scores

    def _predict_proba_unlocked(self, texts: list[str]) -> list[float]:
        """Run the body and head, returning the Tool Poisoning column.

        Assumes the caller already holds ``self._lock``. The lock is not taken
        here: ``score`` holds it across chunking and inference together, and a
        second acquisition of a plain Lock would deadlock.
        """
        raw = self._model.predict_proba(
            texts,
            batch_size=self._settings.inference_batch_size,
            as_numpy=True,
            # The library writes a tqdm bar to stderr otherwise, which is noise
            # in a service log and hides real warnings.
            show_progress_bar=False,
        )

        column: list[float] = []
        for row in raw:
            values = list(row)
            if self._poisoning_index >= len(values):
                raise ModelContractError(
                    f"predict_proba returned {len(values)} classes, expected the "
                    f"Tool Poisoning class at index {self._poisoning_index}"
                )
            score = float(values[self._poisoning_index])
            if not 0.0 <= score <= 1.0:
                raise ModelContractError(f"predict_proba returned {score}, outside [0,1]")
            column.append(score)
        return column


def resolve_poisoning_index(model: Any) -> int:
    """Find which predict_proba column holds the Tool Poisoning probability.

    predict_proba columns follow the head's ``classes_``, which is what the
    model card's own example relies on when it indexes ``probs[0][preds[0]]``.
    Resolving the index from the loaded artefacts — rather than hard-coding
    column 1 — means a model whose ordering differs is refused instead of
    silently having its Safe probability used as a poisoning score.
    """
    head = getattr(model, "model_head", None)
    if head is None:
        raise ModelContractError(
            "the loaded model has no classification head; the SetFit body alone "
            "cannot produce probabilities"
        )
    if not hasattr(head, "predict_proba"):
        raise ModelContractError(
            f"the classification head {type(head).__name__} has no predict_proba"
        )

    classes = getattr(head, "classes_", None)
    if classes is None:
        raise ModelContractError("the classification head exposes no classes_")

    class_list = list(classes)
    if len(class_list) != 2:
        raise ModelContractError(
            f"expected a two-class head, found {len(class_list)}: {class_list!r}"
        )

    normalized = [str(value).strip().lower() for value in class_list]

    if POISONING_LABEL.lower() in normalized:
        index = normalized.index(POISONING_LABEL.lower())
        LOGGER.info("resolved the Tool Poisoning class by label at index %d", index)
        return index

    # config_setfit.json for this model has "labels": null, so the head's
    # classes are the raw training labels 0 and 1, documented as
    # {0: "Safe", 1: "Tool Poisoning"}.
    if normalized == ["0", "1"]:
        LOGGER.info("resolved the Tool Poisoning class as numeric label 1")
        return 1

    raise ModelContractError(
        f"cannot tell which class is {POISONING_LABEL!r} from classes_ {class_list!r}; "
        "refusing to guess"
    )


class _ChunkingTokenizer:
    """Adapts a Hugging Face tokenizer to the chunking module's needs.

    Encoding text longer than the model's limit is exactly what chunking is for,
    but the tokenizer logs a "sequence length is longer than the specified
    maximum" warning every time. `verbose=False` silences it where supported.
    """

    def __init__(self, tokenizer: Any) -> None:
        self._tokenizer = tokenizer

    def encode(self, text: str, add_special_tokens: bool = True) -> list[int]:
        try:
            return self._tokenizer.encode(
                text, add_special_tokens=add_special_tokens, verbose=False
            )
        except TypeError:
            return self._tokenizer.encode(text, add_special_tokens=add_special_tokens)

    def decode(self, token_ids: list[int], skip_special_tokens: bool = True) -> str:
        return self._tokenizer.decode(token_ids, skip_special_tokens=skip_special_tokens)

    def num_special_tokens_to_add(self, pair: bool = False) -> int:
        return _count_special_tokens(self._tokenizer)


def _require_tokenizer(model: Any) -> Any:
    body = getattr(model, "model_body", None)
    tokenizer = getattr(body, "tokenizer", None)
    if tokenizer is None:
        raise ModelContractError(
            "the model body exposes no tokenizer; chunking cannot respect the "
            "sequence limit without one"
        )
    return _ChunkingTokenizer(tokenizer)


def _resolve_max_seq_length(model: Any) -> int:
    body = getattr(model, "model_body", None)
    value = getattr(body, "max_seq_length", None)
    if isinstance(value, int) and value > 0:
        return value
    LOGGER.warning(
        "the model body reports no max_seq_length; falling back to the documented %d",
        DOCUMENTED_MAX_SEQ_LENGTH,
    )
    return DOCUMENTED_MAX_SEQ_LENGTH


def _count_special_tokens(tokenizer: Any) -> int:
    """How many special tokens the tokenizer adds to a single sequence."""
    counter = getattr(tokenizer, "num_special_tokens_to_add", None)
    if callable(counter):
        try:
            return int(counter(pair=False))
        except TypeError:
            return int(counter(False))
    LOGGER.warning("the tokenizer cannot report its special tokens; assuming 2")
    return 2


__all__ = [
    "Classifier",
    "ModelContractError",
    "ModelIdentity",
    "TextTooLongError",
    "ToolPoisoningClassifier",
    "resolve_poisoning_index",
]
