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

"""Shared fixtures.

Every test runs against stubs rather than the real model: the suite stays fast,
deterministic, and runnable without downloading half a gigabyte of weights. The
real model is exercised separately by scripts/smoke_test.py.
"""

from __future__ import annotations

import os
import sys
import threading
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

# tool_poisoning_classifier.main builds the ASGI application at import time, so
# that a bad configuration fails the container's startup rather than its first
# request. Importing it here therefore needs an environment that loads. Tests
# that care about configuration set their own and never see this value; this
# only keeps collection from depending on the developer's shell.
os.environ.setdefault("TOOL_POISONING_API_KEY", "conftest-import-key")

from tool_poisoning_classifier.classifier import ModelIdentity  # noqa: E402
from tool_poisoning_classifier.config import Settings  # noqa: E402

TEST_MODEL = "wso2/tool-poisoning-detection"
TEST_REVISION = "1d62fb57258ee41c3e3ebe8520faad633de12ac2"


class StubClassifier:
    """A Classifier that scores by keyword instead of by model."""

    def __init__(
        self,
        *,
        ready: bool = True,
        scorer=None,
        model: str = TEST_MODEL,
        revision: str = TEST_REVISION,
    ) -> None:
        self._ready = ready
        self._scorer = scorer or (lambda text: 0.99 if "poison" in text.lower() else 0.01)
        self._identity = ModelIdentity(model=model, revision=revision)
        self.calls: list[list[str]] = []
        self.max_in_flight = 0
        self._in_flight = 0
        self._lock = threading.Lock()

    @property
    def ready(self) -> bool:
        return self._ready

    @property
    def identity(self) -> ModelIdentity:
        return self._identity

    def score(self, texts: list[str]) -> list[float]:
        with self._lock:
            self.calls.append(list(texts))
            self._in_flight += 1
            self.max_in_flight = max(self.max_in_flight, self._in_flight)
        try:
            return [self._scorer(text) for text in texts]
        finally:
            with self._lock:
                self._in_flight -= 1


class StubTokenizer:
    """A whitespace tokenizer with the API surface chunking needs."""

    def __init__(self, special_tokens: int = 2) -> None:
        self.special_tokens = special_tokens
        self._vocabulary: list[str] = []

    def encode(self, text: str, add_special_tokens: bool = True) -> list[int]:
        ids = []
        for word in text.split():
            if word not in self._vocabulary:
                self._vocabulary.append(word)
            ids.append(self._vocabulary.index(word))
        if add_special_tokens:
            ids = [-1, *ids, -2]
        return ids

    def decode(self, token_ids: list[int], skip_special_tokens: bool = True) -> str:
        return " ".join(
            self._vocabulary[token_id] for token_id in token_ids if token_id >= 0
        )

    def num_special_tokens_to_add(self, pair: bool = False) -> int:
        return self.special_tokens


def make_settings(**overrides) -> Settings:
    """Settings with authentication on and small, easily exercised limits."""
    defaults = dict(
        model_id=TEST_MODEL,
        model_revision=TEST_REVISION,
        api_key="test-key",
        max_items=4,
        max_text_bytes=1024,
        max_total_bytes=4096,
        max_chunks_per_item=4,
        chunk_overlap_tokens=1,
        max_concurrent_requests=2,
    )
    defaults.update(overrides)
    return Settings(**defaults)


@pytest.fixture
def stub_classifier() -> StubClassifier:
    return StubClassifier()


@pytest.fixture
def tokenizer() -> StubTokenizer:
    return StubTokenizer()
