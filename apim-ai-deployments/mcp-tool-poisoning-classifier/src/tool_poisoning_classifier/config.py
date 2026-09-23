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

"""Configuration: the environment the service runs with, and the dependency
versions the model card requires it to run against."""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from importlib import metadata

LOGGER = logging.getLogger(__name__)

ENV_PREFIX = "TOOL_POISONING_"

# The published SetFit model and the commit this service is built against.
# Pinning the revision keeps scores reproducible: an unpinned `main` can change
# the model under a threshold that was calibrated against a different one.
DEFAULT_MODEL_ID = "wso2/tool-poisoning-detection"
DEFAULT_MODEL_REVISION = "1d62fb57258ee41c3e3ebe8520faad633de12ac2"


class ConfigError(ValueError):
    """Raised when the environment configuration cannot be used."""


@dataclass(frozen=True)
class Settings:
    """Runtime configuration.

    Every field maps to a ``TOOL_POISONING_*`` environment variable.
    """

    # Model source. model_dir wins over the Hub when set, and when it does,
    # model_id and model_revision describe nothing that was loaded: the reported
    # identity comes from the artefacts on disk instead.
    model_id: str = DEFAULT_MODEL_ID
    model_revision: str = DEFAULT_MODEL_REVISION
    model_dir: str = ""
    device: str = "cpu"

    # Authentication. The service refuses to start without a key unless
    # anonymous access is explicitly allowed.
    api_key: str = ""
    allow_anonymous: bool = False

    # Dependency pinning. The model card states setfit==1.1.3 and
    # transformers<5.0.0; drift is refused unless explicitly allowed.
    allow_dependency_drift: bool = False

    # Input bounds.
    max_items: int = 32
    max_text_bytes: int = 100_000
    max_total_bytes: int = 1_000_000

    # Chunking bounds. Text longer than the model's sequence limit is split
    # into overlapping windows; an item needing more than max_chunks_per_item
    # windows is rejected rather than truncated.
    max_chunks_per_item: int = 24
    chunk_overlap_tokens: int = 64

    # Concurrency bounds.
    max_concurrent_requests: int = 4
    inference_batch_size: int = 32

    log_level: str = "INFO"

    @property
    def model_source(self) -> str:
        """The path or repo id SetFit is loaded from."""
        return self.model_dir or self.model_id

    @property
    def loads_from_local_dir(self) -> bool:
        return bool(self.model_dir)

    # There is deliberately no `reported_revision` here. A local directory has
    # no revision that configuration alone can know: MODEL_REVISION defaults to
    # the published commit, so deriving the reported revision from settings let
    # any directory claim to be the official model. The identity of local
    # artefacts is computed from the artefacts themselves, at load time, by
    # classifier.local_identity.


def _env(name: str, default: str) -> str:
    return os.environ.get(ENV_PREFIX + name, default).strip()


def _env_bool(name: str, default: bool) -> bool:
    raw = _env(name, "true" if default else "false").lower()
    if raw in ("true", "1", "yes", "on"):
        return True
    if raw in ("false", "0", "no", "off"):
        return False
    raise ConfigError(f"{ENV_PREFIX}{name} must be a boolean, got {raw!r}")


def _env_int(name: str, default: int, minimum: int, maximum: int) -> int:
    raw = _env(name, str(default))
    try:
        value = int(raw)
    except ValueError as exc:
        raise ConfigError(f"{ENV_PREFIX}{name} must be an integer, got {raw!r}") from exc
    if not minimum <= value <= maximum:
        raise ConfigError(
            f"{ENV_PREFIX}{name} must be between {minimum} and {maximum}, got {value}"
        )
    return value


def load_settings() -> Settings:
    """Build settings from the environment, failing fast on a bad value."""
    settings = Settings(
        model_id=_env("MODEL_ID", DEFAULT_MODEL_ID),
        model_revision=_env("MODEL_REVISION", DEFAULT_MODEL_REVISION),
        model_dir=_env("MODEL_DIR", ""),
        device=_env("DEVICE", "cpu"),
        api_key=os.environ.get(ENV_PREFIX + "API_KEY", ""),
        allow_anonymous=_env_bool("ALLOW_ANONYMOUS", False),
        allow_dependency_drift=_env_bool("ALLOW_DEPENDENCY_DRIFT", False),
        max_items=_env_int("MAX_ITEMS", 32, 1, 512),
        max_text_bytes=_env_int("MAX_TEXT_BYTES", 100_000, 256, 5_000_000),
        max_total_bytes=_env_int("MAX_TOTAL_BYTES", 1_000_000, 1024, 50_000_000),
        max_chunks_per_item=_env_int("MAX_CHUNKS_PER_ITEM", 24, 1, 1024),
        chunk_overlap_tokens=_env_int("CHUNK_OVERLAP_TOKENS", 64, 0, 512),
        max_concurrent_requests=_env_int("MAX_CONCURRENT_REQUESTS", 4, 1, 64),
        inference_batch_size=_env_int("INFERENCE_BATCH_SIZE", 32, 1, 512),
        log_level=_env("LOG_LEVEL", "INFO").upper(),
    )

    if not settings.model_source:
        raise ConfigError(
            f"one of {ENV_PREFIX}MODEL_ID or {ENV_PREFIX}MODEL_DIR must be set"
        )
    if not settings.loads_from_local_dir and not settings.model_revision:
        raise ConfigError(
            f"{ENV_PREFIX}MODEL_REVISION must be set when loading from the Hub: an "
            "unpinned revision makes scores irreproducible"
        )
    if not settings.api_key and not settings.allow_anonymous:
        raise ConfigError(
            f"{ENV_PREFIX}API_KEY must be set, or {ENV_PREFIX}ALLOW_ANONYMOUS must be "
            "set to true to serve unauthenticated requests"
        )
    if settings.max_text_bytes > settings.max_total_bytes:
        raise ConfigError(
            f"{ENV_PREFIX}MAX_TEXT_BYTES must not exceed {ENV_PREFIX}MAX_TOTAL_BYTES"
        )

    return settings


# ──────────────────────────────────────────────────────────────────────────
# Dependency verification: the model card pins the stack these scores were
# calibrated against, and drift is refused rather than discovered later.
# ──────────────────────────────────────────────────────────────────────────


# Versions the model card states.
REQUIRED_SETFIT_VERSION = "1.1.3"
MAX_TRANSFORMERS_MAJOR = 5

# Not stated on the card, but recorded in model_head.pkl itself: unpickling it
# under any other version raises scikit-learn's InconsistentVersionWarning,
# which warns of "breaking code or invalid results". A guardrail must not act on
# scores from a head that may have been rehydrated incorrectly.
REQUIRED_SKLEARN_VERSION = "1.8.0"

# Reported for operator visibility; not constrained.
OBSERVED_PACKAGES = (
    "setfit",
    "transformers",
    "sentence-transformers",
    "scikit-learn",
    "torch",
)


class DependencyError(RuntimeError):
    """Raised when the installed stack cannot be trusted with this model."""


def installed_versions() -> dict[str, str]:
    """Report the installed version of each package the model depends on."""
    versions: dict[str, str] = {}
    for package in OBSERVED_PACKAGES:
        try:
            versions[package] = metadata.version(package)
        except metadata.PackageNotFoundError:
            versions[package] = "not installed"
    return versions


def _major(version: str) -> int:
    head = version.split(".", 1)[0]
    digits = "".join(character for character in head if character.isdigit())
    if not digits:
        raise DependencyError(f"cannot read a major version from {version!r}")
    return int(digits)


def verify_dependencies(*, allow_drift: bool = False) -> dict[str, str]:
    """Check the installed stack against the model card and report versions.

    With allow_drift set, a mismatch is logged as a warning instead of raising.
    An unreadable or missing package is always fatal — there is nothing to
    check against.
    """
    versions = installed_versions()
    LOGGER.info("dependency versions: %s", versions)

    problems: list[str] = []

    setfit_version = versions["setfit"]
    if setfit_version == "not installed":
        raise DependencyError("setfit is not installed")
    if setfit_version != REQUIRED_SETFIT_VERSION:
        problems.append(
            f"setfit {setfit_version} is installed; the model card specifies "
            f"setfit=={REQUIRED_SETFIT_VERSION}"
        )

    transformers_version = versions["transformers"]
    if transformers_version == "not installed":
        raise DependencyError("transformers is not installed")
    if _major(transformers_version) >= MAX_TRANSFORMERS_MAJOR:
        problems.append(
            f"transformers {transformers_version} is installed; the model card "
            f"specifies transformers<{MAX_TRANSFORMERS_MAJOR}.0.0"
        )

    sklearn_version = versions["scikit-learn"]
    if sklearn_version == "not installed":
        raise DependencyError("scikit-learn is not installed; the model head needs it")
    if sklearn_version != REQUIRED_SKLEARN_VERSION:
        problems.append(
            f"scikit-learn {sklearn_version} is installed; model_head.pkl was pickled "
            f"by scikit-learn {REQUIRED_SKLEARN_VERSION} and unpickling it under "
            "another version may produce invalid results"
        )

    if problems:
        message = "; ".join(problems)
        if not allow_drift:
            raise DependencyError(
                f"{message}. Set TOOL_POISONING_ALLOW_DEPENDENCY_DRIFT=true to start "
                "anyway, and re-calibrate classifierThreshold before relying on the scores."
            )
        LOGGER.warning("dependency drift allowed by configuration: %s", message)

    return versions
