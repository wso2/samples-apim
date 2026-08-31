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

package org.wso2.apim.policies.mediation.ai.content.safety.guardrail.guardrailsai;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.http.HttpStatus;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.util.EntityUtils;
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
import org.wso2.carbon.apimgt.impl.APIConstants;
import org.wso2.carbon.apimgt.impl.utils.APIUtil;
import org.wso2.apim.policies.mediation.ai.content.safety.guardrail.guardrailsai.internal.ServiceReferenceHolder;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Content Safety Guardrail mediator.
 */
public class ContentSafetyGuardrailGuardrailsAI extends AbstractMediator implements ManagedLifecycle {
    private static final Log logger = LogFactory.getLog(ContentSafetyGuardrailGuardrailsAI.class);
    private static final Log guardrailLogger = LogFactory.getLog("guardrail-violations");
    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final Map<String, String> categoryMapping = new HashMap<>();

    private GuardrailProviderService guardrailProvider;

    private String name;
    private boolean violentCrimes;              // S1
    private boolean nonViolentCrimes;           // S2
    private boolean sexRelatedCrimes;           // S3
    private boolean childSexualExploitation;    // S4
    private boolean defamation;                 // S5
    private boolean specializedAdvice;          // S6
    private boolean privacy;                    // S7
    private boolean intellectualProperty;       // S8
    private boolean indiscriminateWeapons;      // S9
    private boolean hate;                       // S10
    private boolean suicideAndSelfHarm;         // S11
    private boolean sexualContent;              // S12
    private boolean elections;                  // S13
    private String jsonPath = "";
    private boolean showAssessment = false;
    private boolean passthroughOnError = false;

    /**
     * Initializes the ContentSafetyGuardrailGuardrailsAI mediator.
     *
     * @param synapseEnvironment The Synapse environment instance.
     */
    @Override
    public void init(SynapseEnvironment synapseEnvironment) {
        if (logger.isDebugEnabled()) {
            logger.debug("Initializing ContentSafetyGuardrailGuardrailsAI.");
        }

        guardrailProvider = ServiceReferenceHolder.getInstance().getGuardrailProvider();

        // Only validate vector services if knowledge base connection is enabled
        if (guardrailProvider == null) {
            String errorMsg = "Required services not available. " +
                    ", GuardrailProviderService present: " + false + ".";
            logger.error(errorMsg);
            throw new RuntimeException(errorMsg);
        }


        categoryMapping.put("S1", "Default");
        categoryMapping.put("S2", "Violent Crimes");
        categoryMapping.put("S3", "Non-Violent Crimes");
        categoryMapping.put("S4", "Sex Crimes");
        categoryMapping.put("S5", "Child Exploitation");
        categoryMapping.put("S6", "Defamation");
        categoryMapping.put("S7", "Specialized Advice");
        categoryMapping.put("S8", "Privacy");
        categoryMapping.put("S9", "Intellectual Property");
        categoryMapping.put("S10", "Indiscriminate Weapons");
        categoryMapping.put("S11", "Hate");
        categoryMapping.put("S12", "Self-Harm");
        categoryMapping.put("S13", "Sexual Content");
        categoryMapping.put("S14", "Elections");
    }

    /**
     * Destroys the ContentSafetyGuardrailGuardrailsAI mediator instance and releases any allocated resources.
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
            boolean validationResult = validatePayload(messageContext);

            if (!validationResult) {
                // Set error properties in message context
                messageContext.setProperty(SynapseConstants.ERROR_CODE,
                        ContentSafetyGuardrailGuardrailsAIConstants.GUARDRAIL_APIM_EXCEPTION_CODE);
                messageContext.setProperty(ContentSafetyGuardrailGuardrailsAIConstants.ERROR_TYPE,
                        ContentSafetyGuardrailGuardrailsAIConstants.CONTENT_SAFETY_GUARDRAILS_AI);
                messageContext.setProperty(ContentSafetyGuardrailGuardrailsAIConstants.CUSTOM_HTTP_SC,
                        ContentSafetyGuardrailGuardrailsAIConstants.GUARDRAIL_ERROR_CODE);

                if (logger.isDebugEnabled()) {
                    logger.debug("Validation failed - triggering fault sequence.");
                }
                Mediator faultMediator = messageContext.getSequence(ContentSafetyGuardrailGuardrailsAIConstants.FAULT_SEQUENCE_KEY);
                if (faultMediator == null) {
                    messageContext.setProperty(SynapseConstants.ERROR_MESSAGE, "Violation of " + name + " detected.");
                    faultMediator = messageContext.getFaultSequence(); // Fall back to default error sequence
                }
                faultMediator.mediate(messageContext);
                logGuardrailViolation(messageContext, true, String.valueOf(messageContext.getProperty(SynapseConstants.ERROR_MESSAGE)));
                return false; // Stop further processing
            }
        } catch (Exception e) {
            logger.error("Exception occurred during mediation.", e);
            messageContext.setProperty(SynapseConstants.ERROR_CODE,
                    ContentSafetyGuardrailGuardrailsAIConstants.APIM_INTERNAL_EXCEPTION_CODE);
            messageContext.setProperty(SynapseConstants.ERROR_MESSAGE, "Error occurred during " +
                    ContentSafetyGuardrailGuardrailsAIConstants.CONTENT_SAFETY_GUARDRAILS_AI + " mediation");
            Mediator faultMediator = messageContext.getFaultSequence();
            faultMediator.mediate(messageContext);
            logGuardrailViolation(messageContext, true, e.getMessage());
            return false; // Stop further processing
        }
        // If validation passed, log the successful validation
        logGuardrailViolation(messageContext, false, "");
        return true;
    }

    /**
     * Validates the payload of the message calling out to Guardrails AI Content Safety resource.
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

        String jsonContent = extractJsonContent(messageContext);
        if (jsonContent == null || jsonContent.isEmpty()) {
            return false;
        }

        // If no JSON path is specified, apply validation to the entire JSON content
        if (this.jsonPath == null || this.jsonPath.trim().isEmpty()) {
            return validate(jsonContent, messageContext);
        }

        String content = JsonPath.read(jsonContent, this.jsonPath).toString();

        // Remove quotes at beginning and end
        String cleanedText = content.replaceAll(ContentSafetyGuardrailGuardrailsAIConstants.TEXT_CLEAN_REGEX, "").trim();

        // Perform content safety validation on the cleaned text using the Guardrails AI Content Safety API
        return validate(cleanedText, messageContext);
    }

    private boolean validate(String jsonContent, MessageContext messageContext) throws APIManagementException {
        try {
            String response = callOut(jsonContent);

            // Parse the response
            JsonNode root = objectMapper.readTree(response);
            JsonNode verdictNode = root.path("verdict");
            if (!verdictNode.isBoolean()) {
                throw new APIManagementException("The 'verdict' field is either missing or not a boolean");
            }

            List<String> flaggedCategories = new ArrayList<>();
            // Check verdict
            boolean verdict = verdictNode.asBoolean();
            JsonNode categoriesNode = root.path("categories");
            if (categoriesNode.isArray()) {
                for (JsonNode category : categoriesNode) {
                    flaggedCategories.add(categoryMapping.get(category.asText()));
                }
            }
            flaggedCategories.remove(categoryMapping.get("S1")); // Remove S1 as Llama-Guard hallucinate S1

            if (verdict && !flaggedCategories.isEmpty()) {
                String assessmentObject = buildAssessmentObject(
                        jsonContent, flaggedCategories, messageContext.isResponse());
                messageContext.setProperty(SynapseConstants.ERROR_MESSAGE, assessmentObject);
                return false;
            }

            return true;
        } catch (APIManagementException | JsonProcessingException e) {
            if (!passthroughOnError) {
                logger.error("API call to Content Safety has failed or returned an unexpected response.");
                String assessmentObject = buildAssessmentObject(messageContext.isResponse());
                messageContext.setProperty(SynapseConstants.ERROR_MESSAGE, assessmentObject);
                return false; // Guardrail intervention after maximum retries reached
            } else {
                logger.warn("API call to Content Safety has failed or returned an unexpected response, " +
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
        // Categories map
        Map<String, String> categories = new HashMap<>();
        categories.put("S1", categoryMapping.get("S1")); // Always include default category
        if (violentCrimes) {
            categories.put("S2", categoryMapping.get("S2"));
        }
        if (nonViolentCrimes) {
            categories.put("S3", categoryMapping.get("S3"));
        }
        if (sexRelatedCrimes) {
            categories.put("S4", categoryMapping.get("S4"));
        }
        if (childSexualExploitation) {
            categories.put("S5", categoryMapping.get("S5"));
        }
        if (defamation) {
            categories.put("S6", categoryMapping.get("S6"));
        }
        if (specializedAdvice) {
            categories.put("S7", categoryMapping.get("S7"));
        }
        if (privacy) {
            categories.put("S8", categoryMapping.get("S8"));
        }
        if (intellectualProperty) {
            categories.put("S9", categoryMapping.get("S9"));
        }
        if (indiscriminateWeapons) {
            categories.put("S10", categoryMapping.get("S10"));
        }
        if (hate) {
            categories.put("S11", categoryMapping.get("S11"));
        }
        if (suicideAndSelfHarm) {
            categories.put("S12", categoryMapping.get("S12"));
        }
        if (sexualContent) {
            categories.put("S13", categoryMapping.get("S13"));
        }
        if (elections) {
            categories.put("S14", categoryMapping.get("S14"));
        }
        // Only put categories if not empty
        if (categories.isEmpty()) {
            categories = categoryMapping;
        }
        requestPayload.put("categories", categories);

        callOutConfig.put(ContentSafetyGuardrailGuardrailsAIConstants.REQUEST_PAYLOAD, requestPayload);
        callOutConfig.put(ContentSafetyGuardrailGuardrailsAIConstants.RESOURCE,
                ContentSafetyGuardrailGuardrailsAIConstants.POLICY_RESOURCE);
        return guardrailProvider.callOut(callOutConfig);
    }

    /**
     * Builds a JSON object containing assessment details for guardrail responses.
     * This JSON includes information about why the guardrail intervened.
     *
     * @return A JSON string representing the assessment object
     */
    public String buildAssessmentObject(String content, List<String> flaggedCategories, boolean isResponse) {

        if (logger.isDebugEnabled()) {
            logger.debug("Building guardrail assessment object.");
        }

        JSONObject assessmentObject = new JSONObject();

        assessmentObject.put(ContentSafetyGuardrailGuardrailsAIConstants.ASSESSMENT_ACTION, "GUARDRAIL_INTERVENED");
        assessmentObject.put(ContentSafetyGuardrailGuardrailsAIConstants.INTERVENING_GUARDRAIL, this.name);
        assessmentObject.put(ContentSafetyGuardrailGuardrailsAIConstants.DIRECTION, isResponse ? "RESPONSE" : "REQUEST");
        assessmentObject.put(ContentSafetyGuardrailGuardrailsAIConstants.ASSESSMENT_REASON,
                "Violation of content safety guardrail detected.");

        if (showAssessment && !flaggedCategories.isEmpty()) {
            JSONObject assessmentsWrapper = new JSONObject();
            assessmentsWrapper.put("inspectedContent", content); // Include the original content
            assessmentsWrapper.put("violatedCategories", flaggedCategories);
            assessmentObject.put(ContentSafetyGuardrailGuardrailsAIConstants.ASSESSMENTS, assessmentsWrapper);
        }
        return assessmentObject.toString();
    }

    /**
     * Builds a JSON object containing assessment details for guardrail responses.
     * This JSON includes information about why the guardrail intervened.
     *
     * @return A JSON string representing the assessment object
     */
    public String buildAssessmentObject(boolean isResponse) {

        if (logger.isDebugEnabled()) {
            logger.debug("Building guardrail assessment object.");
        }

        JSONObject assessmentObject = new JSONObject();

        assessmentObject.put(ContentSafetyGuardrailGuardrailsAIConstants.ASSESSMENT_ACTION, "GUARDRAIL_INTERVENED");
        assessmentObject.put(ContentSafetyGuardrailGuardrailsAIConstants.INTERVENING_GUARDRAIL, this.name);
        assessmentObject.put(ContentSafetyGuardrailGuardrailsAIConstants.DIRECTION, isResponse ? "RESPONSE" : "REQUEST");
        assessmentObject.put(ContentSafetyGuardrailGuardrailsAIConstants.ASSESSMENT_REASON,
                "Violation of content safety detected.");

        if (showAssessment) {
            assessmentObject.put(ContentSafetyGuardrailGuardrailsAIConstants.ASSESSMENTS,
                    "Content Safety API is unreachable or returned an invalid response.");
        }
        return assessmentObject.toString();
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

    public boolean isViolentCrimes() {

        return violentCrimes;
    }

    public void setViolentCrimes(boolean violentCrimes) {

        this.violentCrimes = violentCrimes;
    }

    public boolean isNonViolentCrimes() {

        return nonViolentCrimes;
    }

    public void setNonViolentCrimes(boolean nonViolentCrimes) {

        this.nonViolentCrimes = nonViolentCrimes;
    }

    public boolean isSexRelatedCrimes() {

        return sexRelatedCrimes;
    }

    public void setSexRelatedCrimes(boolean sexRelatedCrimes) {

        this.sexRelatedCrimes = sexRelatedCrimes;
    }

    public boolean isChildSexualExploitation() {

        return childSexualExploitation;
    }

    public void setChildSexualExploitation(boolean childSexualExploitation) {

        this.childSexualExploitation = childSexualExploitation;
    }

    public boolean isDefamation() {

        return defamation;
    }

    public void setDefamation(boolean defamation) {

        this.defamation = defamation;
    }

    public boolean isSpecializedAdvice() {

        return specializedAdvice;
    }

    public void setSpecializedAdvice(boolean specializedAdvice) {

        this.specializedAdvice = specializedAdvice;
    }

    public boolean isPrivacy() {

        return privacy;
    }

    public void setPrivacy(boolean privacy) {

        this.privacy = privacy;
    }

    public boolean isIntellectualProperty() {

        return intellectualProperty;
    }

    public void setIntellectualProperty(boolean intellectualProperty) {

        this.intellectualProperty = intellectualProperty;
    }

    public boolean isIndiscriminateWeapons() {

        return indiscriminateWeapons;
    }

    public void setIndiscriminateWeapons(boolean indiscriminateWeapons) {

        this.indiscriminateWeapons = indiscriminateWeapons;
    }

    public boolean isHate() {

        return hate;
    }

    public void setHate(boolean hate) {

        this.hate = hate;
    }

    public boolean isSuicideAndSelfHarm() {

        return suicideAndSelfHarm;
    }

    public void setSuicideAndSelfHarm(boolean suicideAndSelfHarm) {

        this.suicideAndSelfHarm = suicideAndSelfHarm;
    }

    public boolean isSexualContent() {

        return sexualContent;
    }

    public void setSexualContent(boolean sexualContent) {

        this.sexualContent = sexualContent;
    }

    public boolean isElections() {

        return elections;
    }

    public void setElections(boolean elections) {

        this.elections = elections;
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
