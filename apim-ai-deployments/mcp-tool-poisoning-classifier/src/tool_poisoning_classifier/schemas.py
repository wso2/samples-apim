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

"""Request and response models for the classifier API."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

MAX_ID_LENGTH = 512


class ClassifyItem(BaseModel):
    """One piece of tool metadata to score.

    The id is opaque to this service and is echoed back unchanged: the gateway
    uses it to tie a score to the exact field it came from.
    """

    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1, max_length=MAX_ID_LENGTH)
    text: str = Field(min_length=1)


class ClassifyRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[ClassifyItem] = Field(min_length=1)


class ClassifyResult(BaseModel):
    """The Tool Poisoning class probability for one item."""

    id: str
    poisoningScore: float  # noqa: N815 - wire field name, matches the gateway policy


class ClassifyResponse(BaseModel):
    model: str
    revision: str
    results: list[ClassifyResult]


class HealthResponse(BaseModel):
    status: str


class ReadyResponse(BaseModel):
    status: str
    model: str | None = None
    revision: str | None = None
    detail: str | None = None
