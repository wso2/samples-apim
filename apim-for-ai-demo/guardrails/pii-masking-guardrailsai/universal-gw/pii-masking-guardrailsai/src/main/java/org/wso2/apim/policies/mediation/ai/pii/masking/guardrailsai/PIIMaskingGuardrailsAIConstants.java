/*
 * Copyright (c) 2025, WSO2 LLC. (http://www.wso2.com).
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

package org.wso2.apim.policies.mediation.ai.pii.masking.guardrailsai;

public class PIIMaskingGuardrailsAIConstants {
    public static final int APIM_INTERNAL_EXCEPTION_CODE = 900967;
    public static final String TEXT_CLEAN_REGEX = "^\"|\"$";
    public static final String ADVANCED_PII_SAFETY_BY_WSO2_GUARDRAILS = "ADVANCED_PII_GUARDRAIL_BY_WSO2";

    public static final String PII_ENTITIES = "PII_ENTITIES";
    public static final String PII_ENTITY = "piiEntity";
    public static final String PII_REGEX = "piiRegex";
    public static final String HEX_FORMAT = "%04x";
    public static final String REDACT_REPLACEMENT = "*****";
    public static final String REQUEST_PAYLOAD = "request_payload";
    public static final String RESOURCE = "resource";
    public static final String POLICY_RESOURCE = "/validate/pii";
}
