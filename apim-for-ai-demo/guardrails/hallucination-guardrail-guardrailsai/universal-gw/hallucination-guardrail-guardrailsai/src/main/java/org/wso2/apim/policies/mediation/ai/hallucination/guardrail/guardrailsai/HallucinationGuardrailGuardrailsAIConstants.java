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

package org.wso2.apim.policies.mediation.ai.hallucination.guardrail.guardrailsai;

public class HallucinationGuardrailGuardrailsAIConstants {
    public static final int GUARDRAIL_ERROR_CODE = 446;
    public static final int GUARDRAIL_APIM_EXCEPTION_CODE = 900514;
    public static final String ERROR_TYPE = "ERROR_TYPE";
    public static final String CUSTOM_HTTP_SC = "CUSTOM_HTTP_SC";
    public static final String FAULT_SEQUENCE_KEY = "guardrail_fault";
    public static final String ASSESSMENT_ACTION = "action";
    public static final String INTERVENING_GUARDRAIL = "interveningGuardrail";
    public static final String HALLUCINATION_GUARDRAIL_GUARDRAILS_AI = "ADVANCED_HALLUCINATION_GUARDRAIL_BY_WSO2";
    public static final int APIM_INTERNAL_EXCEPTION_CODE = 900967;
    public static final String ASSESSMENT_REASON = "actionReason";
    public static final String DIRECTION = "direction";
    public static final String ASSESSMENTS = "assessments";
    public static final String TEXT_CLEAN_REGEX = "^\"|\"$";
    public static final String CONTEXT = "context";
    public static final String QUESTION = "question";
    public static final String ANSWER = "answer";
    public static final String REQUEST_PAYLOAD = "request_payload";
    public static final String RESOURCE = "resource";
    public static final String POLICY_RESOURCE = "/validate/hallucination";
    public static final String THRESHOLD = "threshold";
    public static final String LIMIT = "limit";
    public static final String METRIC_TYPE = "metricType";
    public static final String OUTPUT_FIELDS = "outputFields";
    public static final String VECTOR_DB_PROVIDER_COLLECTION_NAME = "collectionName";

}
