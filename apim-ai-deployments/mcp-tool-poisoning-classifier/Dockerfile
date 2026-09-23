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

# Python 3.11 matches the environment the model was trained in (3.11.10).
# Pinned by the multi-architecture index digest so a rebuild cannot silently
# pick up a different base. Update the tag and the digest together.
FROM python:3.11.16-slim-bookworm@sha256:a36c24f9cbdf4fd0f52d67f0823eeac19c2028c637cecc392d97f980d4fec56b

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1 \
    HF_HOME=/models

WORKDIR /app

RUN groupadd --system --gid 10001 classifier \
    && useradd --system --create-home --no-log-init --uid 10001 --gid 10001 classifier

# Bake the model into the image by default so the running service needs no
# egress to huggingface.co — the point of hosting the classifier internally.
# Build with --build-arg PREFETCH_MODEL=false --build-arg HF_HUB_OFFLINE=0 to
# download at first start instead; the container then needs a writable,
# ideally persistent, /models.
#
# This runs before the dependency install so that changing a Python dependency
# does not re-download half a gigabyte of weights. A branch or tag name is
# refused as MODEL_REVISION: only a full commit hash pins the weights.
ARG PREFETCH_MODEL=true
ARG MODEL_ID=wso2/tool-poisoning-detection
ARG MODEL_REVISION=1d62fb57258ee41c3e3ebe8520faad633de12ac2
RUN case "$PREFETCH_MODEL" in \
        true|false) ;; \
        *) echo "PREFETCH_MODEL must be true or false, got '$PREFETCH_MODEL'" >&2; exit 1 ;; \
    esac \
    && if ! printf '%s' "$MODEL_REVISION" | grep -Eq '^[0-9a-f]{40}$'; then \
        echo "MODEL_REVISION must be a full 40-character commit hash, got '$MODEL_REVISION'" >&2; \
        exit 1; \
    fi \
    && pip install "huggingface-hub>=0.34,<1.0" \
    && if [ "$PREFETCH_MODEL" = "true" ]; then \
        python -c "import sys; from huggingface_hub import snapshot_download; \
snapshot_download(repo_id=sys.argv[1], revision=sys.argv[2])" \
            "$MODEL_ID" "$MODEL_REVISION" \
        && chmod -R a+rX /models; \
    else \
        install -d -o 10001 -g 10001 /models; \
    fi

# Keep the service off the Hub at run time. Declared after the download above,
# which would otherwise run offline too. An image built without the model must
# be allowed to fetch it, so that combination is refused at build time rather
# than failing at start-up.
ARG HF_HUB_OFFLINE=1
RUN if [ "$PREFETCH_MODEL" = "false" ] && [ "$HF_HUB_OFFLINE" != "0" ]; then \
        echo "PREFETCH_MODEL=false requires --build-arg HF_HUB_OFFLINE=0" >&2; \
        exit 1; \
    fi
ENV HF_HUB_OFFLINE=${HF_HUB_OFFLINE}

# Install the CPU build of torch explicitly. The default PyPI wheel on linux
# pulls the CUDA runtime, which adds gigabytes this service cannot use.
RUN pip install --index-url https://download.pytorch.org/whl/cpu "torch>=2.4,<3.0"

COPY requirements.txt ./
RUN pip install -r requirements.txt

COPY pyproject.toml README.md ./
COPY src ./src
COPY scripts ./scripts
RUN pip install --no-deps .

ENV TOOL_POISONING_MODEL_ID=${MODEL_ID} \
    TOOL_POISONING_MODEL_REVISION=${MODEL_REVISION}

LABEL org.opencontainers.image.title="mcp-tool-poisoning-classifier" \
      org.opencontainers.image.description="Internal classifier for the MCP tool poisoning guardrail" \
      org.opencontainers.image.source="https://github.com/wso2/samples-apim" \
      org.opencontainers.image.licenses="Apache-2.0" \
      org.wso2.tool-poisoning.model-id="${MODEL_ID}" \
      org.wso2.tool-poisoning.model-revision="${MODEL_REVISION}" \
      org.wso2.tool-poisoning.model-baked="${PREFETCH_MODEL}"

USER 10001:10001

EXPOSE 8080

# Liveness only — readiness (model loaded) is checked by the orchestrator
# against /readyz.
#
# The model loads in the ASGI lifespan, and uvicorn binds the listening socket
# only after that completes. During the load the port therefore refuses
# connections rather than answering /readyz with 503; both endpoints appear at
# the same moment. The start period must comfortably exceed the load time or
# the healthcheck counts failures against a container that is loading normally.
HEALTHCHECK --interval=30s --timeout=5s --start-period=120s --retries=3 \
    CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8080/healthz', timeout=4)"]

# Exec form: uvicorn is PID 1 and receives SIGTERM directly, so it stops
# accepting connections and lets in-flight requests finish before exiting.
CMD ["uvicorn", "tool_poisoning_classifier.main:app", "--host", "0.0.0.0", "--port", "8080"]
