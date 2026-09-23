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

"""The deployment files agree with the service and stay internal.

The pinned model, the dependency pins and the exposure rules are repeated
across the Dockerfile, the Compose file, the Kubernetes manifest and the
package metadata. These checks fail when one copy drifts from the others.
"""

from __future__ import annotations

import re
from pathlib import Path

import pytest

from tool_poisoning_classifier import config

ROOT = Path(__file__).resolve().parents[1]


def read(name: str) -> str:
    return (ROOT / name).read_text(encoding="utf-8")


def code_lines(name: str) -> list[str]:
    """Non-comment lines, stripped."""
    lines = (line.strip() for line in read(name).splitlines())
    return [line for line in lines if line and not line.startswith("#")]


# ── model pin ────────────────────────────────────────────────────────────────


@pytest.mark.parametrize(
    "name",
    ["Dockerfile", "docker-compose.yaml", "deploy/kubernetes.yaml", ".env.example"],
)
def test_every_deployment_file_pins_the_service_default_revision(name):
    revisions = set(re.findall(r"\b[0-9a-f]{40}\b", read(name)))
    assert revisions == {config.DEFAULT_MODEL_REVISION}


@pytest.mark.parametrize(
    "name",
    ["Dockerfile", "docker-compose.yaml", "deploy/kubernetes.yaml", ".env.example"],
)
def test_every_deployment_file_names_the_service_default_model(name):
    assert config.DEFAULT_MODEL_ID in read(name)


# ── dependency pins ──────────────────────────────────────────────────────────


def test_requirements_pin_what_the_service_verifies_at_startup():
    requirements = code_lines("requirements.txt")
    assert f"setfit=={config.REQUIRED_SETFIT_VERSION}" in requirements
    assert f"scikit-learn=={config.REQUIRED_SKLEARN_VERSION}" in requirements
    assert f"transformers>=4.57,<{config.MAX_TRANSFORMERS_MAJOR}.0.0" in requirements


def test_pyproject_declares_the_same_runtime_dependencies_as_requirements():
    pyproject = read("pyproject.toml")
    for requirement in code_lines("requirements.txt"):
        assert f'"{requirement}"' in pyproject, requirement


# ── image ────────────────────────────────────────────────────────────────────


def test_the_base_image_is_pinned_by_digest():
    base = next(line for line in code_lines("Dockerfile") if line.startswith("FROM "))
    assert re.fullmatch(r"FROM python:3\.11\.\d+-slim-\w+@sha256:[0-9a-f]{64}", base)


def test_the_image_runs_offline_and_as_non_root_by_default():
    lines = code_lines("Dockerfile")
    assert "ARG PREFETCH_MODEL=true" in lines
    assert "ARG HF_HUB_OFFLINE=1" in lines
    assert "ENV HF_HUB_OFFLINE=${HF_HUB_OFFLINE}" in lines
    assert "USER 10001:10001" in lines
    assert "EXPOSE 8080" in lines


def test_the_build_context_is_an_allow_list():
    lines = code_lines(".dockerignore")
    assert lines[0] == "*", "the build context must start from nothing"
    assert "!.env" not in lines and "!tests/" not in lines


# ── Compose ──────────────────────────────────────────────────────────────────


def test_compose_publishes_on_loopback_only():
    mapping = re.compile(r'- "?[\w.\[\]:]*\d+:\d+"?')
    ports = [line for line in code_lines("docker-compose.yaml") if mapping.fullmatch(line)]
    assert ports == ['- "127.0.0.1:8101:8080"']


def test_compose_requires_the_api_key_and_never_enables_anonymous_access():
    compose = read("docker-compose.yaml")
    assert "TOOL_POISONING_API_KEY: ${TOOL_POISONING_API_KEY:?" in compose
    assert "ALLOW_ANONYMOUS" not in compose


def test_the_env_example_ships_no_credential():
    # A placeholder value would satisfy Compose's ${...:?} check, so an unedited
    # copy of this file would start the service with a key published here.
    values = dict(line.split("=", 1) for line in code_lines(".env.example"))
    assert values["TOOL_POISONING_API_KEY"] == ""
    assert "TOOL_POISONING_ALLOW_ANONYMOUS" not in values


# ── Kubernetes ───────────────────────────────────────────────────────────────


def test_kubernetes_creates_only_internal_resources():
    lines = code_lines("deploy/kubernetes.yaml")
    kinds = [line.split(":", 1)[1].strip() for line in lines if line.startswith("kind:")]
    assert sorted(kinds) == ["Deployment", "NetworkPolicy", "PodDisruptionBudget", "Service"]

    exposure = {"type: ClusterIP", "type: NodePort", "type: LoadBalancer", "type: ExternalName"}
    assert [line for line in lines if line in exposure] == ["type: ClusterIP"]
    assert not any(line.startswith(("hostPort:", "hostNetwork:")) for line in lines)


def test_kubernetes_reads_the_api_key_from_a_secret():
    manifest = read("deploy/kubernetes.yaml")
    key_env = manifest.split("- name: TOOL_POISONING_API_KEY", 1)[1].split("- name:", 1)[0]
    assert "secretKeyRef:" in key_env
    assert "value:" not in key_env
    assert "ALLOW_ANONYMOUS" not in manifest


def test_kubernetes_runs_two_replicas_offline():
    lines = code_lines("deploy/kubernetes.yaml")
    assert "replicas: 2" in lines
    offline = lines.index("- name: HF_HUB_OFFLINE")
    assert lines[offline + 1] == 'value: "1"'
