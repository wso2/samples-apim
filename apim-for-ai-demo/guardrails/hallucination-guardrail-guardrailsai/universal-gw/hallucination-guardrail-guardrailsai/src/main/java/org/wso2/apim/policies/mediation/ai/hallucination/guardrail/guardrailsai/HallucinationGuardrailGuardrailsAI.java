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

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import org.apache.commons.lang.StringUtils;
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
import org.apache.synapse.transport.nhttp.NhttpConstants;
import org.json.JSONArray;
import org.json.JSONObject;
import org.wso2.carbon.apimgt.api.APIManagementException;
import org.wso2.carbon.apimgt.api.GuardrailProviderService;
import org.wso2.carbon.apimgt.api.EmbeddingProviderService;
import org.wso2.carbon.apimgt.api.VectorDBProviderService;
import org.wso2.apim.policies.mediation.ai.hallucination.guardrail.guardrailsai.internal.ServiceReferenceHolder;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

/**
 * Hallucination Guardrail GuardrailsAI mediator.
 */
public class HallucinationGuardrailGuardrailsAI extends AbstractMediator implements ManagedLifecycle {
    private static final Log logger = LogFactory.getLog(HallucinationGuardrailGuardrailsAI.class);
    private static final Log guardrailLogger = LogFactory.getLog("guardrail-violations");
    private static final ObjectMapper objectMapper = new ObjectMapper();

    private VectorDBProviderService vectorDBProvider;
    private EmbeddingProviderService embeddingProvider;
    private GuardrailProviderService guardrailProvider;

    private String name;
    private String jsonPath = "";
    private boolean connectKnowledgeBase = false;
    private boolean showAssessment = false;
    private boolean passthroughOnError = false;
    private String knowledgeBaseCollectionName;
    private final JSONArray outputFields = new JSONArray();

    /**
     * Initializes the HallucinationGuardrailGuardrailsAI mediator.
     *
     * @param synapseEnvironment The Synapse environment instance.
     */
    @Override
    public void init(SynapseEnvironment synapseEnvironment) {
        if (logger.isDebugEnabled()) {
            logger.debug("Initializing HallucinationGuardrailGuardrailsAI.");
        }

        embeddingProvider = ServiceReferenceHolder.getInstance().getEmbeddingProvider();
        vectorDBProvider = ServiceReferenceHolder.getInstance().getVectorDBProvider();
        guardrailProvider = ServiceReferenceHolder.getInstance().getGuardrailProvider();

        // Only validate vector services if knowledge base connection is enabled
        if (connectKnowledgeBase) {
            if (embeddingProvider == null || vectorDBProvider == null || guardrailProvider == null) {
                String errorMsg = "Knowledge base connection enabled but required services not available. " +
                        "EmbeddingProviderService present: " + (embeddingProvider != null) +
                        ", VectorDBProviderService present: " + (vectorDBProvider != null) +
                        ", GuardrailProviderService present: " + (guardrailProvider != null) + ".";
                logger.error(errorMsg);
                throw new RuntimeException(errorMsg);
            }
        }
    }

    /**
     * Destroys the HallucinationGuardrailGuardrailsAI mediator instance and releases any allocated resources.
     */
    @Override
    public void destroy() {
        // No specific resources to release
    }

    @Override
    public boolean mediate(MessageContext messageContext) {
        if (logger.isDebugEnabled()) {
            logger.debug("Beginning mediation in HallucinationGuardrailGuardrailsAI.");
        }

        try {
            if (messageContext.isResponse()) {
                processResponseMessage(messageContext);
            } else {
                processRequestMessage(messageContext);
            }
        } catch (Exception e) {
            logger.error("Exception occurred during mediation.", e);

            messageContext.setProperty(SynapseConstants.ERROR_CODE,
                    HallucinationGuardrailGuardrailsAIConstants.APIM_INTERNAL_EXCEPTION_CODE);
            messageContext.setProperty(SynapseConstants.ERROR_MESSAGE, "Error occurred during " +
                    HallucinationGuardrailGuardrailsAIConstants.HALLUCINATION_GUARDRAIL_GUARDRAILS_AI + " HallucinationGuardrailGuardrailsAI mediation");
            Mediator faultMediator = messageContext.getFaultSequence();
            faultMediator.mediate(messageContext);
            // Log the guardrail violation with the error message
            logGuardrailViolation(messageContext, true, e.getMessage());
            return false; // Stop further processing
        }

        // If validation passed, log the successful validation
        logGuardrailViolation(messageContext, false, "");
        return true;
    }


    /**
     * Processes incoming request messages to extract content for embedding generation.
     * <p>
     * Extracts JSON content from the message context and optionally applies JsonPath
     * expressions to extract specific portions of the payload for embedding.
     *
     * @param messageContext The message context containing the request.
     */
    private void processRequestMessage(MessageContext messageContext){
        org.apache.axis2.context.MessageContext msgCtx =
                ((Axis2MessageContext) messageContext).getAxis2MessageContext();

        String query = extractContent(msgCtx);
        if (query == null) {
            if (logger.isDebugEnabled()) {
                logger.debug("No JSON content found in the message context - skipping query extraction.");
            }
            return;
        }

        messageContext.setProperty(HallucinationGuardrailGuardrailsAIConstants.QUESTION, query);
    }

    /**
     * Processes outgoing response messages for hallucination detection.
     * <p>
     * Validates the response payload against the hosted Guardrails AI hallucination detection model.
     * If a violation is detected, sets error properties in the message context and triggers
     * the configured fault sequence.
     *
     * @param messageContext The message context containing the response.
     * @throws Exception If an error occurs during validation or mediation.
     */
    private void processResponseMessage(MessageContext messageContext) throws Exception {
        if (logger.isDebugEnabled()) {
            logger.debug("Processing response message for hallucination detection.");
        }

        try {
            boolean finalResult = validatePayload(messageContext);

            if (!finalResult) {
                // Set error properties in message context
                messageContext.setProperty(SynapseConstants.ERROR_CODE,
                        HallucinationGuardrailGuardrailsAIConstants.GUARDRAIL_APIM_EXCEPTION_CODE);
                messageContext.setProperty(HallucinationGuardrailGuardrailsAIConstants.ERROR_TYPE, HallucinationGuardrailGuardrailsAIConstants.HALLUCINATION_GUARDRAIL_GUARDRAILS_AI);
                messageContext.setProperty(HallucinationGuardrailGuardrailsAIConstants.CUSTOM_HTTP_SC,
                        HallucinationGuardrailGuardrailsAIConstants.GUARDRAIL_ERROR_CODE);

                // Build assessment details
                String assessmentObject = buildAssessmentObject(messageContext);
                messageContext.setProperty(SynapseConstants.ERROR_MESSAGE, assessmentObject);

                if (logger.isDebugEnabled()) {
                    logger.debug("Validation failed - triggering fault sequence.");
                }
                Mediator faultMediator = messageContext.getSequence(HallucinationGuardrailGuardrailsAIConstants.FAULT_SEQUENCE_KEY);

                if (faultMediator == null) {
                    messageContext.setProperty(SynapseConstants.ERROR_MESSAGE,
                            "Violation of " + name + " detected.");
                    faultMediator = messageContext.getFaultSequence(); // Fall back to default error sequence
                }
                faultMediator.mediate(messageContext);

                logGuardrailViolation(messageContext, true, String.valueOf(messageContext.getProperty(SynapseConstants.ERROR_MESSAGE)));
            }
        } catch (Exception e) {
            throw new Exception("Error occurred during mediation.", e);
        }
    }

    /**
     * Extracts content from the message context for embedding generation.
     * <p>
     * Retrieves JSON content from the message context and optionally applies JsonPath
     * expressions to extract specific portions of the payload for embedding.
     *
     * @param msgCtx The Axis2 message context containing the payload.
     * @return The extracted content string, or null if no JSON content is found.
     */
    private String extractContent(org.apache.axis2.context.MessageContext msgCtx) {
        if (logger.isDebugEnabled()) {
            logger.debug("Extracting content from message context.");
        }

        if (JsonUtil.hasAJsonPayload(msgCtx)) {
            String jsonContent = JsonUtil.jsonPayloadToString(msgCtx);
            if (StringUtils.isBlank(jsonPath)) {
                return jsonContent;
            }

            try {
                String extracted = JsonPath.read(jsonContent, jsonPath).toString();
                return extracted.replaceAll(HallucinationGuardrailGuardrailsAIConstants.TEXT_CLEAN_REGEX, "").trim();
            } catch (Exception e) {
                logger.warn("Failed to extract content using jsonPath: " + jsonPath, e);
                // Fall back to full JSON content
                return jsonContent;
            }
        }
        return null;
    }

    /**
     * Validates the payload of the message against the hosted Guardrails AI hallucination detection model.
     * If a JSON path is specified, validation is performed only on the extracted value,
     * otherwise the entire payload is validated.
     *
     * @param messageContext The message context containing the payload to validate
     * @return {@code true} if the payload matches the pattern, {@code false} otherwise
     */
    private boolean validatePayload(MessageContext messageContext) throws APIManagementException {
        if (logger.isDebugEnabled()) {
            logger.debug("Extracting content for validation.");
        }

        org.apache.axis2.context.MessageContext msgCtx =
                ((Axis2MessageContext) messageContext).getAxis2MessageContext();

        // Optimize HTTP status check
        String statusCode = getHttpStatusCode(msgCtx);
        if (statusCode != null && !"200".equals(statusCode)) {
            if (logger.isDebugEnabled()) {
                logger.debug("Skipping validation due to non-200 HTTP status: " + statusCode);
            }
            return true; // Skip validation for non-200 responses
        }

        String responsePayload = extractContent(msgCtx);
        if (responsePayload == null || responsePayload.isEmpty()) {
            return true;
        }

        String query = "";
        String filteredKnowledgeBase = "";

        Object queryObject = messageContext.getProperty(HallucinationGuardrailGuardrailsAIConstants.QUESTION);
        if (queryObject != null) {
            query = queryObject.toString();
        }

        if (connectKnowledgeBase) {
            if (!query.isEmpty()) {
                double[] embeddings = embeddingProvider.getEmbedding(query);
                if (embeddings != null && embeddings.length != 0) {
                    filteredKnowledgeBase = retrieveAndFilterKnowledgeBase(embeddings);
                }
            }
        }

        try {
            Map<String, Object> callOutConfig = new HashMap<>();
            Map<String, Object> requestPayload = new HashMap<>();

            requestPayload.put(HallucinationGuardrailGuardrailsAIConstants.QUESTION, query);
            requestPayload.put(HallucinationGuardrailGuardrailsAIConstants.ANSWER, responsePayload);
            requestPayload.put(HallucinationGuardrailGuardrailsAIConstants.CONTEXT, filteredKnowledgeBase);

            callOutConfig.put(HallucinationGuardrailGuardrailsAIConstants.REQUEST_PAYLOAD, requestPayload);
            callOutConfig.put(HallucinationGuardrailGuardrailsAIConstants.RESOURCE,
                    HallucinationGuardrailGuardrailsAIConstants.POLICY_RESOURCE);
            String response = guardrailProvider.callOut(callOutConfig);
            return processValidationResponse(response, messageContext);
        } catch (APIManagementException | JsonProcessingException e) {
            return handleValidationError(messageContext, e);
        }
    }

    /**
     * Extracts HTTP status code from message context.
     */
    private String getHttpStatusCode(org.apache.axis2.context.MessageContext msgCtx) {
        Object httpStatus = msgCtx.getProperty(NhttpConstants.HTTP_SC);
        if (httpStatus instanceof String) {
            return ((String) httpStatus).trim();
        } else if (httpStatus != null) {
            return String.valueOf(httpStatus);
        }
        return null;
    }

    /**
     * Retrieves and filters knowledge base entries.
     */
    private String retrieveAndFilterKnowledgeBase(double[] embeddings) throws APIManagementException {
        // Create parameters map with constants
        Map<String, Object> extraParams = new HashMap<>();
        extraParams.put(HallucinationGuardrailGuardrailsAIConstants.VECTOR_DB_PROVIDER_COLLECTION_NAME,
                knowledgeBaseCollectionName);
        extraParams.put(HallucinationGuardrailGuardrailsAIConstants.THRESHOLD, 0.35);
        extraParams.put(HallucinationGuardrailGuardrailsAIConstants.LIMIT, 5);
        extraParams.put(HallucinationGuardrailGuardrailsAIConstants.METRIC_TYPE, "L2");
        extraParams.put(HallucinationGuardrailGuardrailsAIConstants.OUTPUT_FIELDS, outputFields);

        String knowledgeBaseString = vectorDBProvider.retrieve(embeddings, "", extraParams);
        if (knowledgeBaseString == null || knowledgeBaseString.isEmpty()) {
            return "";
        }

        JSONArray knowledgeBase = new JSONArray(knowledgeBaseString);

        if (outputFields.isEmpty()) {
            return knowledgeBase.toString();
        }

        JSONArray filteredKnowledgeBase = new JSONArray();
        for (int i = 0; i < knowledgeBase.length(); i++) {
            JSONObject item = knowledgeBase.getJSONObject(i);
            JSONObject filteredItem = new JSONObject();
            for (Object fieldObj : outputFields) {
                String field = fieldObj.toString();
                if (item.has(field)) {
                    filteredItem.put(field, item.get(field));
                }
            }
            filteredKnowledgeBase.put(filteredItem);
        }

        return filteredKnowledgeBase.toString();
    }

    /**
     * Processes the validation response from the external service.
     */
    private boolean processValidationResponse(String response, MessageContext messageContext)
            throws JsonProcessingException, APIManagementException {
        JsonNode root = objectMapper.readTree(response);
        JsonNode verdictNode = root.path("verdict");

        if (!verdictNode.isBoolean()) {
            throw new APIManagementException("The 'verdict' field is either missing or not a boolean");
        }

        boolean verdict = verdictNode.asBoolean();
        if (logger.isDebugEnabled()) {
            logger.debug("Guardrails AI hallucination detection verdict: " + verdict);
        }

        if (verdict) {
            String reason = root.path("reason").asText();
            messageContext.setProperty("HALLUCINATION_REASON", reason);
            if (logger.isDebugEnabled()) {
                logger.debug("Guardrails AI hallucination detection reason: " + reason);
            }
            return false;
        }

        return true;
    }

    /**
     * Handles validation errors based on configuration.
     */
    private boolean handleValidationError(MessageContext messageContext, Exception e) {
        if (!passthroughOnError) {
            logger.error("API call to hallucination detection resource has failed or returned an unexpected response.");
            messageContext.setProperty("GUARDRAILS_AI_MAX_RETRY_FAIL", true);
            return false; // Guardrail intervention after maximum retries reached
        } else {
            logger.warn("API call to hallucination resource has failed or returned an unexpected response, " +
                       "but continuing processing.");
            return true;
        }
    }

    /**
     * Logs guardrail violation events for monitoring and audit purposes.
     */
    public void logGuardrailViolation(MessageContext messageContext, boolean verdict, String violationMessage) {
        long timestamp = System.currentTimeMillis();
        // Extract API name from messageContext
        String apiName = (String) messageContext.getProperty("SYNAPSE_REST_API"); // adjust key as per your context
        String status = verdict ? "|VALIDATION FAILED|" : "|VALIDATION PASSED|";
        String logLine = timestamp + "|" + apiName + status + violationMessage;
        // Log it
        guardrailLogger.info(logLine);
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

        assessmentObject.put(HallucinationGuardrailGuardrailsAIConstants.ASSESSMENT_ACTION, "GUARDRAIL_INTERVENED");
        assessmentObject.put(HallucinationGuardrailGuardrailsAIConstants.INTERVENING_GUARDRAIL, name);
        assessmentObject.put(HallucinationGuardrailGuardrailsAIConstants.DIRECTION, messageContext.isResponse()? "RESPONSE" : "REQUEST");
        assessmentObject.put(HallucinationGuardrailGuardrailsAIConstants.ASSESSMENT_REASON, "Hallucinated response detected.");

        if (showAssessment) {
            if (messageContext.getProperty("GUARDRAILS_AI_MAX_RETRY_FAIL") != null && (boolean) messageContext.getProperty("GUARDRAILS_AI_MAX_RETRY_FAIL")) {
                assessmentObject.put(HallucinationGuardrailGuardrailsAIConstants.ASSESSMENTS, "Hallucination detection resource failure after maximum retries.");
            } else {
                assessmentObject.put(HallucinationGuardrailGuardrailsAIConstants.ASSESSMENTS, "Hallucinated response detected with reason: " + messageContext.getProperty("HALLUCINATION_REASON"));
            }
        }
        return assessmentObject.toString();
    }

    public String getName() {

        return name;
    }

    public void setName(String name) {

        this.name = name;
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

    public boolean isConnectKnowledgeBase() {

        return connectKnowledgeBase;
    }

    public void setConnectKnowledgeBase(boolean connectKnowledgeBase) {

        this.connectKnowledgeBase = connectKnowledgeBase;
    }

    public String getKnowledgeBaseCollectionName() {

        return knowledgeBaseCollectionName;
    }

    public void setKnowledgeBaseCollectionName(String knowledgeBaseCollectionName) {

        this.knowledgeBaseCollectionName = knowledgeBaseCollectionName;
    }

    public JSONArray getOutputFields() {

        return outputFields;
    }

    public void setOutputFields(String outputFieldsString) {

        String[] fieldsArray = outputFieldsString.split(",");
        ArrayList<String> fieldsList = new ArrayList<>();
        for (String field : fieldsArray) {
            String trimmedField = field.trim();
            if (!trimmedField.isEmpty()) {
                outputFields.put(trimmedField);
            }
        }
    }
}
