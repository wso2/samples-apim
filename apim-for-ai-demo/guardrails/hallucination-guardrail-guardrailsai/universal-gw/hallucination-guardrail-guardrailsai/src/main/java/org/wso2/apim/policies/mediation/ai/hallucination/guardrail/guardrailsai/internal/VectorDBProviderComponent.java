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

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.component.annotations.ReferenceCardinality;
import org.osgi.service.component.annotations.ReferencePolicy;
import org.wso2.carbon.apimgt.api.VectorDBProviderService;

@Component(
        name = "org.wso2.apim.policies.mediation.ai.hallucination.guardrail.guardrailsai.internal.VectorDBProviderComponent",
        immediate = true
)
public class VectorDBProviderComponent {

    @Reference(
            name = "vector_db.provider.service",
            service = VectorDBProviderService.class,
            cardinality = ReferenceCardinality.MANDATORY,
            policy = ReferencePolicy.DYNAMIC,
            unbind = "unbindProvider"
    )
    protected void bindProvider(VectorDBProviderService provider) {
        ServiceReferenceHolder.getInstance().setVectorDBProvider(provider);
    }

    protected void unbindProvider(VectorDBProviderService provider) {
        ServiceReferenceHolder.getInstance().setVectorDBProvider(null);
    }
}
