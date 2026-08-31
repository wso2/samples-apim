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

package org.wso2.apim.policies.mediation.ai.jailbreak.guardrail.guardrailsai;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.synapse.ManagedLifecycle;
import org.apache.synapse.Mediator;
import org.apache.synapse.MessageContext;
import org.apache.synapse.SynapseConstants;
import org.apache.synapse.commons.json.JsonUtil;
import org.apache.synapse.core.SynapseEnvironment;
import org.apache.synapse.core.axis2.Axis2MessageContext;
import org.apache.synapse.mediators.AbstractMediator;
import org.json.JSONObject;
import org.wso2.carbon.apimgt.api.APIManagementException;
import org.wso2.carbon.apimgt.api.GuardrailProviderService;
import org.wso2.apim.policies.mediation.ai.jailbreak.guardrail.guardrailsai.internal.ServiceReferenceHolder;

import java.util.HashMap;
import java.util.Map;

/**
 * Jailbreak Guardrail GuardrailsAI mediator.
 */
public class JailbreakGuardrailGuardrailsAI extends AbstractMediator implements ManagedLifecycle {
    private static final Log logger = LogFactory.getLog(JailbreakGuardrailGuardrailsAI.class);
    private static final Log guardrailLogger = LogFactory.getLog("guardrail-violations");
    private static final ObjectMapper objectMapper = new ObjectMapper();

    private GuardrailProviderService guardrailProvider;

    private String name;
    private int threshold = 90;
    private String jsonPath = "";
    private boolean showAssessment = false;
    private boolean passthroughOnError = false;

    /**
     * Initializes the JailbreakGuardrailGuardrailsAI mediator.
     *
     * @param synapseEnvironment The Synapse environment instance.
     */
    @Override
    public void init(SynapseEnvironment synapseEnvironment) {
        if (logger.isDebugEnabled()) {
            logger.debug("Initializing JailbreakGuardrailGuardrailsAI.");
        }

        guardrailProvider = ServiceReferenceHolder.getInstance().getGuardrailProvider();

        // Only validate vector services if knowledge base connection is enabled
        if (guardrailProvider == null) {
            String errorMsg = "Required services not available. " +
                    ", GuardrailProviderService present: " + false + ".";
            logger.error(errorMsg);
            throw new RuntimeException(errorMsg);
        }

    }

    /**
     * Destroys the JailbreakGuardrailGuardrailsAI mediator instance and releases any allocated resources.
     */
    @Override
    public void destroy() {
        // No specific resources to release
    }

    @Override
    public boolean mediate(MessageContext messageContext) {
        if (logger.isDebugEnabled()) {
            logger.debug("Beginning payload validation.");
        }

        try {
            boolean finalResult = validatePayload(messageContext);

            if (!finalResult) {
                // Set error properties in message context
                messageContext.setProperty(SynapseConstants.ERROR_CODE,
                        JailbreakGuardrailGuardrailsAIConstants.GUARDRAIL_APIM_EXCEPTION_CODE);
                messageContext.setProperty(JailbreakGuardrailGuardrailsAIConstants.ERROR_TYPE, JailbreakGuardrailGuardrailsAIConstants.JAILBREAK_GUARDRAILS_AI);
                messageContext.setProperty(JailbreakGuardrailGuardrailsAIConstants.CUSTOM_HTTP_SC,
                        JailbreakGuardrailGuardrailsAIConstants.GUARDRAIL_ERROR_CODE);

                // Build assessment details
                String assessmentObject = buildAssessmentObject(messageContext);
                messageContext.setProperty(SynapseConstants.ERROR_MESSAGE, assessmentObject);

                if (logger.isDebugEnabled()) {
                    logger.debug("Validation failed - triggering fault sequence.");
                }

                Mediator faultMediator = messageContext.getSequence(JailbreakGuardrailGuardrailsAIConstants.FAULT_SEQUENCE_KEY);
                if (faultMediator == null) {
                    messageContext.setProperty(SynapseConstants.ERROR_MESSAGE,
                            "Violation of " + name + " detected.");
                    faultMediator = messageContext.getFaultSequence(); // Fall back to default error sequence
                }

                faultMediator.mediate(messageContext);
                logGuardrailViolation(messageContext, true, String.valueOf(messageContext.getProperty(SynapseConstants.ERROR_MESSAGE)));
                return false; // Stop further processing
            }
        } catch (Exception e) {
            logger.error("Exception occurred during mediation.", e);

            messageContext.setProperty(SynapseConstants.ERROR_CODE,
                    JailbreakGuardrailGuardrailsAIConstants.APIM_INTERNAL_EXCEPTION_CODE);
            messageContext.setProperty(SynapseConstants.ERROR_MESSAGE, "Error occurred during " +
                    JailbreakGuardrailGuardrailsAIConstants.JAILBREAK_GUARDRAILS_AI + " mediation");
            Mediator faultMediator = messageContext.getFaultSequence();
            faultMediator.mediate(messageContext);
            logGuardrailViolation(messageContext, true, e.getMessage());
            return false; // Stop further processing
        }
        logGuardrailViolation(messageContext, false, "");
        return true;
    }

    /**
     * Validates the payload of the message against the hosted Guardrails AI jailbreak detection model.
     * If a JSON path is specified, validation is performed only on the extracted value,
     * otherwise the entire payload is validated.
     *
     * @param messageContext The message context containing the payload to validate
     * @return {@code true} if the payload matches the pattern, {@code false} otherwise
     */
    private boolean validatePayload(MessageContext messageContext) {
        if (logger.isDebugEnabled()) {
            logger.debug("Extracting content for validation.");
        }

        String jsonContent = extractJsonContent(messageContext);
        if (jsonContent == null || jsonContent.isEmpty()) {
            return false;
        }

        try {
            String response;
            // If no JSON path is specified, apply regex to the entire JSON content
            if (jsonPath == null || jsonPath.trim().isEmpty()) {
                response = callOut(jsonContent);
            } else {
                String content = JsonPath.read(jsonContent, jsonPath).toString();
                // Remove quotes at beginning and end
                String cleanedText = content.replaceAll(JailbreakGuardrailGuardrailsAIConstants.TEXT_CLEAN_REGEX, "").trim();
                response = callOut(cleanedText);
            }

            // Parse the response
            JsonNode root = objectMapper.readTree(response);
            // Check verdict
            JsonNode verdictNode = root.path("verdict");
            if (!verdictNode.isBoolean()) {
                throw new APIManagementException("The 'verdict' field is either missing or not a boolean");
            }
            boolean verdict = verdictNode.asBoolean();

            if (logger.isDebugEnabled()) {
                logger.debug("Prompt injection detection verdict: " + verdict);
            }

            if (verdict) {
                // If verdict is true, extract the score
                double score = root.path("score").asDouble();
                messageContext.setProperty("JAILBREAK_ATTEMPT_SCORE", score);
                if (logger.isDebugEnabled()) {
                    logger.debug("Prompt injection detection score: " + score);
                }

                // Check if the score below the threshold
                if (score*100 <= threshold) {
                    return true; // Allow processing if score is below threshold
                }

                if (logger.isDebugEnabled()) {
                    logger.debug("Prompt injection attempt detected.");
                }
                return false;
            }
        } catch (APIManagementException | JsonProcessingException e) {
            if (!passthroughOnError) {
                logger.error("API call to " + JailbreakGuardrailGuardrailsAIConstants.JAILBREAK_GUARDRAILS_AI + " has failed or returned an unexpected response.");
                messageContext.setProperty("GUARDRAILS_AI_MAX_RETRY_FAIL", true);
                return false; // Guardrail intervention after maximum retries reached
            } else {
                logger.warn("API call to " + JailbreakGuardrailGuardrailsAIConstants.JAILBREAK_GUARDRAILS_AI + " has failed or returned an unexpected response, " +
                        "but continuing processing.");
            }
        }

        return true; // Continue processing if passthroughOnError is true
    }

    private String callOut(String text) throws APIManagementException {

        // Build payload
        Map<String, Object> callOutConfig = new HashMap<>();
        Map<String, Object> requestPayload = new HashMap<>();
        requestPayload.put("text", text);

        callOutConfig.put(JailbreakGuardrailGuardrailsAIConstants.REQUEST_PAYLOAD, requestPayload);
        callOutConfig.put(JailbreakGuardrailGuardrailsAIConstants.RESOURCE,
                JailbreakGuardrailGuardrailsAIConstants.POLICY_RESOURCE);
        return guardrailProvider.callOut(callOutConfig);
    }

    /**
     * Extracts JSON content from the message context.
     * This utility method converts the Axis2 message payload to a JSON string.
     *
     * @param messageContext The message context containing the JSON payload
     * @return The JSON payload as a string, or null if extraction fails
     */
    private String extractJsonContent(MessageContext messageContext) {
        org.apache.axis2.context.MessageContext axis2MC =
                ((Axis2MessageContext) messageContext).getAxis2MessageContext();
        return JsonUtil.jsonPayloadToString(axis2MC);
    }

    /**
     * Builds a JSON object containing assessment details for guardrail responses.
     * This JSON includes information about why the guardrail intervened.
     *
     * @return A JSON string representing the assessment object
     */
    private String buildAssessmentObject(MessageContext messageContext) {
        if (logger.isDebugEnabled()) {
            logger.debug("Building guardrail assessment object.");
        }

        JSONObject assessmentObject = new JSONObject();

        assessmentObject.put(JailbreakGuardrailGuardrailsAIConstants.ASSESSMENT_ACTION, "GUARDRAIL_INTERVENED");
        assessmentObject.put(JailbreakGuardrailGuardrailsAIConstants.INTERVENING_GUARDRAIL, name);
        assessmentObject.put(JailbreakGuardrailGuardrailsAIConstants.DIRECTION, messageContext.isResponse()? "RESPONSE" : "REQUEST");
        assessmentObject.put(JailbreakGuardrailGuardrailsAIConstants.ASSESSMENT_REASON, "Prompt injection attempt detected.");

        if (showAssessment) {
            if (messageContext.getProperty("GUARDRAILS_AI_MAX_RETRY_FAIL") != null && (boolean) messageContext.getProperty("GUARDRAILS_AI_MAX_RETRY_FAIL")) {
                assessmentObject.put(JailbreakGuardrailGuardrailsAIConstants.ASSESSMENTS, "Prompt injection detection resource failure after maximum retries.");
            } else {
                assessmentObject.put(JailbreakGuardrailGuardrailsAIConstants.ASSESSMENTS, "Prompt injection score: " + messageContext.getProperty("JAILBREAK_ATTEMPT_SCORE") + " detected beyond allowed threshold: " + threshold);
            }
        }
        return assessmentObject.toString();
    }

    public void logGuardrailViolation(MessageContext messageContext, boolean verdict, String violationMessage) {
        long timestamp = System.currentTimeMillis();
        // Extract API name from messageContext
        String apiName = (String) messageContext.getProperty("SYNAPSE_REST_API"); // adjust key as per your context
        String status = verdict? "|VALIDATION FAILED|": "|VALIDATION PASSED|";
        String logLine = timestamp + "|" + apiName + status + violationMessage;
        // Log it
        guardrailLogger.info(logLine);
    }

    public String getName() {

        return name;
    }

    public void setName(String name) {

        this.name = name;
    }

    public int getThreshold() {

        return threshold;
    }

    public void setThreshold(int threshold) {

        this.threshold = threshold;
    }

    public String getJsonPath() {

        return jsonPath;
    }

    public void setJsonPath(String jsonPath) {

        this.jsonPath = jsonPath;
    }

    public boolean isShowAssessment() {

        return showAssessment;
    }

    public void setShowAssessment(boolean showAssessment) {

        this.showAssessment = showAssessment;
    }

    public boolean isPassthroughOnError() {

        return passthroughOnError;
    }

    public void setPassthroughOnError(boolean passthroughOnError) {

        this.passthroughOnError = passthroughOnError;
    }
}
