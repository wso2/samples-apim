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

"""Tests for environment configuration and the dependency verification."""

from __future__ import annotations

import pytest
from conftest import StubClassifier

from tool_poisoning_classifier import config
from tool_poisoning_classifier.config import (
    DEFAULT_MODEL_ID,
    DEFAULT_MODEL_REVISION,
    ConfigError,
    Settings,
    load_settings,
)

# Imported here rather than inside the start-up tests below. main builds the
# application at import time, and clean_environment has already removed the key
# by the time a test body runs: a first import from inside one would raise
# ConfigError before the test could assert anything. Collection happens while
# conftest's key is still set, so this import succeeds whether the file runs
# alone or with the rest of the suite.
from tool_poisoning_classifier.main import create_app


@pytest.fixture(autouse=True)
def clean_environment(monkeypatch):
    """Start every test from an environment with no TOOL_POISONING_* keys."""
    import os

    for key in list(os.environ):
        if key.startswith("TOOL_POISONING_"):
            monkeypatch.delenv(key, raising=False)


def test_defaults_pin_the_model_revision(monkeypatch):
    monkeypatch.setenv("TOOL_POISONING_API_KEY", "k")
    settings = load_settings()

    assert settings.model_id == DEFAULT_MODEL_ID
    assert settings.model_revision == DEFAULT_MODEL_REVISION
    assert settings.model_source == DEFAULT_MODEL_ID


def test_a_local_model_directory_wins_over_the_hub(monkeypatch):
    monkeypatch.setenv("TOOL_POISONING_API_KEY", "k")
    monkeypatch.setenv("TOOL_POISONING_MODEL_DIR", "/models/tool-poisoning")
    settings = load_settings()

    assert settings.loads_from_local_dir
    assert settings.model_source == "/models/tool-poisoning"


def test_settings_cannot_name_the_revision_of_local_artefacts(monkeypatch):
    """MODEL_REVISION defaults to the published commit.

    If the reported revision were derived from configuration, every local
    directory would inherit that default and claim to be the official model. The
    settings object deliberately exposes no such property; local identity is
    resolved from the artefacts at load time.
    """
    monkeypatch.setenv("TOOL_POISONING_API_KEY", "k")
    monkeypatch.setenv("TOOL_POISONING_MODEL_DIR", "/models/tool-poisoning")
    settings = load_settings()

    assert not hasattr(settings, "reported_revision")


def test_an_unpinned_hub_revision_is_refused(monkeypatch):
    monkeypatch.setenv("TOOL_POISONING_API_KEY", "k")
    monkeypatch.setenv("TOOL_POISONING_MODEL_REVISION", "")

    with pytest.raises(ConfigError, match="irreproducible"):
        load_settings()


def test_starting_without_authentication_is_refused(monkeypatch):
    with pytest.raises(ConfigError, match="API_KEY"):
        load_settings()


def test_anonymous_access_must_be_opted_into(monkeypatch):
    monkeypatch.setenv("TOOL_POISONING_ALLOW_ANONYMOUS", "true")
    settings = load_settings()

    assert settings.allow_anonymous
    assert settings.api_key == ""


def test_an_api_key_is_not_stripped(monkeypatch):
    # Trimming would silently authenticate against a different secret than the
    # one the operator configured.
    monkeypatch.setenv("TOOL_POISONING_API_KEY", " padded-key ")
    assert load_settings().api_key == " padded-key "


@pytest.mark.parametrize(
    "value, expected",
    [("true", True), ("TRUE", True), ("1", True), ("yes", True), ("on", True),
     ("false", False), ("0", False), ("no", False), ("off", False)],
)
def test_boolean_parsing(monkeypatch, value, expected):
    monkeypatch.setenv("TOOL_POISONING_API_KEY", "k")
    monkeypatch.setenv("TOOL_POISONING_ALLOW_DEPENDENCY_DRIFT", value)
    assert load_settings().allow_dependency_drift is expected


def test_a_non_boolean_flag_is_refused(monkeypatch):
    monkeypatch.setenv("TOOL_POISONING_API_KEY", "k")
    monkeypatch.setenv("TOOL_POISONING_ALLOW_ANONYMOUS", "maybe")

    with pytest.raises(ConfigError, match="must be a boolean"):
        load_settings()


@pytest.mark.parametrize(
    "name, value, message",
    [
        ("MAX_ITEMS", "0", "between 1 and 512"),
        ("MAX_ITEMS", "not-a-number", "must be an integer"),
        ("MAX_TEXT_BYTES", "10", "between 256"),
        ("MAX_CONCURRENT_REQUESTS", "1000", "between 1 and 64"),
        ("MAX_CHUNKS_PER_ITEM", "0", "between 1 and 1024"),
    ],
)
def test_out_of_range_limits_are_refused(monkeypatch, name, value, message):
    monkeypatch.setenv("TOOL_POISONING_API_KEY", "k")
    monkeypatch.setenv(f"TOOL_POISONING_{name}", value)

    with pytest.raises(ConfigError, match=message):
        load_settings()


def test_a_per_item_limit_above_the_total_is_refused(monkeypatch):
    monkeypatch.setenv("TOOL_POISONING_API_KEY", "k")
    monkeypatch.setenv("TOOL_POISONING_MAX_TEXT_BYTES", "500000")
    monkeypatch.setenv("TOOL_POISONING_MAX_TOTAL_BYTES", "10000")

    with pytest.raises(ConfigError, match="must not exceed"):
        load_settings()


def test_limits_are_read_from_the_environment(monkeypatch):
    monkeypatch.setenv("TOOL_POISONING_API_KEY", "k")
    monkeypatch.setenv("TOOL_POISONING_MAX_ITEMS", "8")
    monkeypatch.setenv("TOOL_POISONING_MAX_CONCURRENT_REQUESTS", "3")
    monkeypatch.setenv("TOOL_POISONING_CHUNK_OVERLAP_TOKENS", "16")

    settings = load_settings()
    assert settings.max_items == 8
    assert settings.max_concurrent_requests == 3
    assert settings.chunk_overlap_tokens == 16


def test_settings_are_immutable():
    settings = Settings(api_key="k")
    with pytest.raises(Exception):
        settings.api_key = "other"  # type: ignore[misc]


# ── application start-up ─────────────────────────────────────────────────────


def test_the_application_refuses_to_start_without_authentication():
    # uvicorn builds the app from the environment at import time, so this is
    # the failure a container sees when it is started without a key.
    with pytest.raises(ConfigError, match="API_KEY"):
        create_app()


def test_the_application_starts_with_an_api_key(monkeypatch):
    monkeypatch.setenv("TOOL_POISONING_API_KEY", "k")
    app = create_app(classifier=StubClassifier())

    assert app.state.settings.api_key == "k"
    assert not app.state.settings.allow_anonymous


def test_the_application_starts_anonymously_only_when_opted_in(monkeypatch):
    monkeypatch.setenv("TOOL_POISONING_ALLOW_ANONYMOUS", "true")
    app = create_app(classifier=StubClassifier())

    assert app.state.settings.allow_anonymous
    assert app.state.settings.api_key == ""


# ── dependency verification ──────────────────────────────────────────────────


def stub_versions(monkeypatch, **versions):
    """Report a stack of installed versions, defaulting to the documented one.

    Pass `package="not installed"` to remove one.
    """
    complete = {
        "setfit": config.REQUIRED_SETFIT_VERSION,
        "transformers": "4.57.6",
        "sentence-transformers": "5.2.3",
        "scikit-learn": config.REQUIRED_SKLEARN_VERSION,
        "torch": "2.4.1",
    }
    complete.update(versions)
    monkeypatch.setattr(config, "installed_versions", lambda: complete)


def test_the_documented_stack_verifies(monkeypatch):
    stub_versions(monkeypatch)
    versions = config.verify_dependencies()
    assert versions["setfit"] == "1.1.3"
    assert versions["scikit-learn"] == "1.8.0"


def test_a_missing_setfit_is_always_fatal(monkeypatch):
    stub_versions(monkeypatch, setfit="not installed")
    with pytest.raises(config.DependencyError, match="setfit is not installed"):
        config.verify_dependencies(allow_drift=True)


def test_a_missing_transformers_is_always_fatal(monkeypatch):
    stub_versions(monkeypatch, transformers="not installed")
    with pytest.raises(config.DependencyError, match="transformers is not installed"):
        config.verify_dependencies(allow_drift=True)


def test_a_setfit_version_mismatch_is_refused(monkeypatch):
    stub_versions(monkeypatch, setfit="1.2.0")
    with pytest.raises(config.DependencyError, match="model card specifies setfit==1.1.3"):
        config.verify_dependencies()


def test_transformers_5_is_refused(monkeypatch):
    stub_versions(monkeypatch, transformers="5.0.0")
    with pytest.raises(config.DependencyError, match="transformers<5.0.0"):
        config.verify_dependencies()


def test_drift_can_be_allowed_explicitly(monkeypatch):
    stub_versions(monkeypatch, setfit="1.2.0")
    versions = config.verify_dependencies(allow_drift=True)
    assert versions["setfit"] == "1.2.0"


def test_a_sklearn_mismatch_is_refused(monkeypatch):
    # The head is an unpickled scikit-learn estimator: a version mismatch is
    # what scikit-learn itself warns "may lead to invalid results".
    stub_versions(monkeypatch, **{"scikit-learn": "1.9.1"})
    with pytest.raises(config.DependencyError, match="model_head.pkl was pickled"):
        config.verify_dependencies()


def test_a_missing_sklearn_is_always_fatal(monkeypatch):
    stub_versions(monkeypatch, **{"scikit-learn": "not installed"})
    with pytest.raises(config.DependencyError, match="scikit-learn is not installed"):
        config.verify_dependencies(allow_drift=True)


def test_every_mismatch_is_reported_at_once(monkeypatch):
    stub_versions(monkeypatch, setfit="1.2.0", transformers="5.0.0", **{"scikit-learn": "1.9.1"})
    with pytest.raises(config.DependencyError) as excinfo:
        config.verify_dependencies()

    message = str(excinfo.value)
    assert "setfit" in message
    assert "transformers" in message
    assert "scikit-learn" in message


def test_the_refusal_names_the_escape_hatch_and_the_recalibration(monkeypatch):
    stub_versions(monkeypatch, setfit="1.2.0")
    with pytest.raises(config.DependencyError) as excinfo:
        config.verify_dependencies()

    message = str(excinfo.value)
    assert "TOOL_POISONING_ALLOW_DEPENDENCY_DRIFT" in message
    assert "classifierThreshold" in message
