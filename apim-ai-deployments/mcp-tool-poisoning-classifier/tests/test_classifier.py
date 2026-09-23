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

"""The model: chunking, provenance and scoring."""

from __future__ import annotations

import threading
import time

import pytest

from conftest import StubTokenizer, make_settings
from tool_poisoning_classifier.config import DEFAULT_MODEL_REVISION
from tool_poisoning_classifier.classifier import (
    DOCUMENTED_MAX_SEQ_LENGTH,
    POISONING_LABEL,
    SAFE_LABEL,
    ArtifactError,
    ModelContractError,
    ModelIdentity,
    TextTooLongError,
    ToolPoisoningClassifier,
    artifact_digest,
    chunk_text,
    content_window,
    local_identity,
    resolve_poisoning_index,
)

# ──────────────────────────────────────────────────────────────────────────
# Chunking: bounded overlapping windows, never truncation.
# ──────────────────────────────────────────────────────────────────────────


def words(count: int, prefix: str = "w") -> str:
    return " ".join(f"{prefix}{index}" for index in range(count))


def test_content_window_accounts_for_special_tokens():
    # The model's 384-token limit includes the tokenizer's <s> and </s>.
    assert content_window(384, 2) == 382
    assert content_window(384, 0) == 384


def test_content_window_rejects_an_impossible_limit():
    with pytest.raises(ValueError, match="no room for content"):
        content_window(2, 2)


def test_short_text_is_returned_unchanged(tokenizer):
    text = words(5)
    assert chunk_text(tokenizer, text, window=10, overlap=2, max_chunks=4) == [text]


def test_text_at_exactly_the_window_is_not_split(tokenizer):
    text = words(10)
    assert chunk_text(tokenizer, text, window=10, overlap=2, max_chunks=4) == [text]


def test_long_text_is_split_into_overlapping_windows(tokenizer):
    text = words(10)
    chunks = chunk_text(tokenizer, text, window=4, overlap=1, max_chunks=10)

    assert chunks == [
        "w0 w1 w2 w3",
        "w3 w4 w5 w6",
        "w6 w7 w8 w9",
    ]
    # No chunk exceeds the window.
    for chunk in chunks:
        assert len(tokenizer.encode(chunk, add_special_tokens=False)) <= 4


def test_every_token_appears_in_at_least_one_chunk(tokenizer):
    text = words(37)
    chunks = chunk_text(tokenizer, text, window=8, overlap=3, max_chunks=32)

    covered = set()
    for chunk in chunks:
        covered.update(chunk.split())
    assert covered == set(text.split())


def test_overlap_keeps_a_straddling_phrase_intact(tokenizer):
    # The phrase sits exactly on the boundary of a zero-overlap split.
    text = "a b c d ignore all previous instructions e f g h"
    chunks = chunk_text(tokenizer, text, window=6, overlap=4, max_chunks=16)
    assert any("ignore all previous instructions" in chunk for chunk in chunks)


def test_zero_overlap_is_allowed(tokenizer):
    chunks = chunk_text(tokenizer, words(6), window=3, overlap=0, max_chunks=4)
    assert chunks == ["w0 w1 w2", "w3 w4 w5"]


def test_text_beyond_the_chunk_budget_is_refused_not_truncated(tokenizer):
    with pytest.raises(TextTooLongError) as excinfo:
        chunk_text(tokenizer, words(100), window=4, overlap=1, max_chunks=3)

    error = excinfo.value
    assert error.max_chunks == 3
    assert error.required_chunks > 3
    assert "not truncated" in str(error)


def test_required_chunk_count_is_reported_accurately(tokenizer):
    # 10 tokens, window 4, step 3: chunks at 0, 3, 6 → 3 chunks.
    with pytest.raises(TextTooLongError) as excinfo:
        chunk_text(tokenizer, words(10), window=4, overlap=1, max_chunks=2)
    assert excinfo.value.required_chunks == 3


@pytest.mark.parametrize(
    "window, overlap, max_chunks, message",
    [
        (0, 0, 4, "window must be at least 1"),
        (4, 0, 0, "max_chunks must be at least 1"),
        (4, 4, 4, "overlap must be in"),
        (4, 5, 4, "overlap must be in"),
        (4, -1, 4, "overlap must be in"),
    ],
)
def test_invalid_parameters_are_rejected(tokenizer, window, overlap, max_chunks, message):
    with pytest.raises(ValueError, match=message):
        chunk_text(tokenizer, words(20), window=window, overlap=overlap, max_chunks=max_chunks)

# ──────────────────────────────────────────────────────────────────────────
# Provenance: local artefacts must be named by what they are.
# ──────────────────────────────────────────────────────────────────────────


def _model_dir(root, files):
    for name, content in files.items():
        target = root / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content)
    return str(root)


def test_the_digest_is_stable_for_identical_content(tmp_path):
    first = _model_dir(tmp_path / "a", {"config.json": "{}", "head/model.bin": "weights"})
    second = _model_dir(tmp_path / "b", {"config.json": "{}", "head/model.bin": "weights"})

    assert artifact_digest(first) == artifact_digest(second)


def test_changed_weights_change_the_digest(tmp_path):
    original = _model_dir(tmp_path / "a", {"config.json": "{}", "head/model.bin": "weights"})
    tampered = _model_dir(tmp_path / "b", {"config.json": "{}", "head/model.bin": "other!!"})

    # Same file names and the same sizes: only the bytes differ.
    assert artifact_digest(original) != artifact_digest(tampered)


def test_renamed_files_change_the_digest(tmp_path):
    original = _model_dir(tmp_path / "a", {"model.bin": "weights"})
    renamed = _model_dir(tmp_path / "b", {"weights.bin": "weights"})

    assert artifact_digest(original) != artifact_digest(renamed)


def test_moving_content_between_files_changes_the_digest(tmp_path):
    split = _model_dir(tmp_path / "a", {"one": "ab", "two": "cd"})
    shifted = _model_dir(tmp_path / "b", {"one": "abc", "two": "d"})

    # The concatenated bytes are identical; the per-file sizes are not.
    assert artifact_digest(split) != artifact_digest(shifted)


def test_an_empty_or_missing_directory_is_refused(tmp_path):
    empty = tmp_path / "empty"
    empty.mkdir()

    with pytest.raises(ArtifactError):
        artifact_digest(str(empty))
    with pytest.raises(ArtifactError):
        artifact_digest(str(tmp_path / "absent"))


def test_a_local_directory_never_claims_the_published_revision(tmp_path):
    """The failure this guards against.

    TOOL_POISONING_MODEL_REVISION defaults to the published commit, so any
    identity derived from configuration would let an arbitrary directory report
    the official model. Nothing verifies that a mounted directory holds those
    artefacts, so nothing may say that it does.
    """
    directory = _model_dir(tmp_path / "custom", {"config.json": "{}"})

    model, revision = local_identity(directory)

    assert model == f"local:{directory}"
    assert revision.startswith("sha256:")
    assert DEFAULT_MODEL_REVISION not in revision


def test_replicas_with_different_artefacts_report_different_revisions(tmp_path):
    """Two replicas mounting different weights at the same path must not agree.

    The gateway compares the reported model and revision across batches to
    refuse scores that came from different builds. That check is only as good as
    the revision: identical strings for different weights would hide the split.
    """
    first = _model_dir(tmp_path / "replica-a", {"model.bin": "build one"})
    second = _model_dir(tmp_path / "replica-b", {"model.bin": "build two"})

    assert local_identity(first)[1] != local_identity(second)[1]

# ──────────────────────────────────────────────────────────────────────────
# Model loading, contract validation, identity and scoring.
# ──────────────────────────────────────────────────────────────────────────


class StubHead:
    def __init__(self, classes) -> None:
        self.classes_ = classes

    def predict_proba(self, embeddings, **kwargs):  # pragma: no cover - never called here
        raise NotImplementedError


class HeadlessHead:
    def __init__(self, classes) -> None:
        self.classes_ = classes


class StubBody:
    def __init__(self, tokenizer, max_seq_length=384) -> None:
        self.tokenizer = tokenizer
        self.max_seq_length = max_seq_length


class StubSetFitModel:
    """Stands in for SetFitModel with a controllable probability matrix."""

    def __init__(self, tokenizer, classes=(0, 1), rows=None, max_seq_length=384) -> None:
        self.model_head = StubHead(list(classes))
        self.model_body = StubBody(tokenizer, max_seq_length)
        self._rows = rows or {}
        self.seen: list[list[str]] = []

    def predict_proba(self, texts, batch_size=32, as_numpy=True, **kwargs):
        self.seen.append(list(texts))
        return [self._rows.get(text, [0.9, 0.1]) for text in texts]


def loaded_classifier(model, **settings_overrides) -> ToolPoisoningClassifier:
    """Wire a stub model into a classifier without touching load()."""
    classifier = ToolPoisoningClassifier(make_settings(**settings_overrides))
    classifier._model = model
    classifier._tokenizer = model.model_body.tokenizer
    classifier._poisoning_index = resolve_poisoning_index(model)
    classifier._window = 8
    classifier._ready = True
    return classifier


# ── class ordering ───────────────────────────────────────────────────────────


def test_numeric_classes_resolve_to_the_documented_ordering(tokenizer):
    # config_setfit.json for this model sets "labels": null, so the head's
    # classes are the raw training labels documented as {0: Safe, 1: Poisoning}.
    model = StubSetFitModel(tokenizer, classes=(0, 1))
    assert resolve_poisoning_index(model) == 1


def test_textual_labels_resolve_by_name_in_either_order(tokenizer):
    forward = StubSetFitModel(tokenizer, classes=("Safe", "Tool Poisoning"))
    assert resolve_poisoning_index(forward) == 1

    reversed_order = StubSetFitModel(tokenizer, classes=("Tool Poisoning", "Safe"))
    assert resolve_poisoning_index(reversed_order) == 0


def test_textual_labels_are_matched_case_insensitively(tokenizer):
    model = StubSetFitModel(tokenizer, classes=("safe", "TOOL POISONING"))
    assert resolve_poisoning_index(model) == 1


def test_a_missing_head_is_refused(tokenizer):
    model = StubSetFitModel(tokenizer)
    model.model_head = None
    with pytest.raises(ModelContractError, match="no classification head"):
        resolve_poisoning_index(model)


def test_a_head_without_predict_proba_is_refused(tokenizer):
    model = StubSetFitModel(tokenizer)
    model.model_head = HeadlessHead([0, 1])
    with pytest.raises(ModelContractError, match="no predict_proba"):
        resolve_poisoning_index(model)


def test_a_head_without_classes_is_refused(tokenizer):
    model = StubSetFitModel(tokenizer)
    del model.model_head.classes_
    with pytest.raises(ModelContractError, match="no classes_"):
        resolve_poisoning_index(model)


@pytest.mark.parametrize("classes", [(0,), (0, 1, 2), ()])
def test_a_head_that_is_not_binary_is_refused(tokenizer, classes):
    model = StubSetFitModel(tokenizer, classes=classes)
    with pytest.raises(ModelContractError, match="two-class head"):
        resolve_poisoning_index(model)


def test_unrecognisable_class_labels_are_refused_rather_than_guessed(tokenizer):
    # Guessing here would risk returning the Safe probability as the poisoning
    # score, which reads as "everything is fine" for every tool.
    model = StubSetFitModel(tokenizer, classes=("classA", "classB"))
    with pytest.raises(ModelContractError, match="refusing to guess"):
        resolve_poisoning_index(model)


# ── scoring ──────────────────────────────────────────────────────────────────


def test_score_returns_the_poisoning_column(tokenizer):
    model = StubSetFitModel(
        tokenizer,
        classes=(0, 1),
        rows={"safe text": [0.97, 0.03], "bad text": [0.08, 0.92]},
    )
    classifier = loaded_classifier(model)

    assert classifier.score(["safe text", "bad text"]) == pytest.approx([0.03, 0.92])


def test_score_uses_the_resolved_column_when_the_head_is_reversed(tokenizer):
    model = StubSetFitModel(
        tokenizer,
        classes=("Tool Poisoning", "Safe"),
        rows={"bad text": [0.92, 0.08]},
    )
    classifier = loaded_classifier(model)

    assert classifier.score(["bad text"]) == pytest.approx([0.92])


def test_chunk_scores_aggregate_by_maximum(tokenizer):
    # Twelve tokens with a window of 8 and an overlap of 1 gives two chunks.
    text = " ".join(f"w{i}" for i in range(12))
    first = "w0 w1 w2 w3 w4 w5 w6 w7"
    second = "w7 w8 w9 w10 w11"

    model = StubSetFitModel(
        tokenizer,
        rows={first: [0.99, 0.01], second: [0.12, 0.88]},
    )
    classifier = loaded_classifier(model, chunk_overlap_tokens=1, max_chunks_per_item=8)

    assert classifier.score([text]) == pytest.approx([0.88])
    assert model.seen == [[first, second]]


def test_scores_stay_aligned_when_items_chunk_differently(tokenizer):
    short = "w0 w1"
    long_text = " ".join(f"x{i}" for i in range(12))

    model = StubSetFitModel(
        tokenizer,
        rows={
            short: [0.4, 0.6],
            "x0 x1 x2 x3 x4 x5 x6 x7": [0.9, 0.1],
            "x7 x8 x9 x10 x11": [0.2, 0.8],
        },
    )
    classifier = loaded_classifier(model, chunk_overlap_tokens=1, max_chunks_per_item=8)

    assert classifier.score([short, long_text]) == pytest.approx([0.6, 0.8])


def test_score_of_an_empty_list_makes_no_inference_call(tokenizer):
    model = StubSetFitModel(tokenizer)
    classifier = loaded_classifier(model)

    assert classifier.score([]) == []
    assert model.seen == []


def test_text_beyond_the_chunk_budget_is_refused_before_inference(tokenizer):
    model = StubSetFitModel(tokenizer)
    classifier = loaded_classifier(model, chunk_overlap_tokens=1, max_chunks_per_item=1)

    with pytest.raises(TextTooLongError):
        classifier.score([" ".join(f"w{i}" for i in range(50))])
    assert model.seen == [], "nothing may be scored once an item is known to be too long"


def test_one_oversized_item_fails_the_whole_batch_before_inference(tokenizer):
    model = StubSetFitModel(tokenizer)
    classifier = loaded_classifier(model, chunk_overlap_tokens=1, max_chunks_per_item=1)

    with pytest.raises(TextTooLongError):
        classifier.score(["short", " ".join(f"w{i}" for i in range(50))])
    assert model.seen == []


def test_a_probability_outside_the_unit_interval_is_refused(tokenizer):
    model = StubSetFitModel(tokenizer, rows={"x": [0.0, 1.4]})
    classifier = loaded_classifier(model)

    with pytest.raises(ModelContractError, match="outside"):
        classifier.score(["x"])


def test_a_row_without_the_expected_class_count_is_refused(tokenizer):
    model = StubSetFitModel(tokenizer, rows={"x": [0.5]})
    classifier = loaded_classifier(model)

    with pytest.raises(ModelContractError, match="expected the Tool Poisoning class"):
        classifier.score(["x"])


def test_a_row_count_mismatch_is_refused(tokenizer):
    class ShortModel(StubSetFitModel):
        def predict_proba(self, texts, batch_size=32, as_numpy=True, **kwargs):
            return [[0.9, 0.1]]

    classifier = loaded_classifier(ShortModel(tokenizer))
    with pytest.raises(ModelContractError, match="returned 1 rows for 2 chunks"):
        classifier.score(["a", "b"])


def test_scoring_before_load_is_refused():
    classifier = ToolPoisoningClassifier(make_settings())
    with pytest.raises(ModelContractError, match="not loaded"):
        classifier.score(["x"])


# ── window resolution ────────────────────────────────────────────────────────


def test_the_content_window_leaves_room_for_special_tokens():
    from tool_poisoning_classifier.classifier import (
        _count_special_tokens,
        _resolve_max_seq_length,
    )

    tokenizer = StubTokenizer(special_tokens=2)
    model = StubSetFitModel(tokenizer, max_seq_length=384)

    assert _resolve_max_seq_length(model) == 384
    assert _count_special_tokens(tokenizer) == 2


def test_a_body_without_a_sequence_limit_falls_back_to_the_documented_value(tokenizer):
    from tool_poisoning_classifier.classifier import (
        DOCUMENTED_MAX_SEQ_LENGTH,
        _resolve_max_seq_length,
    )

    model = StubSetFitModel(tokenizer)
    model.model_body.max_seq_length = None
    assert _resolve_max_seq_length(model) == DOCUMENTED_MAX_SEQ_LENGTH


# ──────────────────────────────────────────────────────────────────────────
# Concurrency: the tokenizer and the model are shared mutable state.
# ──────────────────────────────────────────────────────────────────────────


class BorrowTrackingTokenizer:
    """A tokenizer that fails the way the real Rust one does.

    `tokenizers` mutates truncation/padding state on the tokenizer object, so
    two threads inside it at once raise RuntimeError("Already borrowed"). This
    stand-in raises the same way, deterministically, whenever a second thread
    enters while another is inside.
    """

    def __init__(self, hold: float = 0.02) -> None:
        self._inside = 0
        self._guard = threading.Lock()
        self._hold = hold
        self.concurrent_entries = 0

    def _enter(self) -> None:
        with self._guard:
            self._inside += 1
            if self._inside > 1:
                self.concurrent_entries += 1
                self._inside -= 1
                raise RuntimeError("Already borrowed")

    def _exit(self) -> None:
        with self._guard:
            self._inside -= 1

    def encode(self, text, add_special_tokens=False):
        self._enter()
        try:
            time.sleep(self._hold)
            return list(range(len(text.split())))
        finally:
            self._exit()

    def decode(self, token_ids, skip_special_tokens=True):
        self._enter()
        try:
            return " ".join(f"t{i}" for i in token_ids)
        finally:
            self._exit()

    def num_special_tokens_to_add(self, pair=False):
        return 2


class BorrowTrackingModel:
    """A SetFit stand-in whose inference also touches the shared tokenizer."""

    def __init__(self, tokenizer, scores=None, fail=False) -> None:
        self.tokenizer = tokenizer
        self.model_body = type("Body", (), {"max_seq_length": 64, "tokenizer": tokenizer})()
        self.model_head = type("Head", (), {"classes_": [0, 1]})()
        self._scores = scores or {}
        self._fail = fail
        self.progress_bar_args = []

    def predict_proba(self, texts, batch_size=32, as_numpy=True, **kwargs):
        self.progress_bar_args.append(kwargs.get("show_progress_bar", "absent"))
        # Real inference tokenizes too — this is the collision the lock prevents.
        self.tokenizer.encode(" ".join(texts))
        if self._fail:
            raise RuntimeError("inference exploded")
        return [[1.0 - self._scores.get(t, 0.1), self._scores.get(t, 0.1)] for t in texts]


def _loaded_classifier(model, tokenizer, **overrides):
    classifier = ToolPoisoningClassifier(make_settings(**overrides))
    classifier._model = model
    classifier._tokenizer = tokenizer
    classifier._poisoning_index = 1
    classifier._window = 32
    classifier._ready = True
    classifier._identity = ModelIdentity(model="m", revision="r")
    return classifier


def test_concurrent_score_calls_never_touch_the_tokenizer_at_once():
    """The failure this guards against is a real 500 seen in live verification.

    Chunking and inference both tokenize. With the lock held only around
    inference, a thread chunking here collided with a thread already inside the
    model and the request failed with RuntimeError: Already borrowed.
    """
    tokenizer = BorrowTrackingTokenizer()
    model = BorrowTrackingModel(tokenizer, scores={})
    classifier = _loaded_classifier(model, tokenizer)

    texts = [f"parameter description number {i} for the report" for i in range(4)]
    results: dict[int, object] = {}
    errors: list[BaseException] = []
    barrier = threading.Barrier(4)

    def run(n):
        try:
            barrier.wait(timeout=5)
            results[n] = classifier.score([texts[n]])
        except BaseException as exc:  # noqa: BLE001 - recorded and re-reported
            errors.append(exc)

    threads = [threading.Thread(target=run, args=(i,)) for i in range(4)]
    for t in threads:
        t.start()
    for t in threads:
        t.join(timeout=30)

    assert not errors, f"concurrent score() raised: {errors}"
    assert tokenizer.concurrent_entries == 0, "two threads entered the tokenizer at once"
    assert len(results) == 4
    for value in results.values():
        assert len(value) == 1 and 0.0 <= value[0] <= 1.0


def test_every_caller_gets_its_own_scores_under_concurrency():
    tokenizer = BorrowTrackingTokenizer(hold=0.005)
    wanted = {"alpha": 0.9, "beta": 0.2, "gamma": 0.5, "delta": 0.05}
    model = BorrowTrackingModel(tokenizer, scores=wanted)
    classifier = _loaded_classifier(model, tokenizer)

    got: dict[str, float] = {}
    lock = threading.Lock()

    def run(text):
        score = classifier.score([text])[0]
        with lock:
            got[text] = score

    threads = [threading.Thread(target=run, args=(t,)) for t in wanted]
    for t in threads:
        t.start()
    for t in threads:
        t.join(timeout=30)

    assert got == pytest.approx(wanted, abs=1e-9)


def test_the_lock_is_released_after_an_exception():
    tokenizer = BorrowTrackingTokenizer(hold=0.0)
    classifier = _loaded_classifier(BorrowTrackingModel(tokenizer, fail=True), tokenizer)

    with pytest.raises(RuntimeError, match="inference exploded"):
        classifier.score(["something"])

    assert not classifier._lock.locked(), "the lock survived an exception"
    # And the instance is still usable afterwards.
    classifier._model = BorrowTrackingModel(tokenizer, scores={"ok": 0.3})
    assert classifier.score(["ok"]) == pytest.approx([0.3])


def test_a_too_long_text_releases_the_lock():
    tokenizer = BorrowTrackingTokenizer(hold=0.0)
    classifier = _loaded_classifier(
        BorrowTrackingModel(tokenizer), tokenizer, max_chunks_per_item=1
    )
    with pytest.raises(TextTooLongError):
        classifier.score([" ".join(f"w{i}" for i in range(500))])
    assert not classifier._lock.locked()


def test_inference_progress_bars_are_disabled():
    """Otherwise sentence-transformers writes a tqdm bar into the service log."""
    tokenizer = BorrowTrackingTokenizer(hold=0.0)
    model = BorrowTrackingModel(tokenizer, scores={"x": 0.1})
    classifier = _loaded_classifier(model, tokenizer)
    classifier.score(["x"])
    assert model.progress_bar_args == [False]
