/*
 * Copyright (c) 2025 WSO2 LLC. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

package org.wso2.apim.policies.mediation.ai.hallucination.guardrail.guardrailsai.internal;

import org.wso2.carbon.apimgt.api.EmbeddingProviderService;
import org.wso2.carbon.apimgt.api.GuardrailProviderService;
import org.wso2.carbon.apimgt.api.VectorDBProviderService;

public class ServiceReferenceHolder {
    private static final ServiceReferenceHolder instance = new ServiceReferenceHolder();

    private EmbeddingProviderService embeddingProvider;
    private VectorDBProviderService vectorDBProvider;
    private GuardrailProviderService guardrailProvider;

    private ServiceReferenceHolder() {
    }

    public static ServiceReferenceHolder getInstance() {
        return instance;
    }

    public EmbeddingProviderService getEmbeddingProvider() {
        return embeddingProvider;
    }

    public void setEmbeddingProvider(EmbeddingProviderService embeddingProvider) {
        this.embeddingProvider = embeddingProvider;
    }

    public VectorDBProviderService getVectorDBProvider() {
        return vectorDBProvider;
    }

    public void setVectorDBProvider(VectorDBProviderService vectorDBProvider) {
        this.vectorDBProvider = vectorDBProvider;
    }

    public GuardrailProviderService getGuardrailProvider() {
        return guardrailProvider;
    }

    public void setGuardrailProvider(GuardrailProviderService guardrailProvider) {
        this.guardrailProvider = guardrailProvider;
    }
}
