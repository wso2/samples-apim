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

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import com.google.gson.JsonSyntaxException;
import com.google.gson.reflect.TypeToken;
import com.jayway.jsonpath.DocumentContext;
import com.jayway.jsonpath.JsonPath;
import org.apache.axis2.AxisFault;
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
import org.wso2.carbon.apimgt.api.APIManagementException;
import org.wso2.carbon.apimgt.api.GuardrailProviderService;
import org.wso2.apim.policies.mediation.ai.pii.masking.guardrailsai.internal.ServiceReferenceHolder;

import java.lang.reflect.Type;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;

/**
 * Regex based PII Masking/Redaction Mediator.
 * <p>
 * A Synapse custom mediator that detects and processes Personally Identifiable Information (PII) in
 * JSON payloads using regex patterns. This mediator can either mask PII by replacing detected values
 * with placeholders (e.g., &lt;Email_0001&gt;) or redact them by replacing matches with fixed strings (e.g., *****).
 *
 * <p>
 * The mediator maintains consistency between request and response flows by tracking masked values using a context
 * property ("PII_ENTITIES") so they can be reversed on the response if needed.
 *
 */
public class PIIMaskingGuardrailsAI extends AbstractMediator implements ManagedLifecycle {
    private static final Log logger = LogFactory.getLog(PIIMaskingGuardrailsAI.class);
    private static final Log guardrailLogger = LogFactory.getLog("guardrail-violations");
    private static final ObjectMapper objectMapper = new ObjectMapper();

    private GuardrailProviderService guardrailProvider;

    private String name;
    private String piiEntities;
    private String jsonPath = "";
    private boolean redact = false;
    private List<String> piiEntityArray;

    /**
     * Initializes the PIIMaskingRegex mediator.
     *
     * @param synapseEnvironment The Synapse environment instance.
     */
    @Override
    public void init(SynapseEnvironment synapseEnvironment) {
        if (logger.isDebugEnabled()) {
            logger.debug("Initializing PIIMaskingRegex.");
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
     * Destroys the PIIMaskingRegex mediator instance and releases any allocated resources.
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
            identifyPIIAndTransform(messageContext);
            String actionMessage = redact ? "Redaction completed successfully " : "Masking completed successfully ";
            actionMessage = actionMessage + "for " + this.name + ".";
            String flow = messageContext.isResponse() ? "response" : "request";
            String guardrailMessage = actionMessage + " In mediation " + flow + ".";
            logGuardrailViolation(messageContext, false, guardrailMessage);
        } catch (Exception e) {
            logger.error("Exception occurred during mediation.", e);

            messageContext.setProperty(SynapseConstants.ERROR_CODE,
                    PIIMaskingGuardrailsAIConstants.APIM_INTERNAL_EXCEPTION_CODE);
            messageContext.setProperty(SynapseConstants.ERROR_MESSAGE, "Error occurred during " +
                            PIIMaskingGuardrailsAIConstants.ADVANCED_PII_SAFETY_BY_WSO2_GUARDRAILS + " mediation");
            Mediator faultMediator = messageContext.getFaultSequence();
            faultMediator.mediate(messageContext);
            logGuardrailViolation(messageContext, true, "Error occurred in " + this.name + ": " + e.getMessage());
            return false; // Stop further mediation
        }
        return true;
    }

    /**
     * Analyzes the payload of the message for patterns defined by the configured PII entities.
     * If a JSON path is specified, analysis is performed only on the extracted value;
     * otherwise, the entire payload is analyzed.
     *
     * @param messageContext The message context containing the payload to analyze
     */
    private void identifyPIIAndTransform(MessageContext messageContext) throws AxisFault, APIManagementException, JsonProcessingException {
        if (logger.isDebugEnabled()) {
            logger.debug("Identifying PIIs.");
        }

        String jsonContent = extractJsonContent(messageContext);
        if (jsonContent == null || jsonContent.isEmpty()) {
            return;
        }

        boolean hasJsonPath = this.jsonPath != null && !this.jsonPath.trim().isEmpty();
        String updatedContent;

        // If no JSON path is specified, apply piiEntities to the entire JSON content
        if (!hasJsonPath) {
            updatedContent = redact ? redactPIIFromContent(jsonContent)
                    : maskPIIFromContent(messageContext, jsonContent);

        } else {
            String content = JsonPath.read(jsonContent, this.jsonPath).toString();

            // Remove quotes at beginning and end
            String cleanedText = content.replaceAll(PIIMaskingGuardrailsAIConstants.TEXT_CLEAN_REGEX, "").trim();

            // Check if any extracted value by json path matches the piiEntities pattern
            updatedContent =  redact ? redactPIIFromContent(cleanedText)
                    : maskPIIFromContent(messageContext, cleanedText);
        }

        if (!updatedContent.isEmpty()) {
            if (hasJsonPath) {
                DocumentContext ctx = JsonPath.parse(jsonContent);
                ctx.set(this.jsonPath, updatedContent);
                updatedContent = ctx.jsonString();
            }

            org.apache.axis2.context.MessageContext axis2MC =
                    ((Axis2MessageContext) messageContext).getAxis2MessageContext();
            JsonUtil.getNewJsonPayload(axis2MC, updatedContent,
                    true, true);
        }
    }

    private String maskPIIFromContent(MessageContext messageContext, String jsonContent) throws APIManagementException, JsonProcessingException {

        if (jsonContent == null || jsonContent.isEmpty()) {
            return "";
        }

        boolean foundAndMasked = false;
        String maskedContent = jsonContent;

        if (!messageContext.isResponse()) {
            Map<String, String> maskedPIIEntities = new LinkedHashMap<>();
            AtomicInteger counter = new AtomicInteger();

            String response = callOut(jsonContent);
            // Parse the response
            JsonNode root = objectMapper.readTree(response);
            // Check verdict
            boolean verdict = root.path("verdict").asBoolean();
            Map<String, Pattern> assessmentMap = new HashMap<>();
            if (verdict) {
                for (JsonNode node : root.path("assessment")) {
                    String piiEntity = node.path("piiEntity").asText();
                    String piiValue = node.path("piiValue").asText();

                    // Compile regex Pattern for the piiValue (literal match, case-sensitive)
                    Pattern pattern = Pattern.compile(Pattern.quote(piiValue));

                    assessmentMap.put(piiEntity, pattern);
                }
            }

            for (Map.Entry<String, Pattern> entry : assessmentMap.entrySet()) {
                String key = entry.getKey();
                Pattern pattern = entry.getValue();
                Matcher matcher = pattern.matcher(maskedContent);

                StringBuilder resultBuffer = new StringBuilder();
                // If pattern matches, replace all occurrences
                while (matcher.find()) {
                    String original = matcher.group();

                    // Reuse if already seen
                    String masked = maskedPIIEntities.get(original);
                    if (masked == null) {
                        // Generate unique placeholder like Person_0001, Email_0001
                        masked = key + "_" + generateHexId(counter);
                        maskedPIIEntities.put(original, masked);
                    }
                    matcher.appendReplacement(resultBuffer, Matcher.quoteReplacement(masked));
                    foundAndMasked = true;
                }
                matcher.appendTail(resultBuffer);
                maskedContent = resultBuffer.toString();
            }
            // Store PII_ENTITIES for later reversal
            if (!maskedPIIEntities.isEmpty()) {
                messageContext.setProperty(PIIMaskingGuardrailsAIConstants.PII_ENTITIES, maskedPIIEntities);
            }

            if (foundAndMasked && logger.isDebugEnabled()) {
                logger.debug("Masked {} PII entities in the request flow.");
            }
        } else {
            Map<String, String> maskedPIIEntities =
                    (Map<String, String>) messageContext.getProperty(PIIMaskingGuardrailsAIConstants.PII_ENTITIES);

            if (maskedPIIEntities != null) {
                for (Map.Entry<String, String> entry : maskedPIIEntities.entrySet()) {
                    String original = entry.getKey();
                    String placeholder = entry.getValue();
                    maskedContent = maskedContent.replace(placeholder, original);
                    foundAndMasked = true;
                }
            }

            if (foundAndMasked && logger.isDebugEnabled()) {
                logger.debug("Replaced masked {} PII entities in the response flow.");
            }
        }

        return foundAndMasked? maskedContent: "";
    }

    private String callOut(String text) throws APIManagementException {
        // Build payload
        Map<String, Object> callOutConfig = new HashMap<>();
        Map<String, Object> requestPayload = new HashMap<>();
        requestPayload.put("text", text);
        requestPayload.put("piiEntities", piiEntityArray);

        callOutConfig.put(PIIMaskingGuardrailsAIConstants.REQUEST_PAYLOAD, requestPayload);
        callOutConfig.put(PIIMaskingGuardrailsAIConstants.RESOURCE,
                PIIMaskingGuardrailsAIConstants.POLICY_RESOURCE);
        return guardrailProvider.callOut(callOutConfig);
    }

    private static String generateHexId(AtomicInteger counter) {
        int count = counter.getAndIncrement();
        return String.format(PIIMaskingGuardrailsAIConstants.HEX_FORMAT, count); // 4-digit hex string, zero-padded
    }

    private String redactPIIFromContent(String jsonContent) throws APIManagementException, JsonProcessingException {
        if (jsonContent == null || jsonContent.isEmpty()) {
            return "";
        }

        boolean foundAndMasked = false;
        String maskedContent = jsonContent;

        String response = callOut(jsonContent);
        // Parse the response
        JsonNode root = objectMapper.readTree(response);
        // Check verdict
        boolean verdict = root.path("verdict").asBoolean();
        Map<String, Pattern> assessmentMap = new HashMap<>();
        if (verdict) {
            for (JsonNode node : root.path("assessment")) {
                String piiEntity = node.path("piiEntity").asText();
                String piiValue = node.path("piiValue").asText();

                // Compile regex Pattern for the piiValue (literal match, case-sensitive)
                Pattern pattern = Pattern.compile(Pattern.quote(piiValue));

                assessmentMap.put(piiEntity, pattern);
            }
        }

        for (Map.Entry<String, Pattern> entry : assessmentMap.entrySet()) {
            Pattern pattern = entry.getValue();
            Matcher matcher = pattern.matcher(maskedContent);

            // If pattern matches, replace all occurrences
            if (matcher.find()) {
                foundAndMasked = true;
                maskedContent = matcher.replaceAll(PIIMaskingGuardrailsAIConstants.REDACT_REPLACEMENT);
            }
        }

        if (foundAndMasked && logger.isDebugEnabled()) {
            logger.debug("Redacted {} PII entities");
        }

        return foundAndMasked? maskedContent: "";
    }

    /**
     * Extracts JSON content from the message context.
     * This utility method converts the Axis2 message payload to a JSON string.
     *
     * @param messageContext The message context containing the JSON payload
     * @return The JSON payload as a string, or null if extraction fails
     */
    public static String extractJsonContent(MessageContext messageContext) {
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

    public String getPiiEntities() {

        return piiEntities;
    }

    public void setPiiEntities(String piiEntities) {

        this.piiEntities = piiEntities;

        try {
            Gson gson = new Gson();
            Type listType = new TypeToken<List<String>>() {}.getType();
            piiEntityArray = gson.fromJson(piiEntities, listType);

            if (piiEntityArray == null || piiEntityArray.isEmpty()) {
                throw new IllegalArgumentException("PII entities list cannot be null or empty");
            }

            if (logger.isDebugEnabled()) {
                logger.debug("PII entity list saved successfully: " + piiEntities);
            }
        } catch (JsonSyntaxException | PatternSyntaxException e) {
            throw new IllegalArgumentException(
                    "Failed to parse PII entity configuration: invalid format or missing fields", e);
        }
    }

    public String getJsonPath() {

        return jsonPath;
    }

    public void setJsonPath(String jsonPath) {

        this.jsonPath = jsonPath;
    }

    public boolean isRedact() {

        return redact;
    }

    public void setRedact(boolean redact) {

        this.redact = redact;
    }
}
