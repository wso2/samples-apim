/*
 * Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com).
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
package org.wso2.am.analytics.publisher.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.http.HttpStatus;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.wso2.am.analytics.publisher.client.newrelic.NewRelicEvent;
import org.wso2.am.analytics.publisher.exception.MetricReportingException;
import org.wso2.am.analytics.publisher.reporter.MetricEventBuilder;
import org.wso2.am.analytics.publisher.util.Constants;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * HTTP client for publishing analytics events to New Relic Events API.
 * 
 */
public class NewRelicClient {
    
    private static final Logger log = LogManager.getLogger(NewRelicClient.class);
    private static final String NEW_RELIC_ENDPOINT = "https://insights-collector.newrelic.com/v1/accounts/events";
    private static final String API_KEY_HEADER = "X-Insert-Key";
    private static final String CONTENT_TYPE_HEADER = "Content-Type";
    private static final String APPLICATION_JSON = "application/json";
    
    private final String newrelicKey;
    private final ObjectMapper objectMapper;
    private final CloseableHttpClient httpClient;

    /**
     * Constructs a New Relic client with the specified license key.
     * 
     * <p>Initializes the HTTP client and JSON object mapper for communicating
     * with the New Relic Events API. The license key is used for authentication
     * in all API requests.</p>
     * 
     * @param newrelicKey The New Relic License Key for API authentication
     * @throws IllegalArgumentException if newrelicKey is null or empty
     */
    public NewRelicClient(String newrelicKey) {
        if (newrelicKey == null || newrelicKey.trim().isEmpty()) {
            throw new IllegalArgumentException("New Relic key cannot be null or empty");
        }
        this.newrelicKey = newrelicKey;
        this.objectMapper = new ObjectMapper();
        this.httpClient = HttpClients.createDefault();
    }

    /**
     * Publishes a single analytics event to New Relic Events API.
     * 
     * <p>Converts the metric event builder data into New Relic's expected JSON format
     * and submits it via HTTP POST. The event type and all attributes are placed
     * at the root level of the JSON payload as required by the New Relic Events API.</p>
     * 
     * @param builder The metric event builder containing event data
     * @throws MetricReportingException if event publishing fails due to network issues,
     *                                  serialization errors, or API errors
     */
    public void publish(MetricEventBuilder builder) throws MetricReportingException {
        try {
            Map<String, Object> eventData = builder.build();
            NewRelicEvent event = createSimpleEvent(eventData);
            
            // Convert to New Relic Event API format (attributes at root level)
            Map<String, Object> eventMap = new java.util.HashMap<>();
            eventMap.put("eventType", event.getEventType());
            
            // Add all attributes directly to root level (not nested in "attributes")
            for (Map.Entry<String, Object> attr : event.getAttributes().entrySet()) {
                eventMap.put(attr.getKey(), attr.getValue());
            }
            
            String jsonPayload = objectMapper.writeValueAsString(eventMap);
            sendToNewRelic(jsonPayload);
            
        } catch (Exception e) {
            log.error("Failed to publish single event to New Relic", e);
            throw new MetricReportingException("Failed to publish event to New Relic: " + e.getMessage(), e);
        }
    }

    /**
     * Publishes a batch of analytics events to New Relic Events API.
     * 
     * <p>Optimizes API usage by publishing multiple events in a single HTTP request
     * when possible. For single events, delegates to the individual publish method.
     * For multiple events, uses batch processing to minimize API calls.</p>
     * 
     * @param builders List of metric event builders containing event data
     * @throws MetricReportingException if batch publishing fails
     */
    public void publishBatch(List<MetricEventBuilder> builders) throws MetricReportingException {
        if (builders == null || builders.isEmpty()) {
            log.debug("No events to publish in batch");
            return;
        }
        
        try {
            if (builders.size() == 1) {
                publish(builders.get(0));
                log.debug("Published single event as individual request to New Relic");
            } else {
                publishTrueBatch(builders);
                log.debug("Successfully published batch of {} events to New Relic in single HTTP request", 
                    builders.size());
            }
        } catch (Exception e) {
            log.error("Failed to publish batch to New Relic", e);
            throw new MetricReportingException("Failed to publish batch to New Relic: " + e.getMessage(), e);
        }
    }

    /**
     * TRUE BATCH PROCESSING: Sends multiple events in a single HTTP request as JSON array.
     * This is much more efficient than sending individual HTTP requests for each event.
     * 
     * New Relic Event API accepts JSON arrays like: [{"eventType":"APIAnalyticsEvent",...}, {...}]
     */
    private void publishTrueBatch(List<MetricEventBuilder> builders) throws MetricReportingException {
        try {
            java.util.List<java.util.Map<String, Object>> eventsArray = new java.util.ArrayList<>();
            
            // Build all events into a list of maps for JSON serialization
            for (MetricEventBuilder builder : builders) {
                Map<String, Object> eventData = builder.build();
                NewRelicEvent event = createSimpleEvent(eventData);
                
                // Convert NewRelicEvent to proper New Relic Event API format
                // NEW RELIC FORMAT: All attributes at ROOT level, NOT nested in "attributes"
                java.util.Map<String, Object> eventMap = new java.util.HashMap<>();
                eventMap.put("eventType", event.getEventType());
                
                // Add all attributes directly to the root level (NOT nested in "attributes")
                for (Map.Entry<String, Object> attr : event.getAttributes().entrySet()) {
                    eventMap.put(attr.getKey(), attr.getValue());
                }
                
                eventsArray.add(eventMap);
            }
            
            // Use Jackson ObjectMapper to serialize the array to JSON
            ObjectMapper objectMapper = new ObjectMapper();
            String batchPayload = objectMapper.writeValueAsString(eventsArray);
            
            // Send entire batch as single HTTP request
            sendToNewRelic(batchPayload);
            
            log.debug("Successfully sent batch of {} events to New Relic", eventsArray.size());
            
        } catch (Exception e) {
            log.error("Failed to publish true batch to New Relic", e);
            throw new MetricReportingException("Failed to publish true batch to New Relic: " + e.getMessage(), e);
        }
    }



    private NewRelicEvent createSimpleEvent(Map<String, Object> eventData) {
        NewRelicEvent event = new NewRelicEvent("APIAnalyticsEvent");
        
        // ⭐ CRITICAL METRICS: Add request count and other essential metrics for analytics
        event.addAttribute("requestCount", 1); // Each event represents 1 API request
        event.addAttribute("timestamp", System.currentTimeMillis()); // Explicit timestamp for New Relic
        
        // Add success/failure flags for easier querying
        Object proxyResponseCode = eventData.get(Constants.PROXY_RESPONSE_CODE);
        if (proxyResponseCode instanceof Number) {
            int responseCode = ((Number) proxyResponseCode).intValue();
            event.addAttribute("isSuccess", responseCode >= 200 && responseCode < 400);
            event.addAttribute("isError", responseCode >= 400);
            event.addAttribute("isServerError", responseCode >= 500);
        }
        
        // Map common fields from APIM to New Relic format
        addAttributeIfPresent(eventData, event, Constants.API_ID, "apiId");
        addAttributeIfPresent(eventData, event, Constants.API_NAME, "apiName");
        addAttributeIfPresent(eventData, event, Constants.API_VERSION, "apiVersion");
        addAttributeIfPresent(eventData, event, Constants.API_CONTEXT, "apiContext");
        addAttributeIfPresent(eventData, event, Constants.API_METHOD, "apiMethod");
        addAttributeIfPresent(eventData, event, Constants.API_RESOURCE_TEMPLATE, "apiResourceTemplate");
        addAttributeIfPresent(eventData, event, Constants.API_CREATION, "apiCreator");
        addAttributeIfPresent(eventData, event, Constants.API_CREATOR_TENANT_DOMAIN, "apiCreatorTenantDomain");
        addAttributeIfPresent(eventData, event, Constants.APPLICATION_ID, "applicationId");
        addAttributeIfPresent(eventData, event, Constants.APPLICATION_NAME, "applicationName");
        addAttributeIfPresent(eventData, event, Constants.APPLICATION_OWNER, "applicationOwner");
        addAttributeIfPresent(eventData, event, Constants.CORRELATION_ID, "correlationId");
        addAttributeIfPresent(eventData, event, Constants.KEY_TYPE, "keyType");
        addAttributeIfPresent(eventData, event, Constants.USER_NAME, "userName");
        addAttributeIfPresent(eventData, event, Constants.USER_IP, "userIp");
        addAttributeIfPresent(eventData, event, Constants.USER_AGENT_HEADER, "userAgent");
        addAttributeIfPresent(eventData, event, Constants.REQUEST_TIMESTAMP, "requestTimestamp");
        addAttributeIfPresent(eventData, event, Constants.RESPONSE_LATENCY, "responseLatency");
        addAttributeIfPresent(eventData, event, Constants.BACKEND_LATENCY, "backendLatency");
        addAttributeIfPresent(eventData, event, Constants.REQUEST_MEDIATION_LATENCY, "requestMediationLatency");
        addAttributeIfPresent(eventData, event, Constants.RESPONSE_MEDIATION_LATENCY, "responseMediationLatency");
        addAttributeIfPresent(eventData, event, Constants.TARGET_RESPONSE_CODE, "targetResponseCode");
        addAttributeIfPresent(eventData, event, Constants.PROXY_RESPONSE_CODE, "proxyResponseCode");
        addAttributeIfPresent(eventData, event, Constants.DESTINATION, "destination");
        addAttributeIfPresent(eventData, event, Constants.ORGANIZATION_ID, "organizationId");
        addAttributeIfPresent(eventData, event, Constants.ENVIRONMENT_ID, "environmentId");
        addAttributeIfPresent(eventData, event, Constants.REGION_ID, "regionId");
        addAttributeIfPresent(eventData, event, Constants.GATEWAY_TYPE, "gatewayType");
        
        // Add additional important fields that might be missing
        addAttributeIfPresent(eventData, event, Constants.RESPONSE_CACHE_HIT, "responseCacheHit");
        addAttributeIfPresent(eventData, event, Constants.API_TYPE, "apiType");
        addAttributeIfPresent(eventData, event, Constants.PLATFORM, "platform");
        
        // Handle error fields if present
        addAttributeIfPresent(eventData, event, Constants.ERROR_CODE, "errorCode");
        addAttributeIfPresent(eventData, event, Constants.ERROR_MESSAGE, "errorMessage");
        addAttributeIfPresent(eventData, event, Constants.ERROR_TYPE, "errorType");
        
        // Add properties as nested attributes with ArrayList conversion
        if (eventData.containsKey(Constants.PROPERTIES)) {
            Object propertiesObj = eventData.get(Constants.PROPERTIES);
            if (propertiesObj instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> properties = (Map<String, Object>) propertiesObj;
                for (Map.Entry<String, Object> entry : properties.entrySet()) {
                    // QUICK FIX: Convert property values to supported types
                    Object convertedValue = convertToSupportedType(entry.getValue());
                    event.addAttribute("prop_" + entry.getKey(), convertedValue);
                }
            }
        }
        
        return event;
    }

    private void addAttributeIfPresent(Map<String, Object> source, NewRelicEvent target, 
                                      String sourceKey, String targetKey) {
        Object value = source.get(sourceKey);
        if (value != null) {
            Object convertedValue = convertToSupportedType(value);
            target.addAttribute(targetKey, convertedValue);
        }
    }
    
    /**
     * This fixes the "Unsupported attribute type for key 'uriTemplates'. Found: ArrayList" error.
     */
    private Object convertToSupportedType(Object value) {
        // Already supported types
        if (value instanceof String || value instanceof Number || value instanceof Boolean) {
            return value;
        }
        
        // Convert ArrayList/List to comma-separated string
        if (value instanceof java.util.List) {
            java.util.List<?> list = (java.util.List<?>) value;
            if (list.isEmpty()) {
                return "";
            }
            return list.stream()
                    .map(Object::toString)
                    .collect(java.util.stream.Collectors.joining(", "));
        }
        
        // Convert arrays to comma-separated strings
        if (value != null && value.getClass().isArray()) {
            Object[] array = (Object[]) value;
            if (array.length == 0) {
                return "";
            }
            return java.util.Arrays.stream(array)
                    .map(Object::toString)
                    .collect(java.util.stream.Collectors.joining(", "));
        }
        
        // Convert any other object to string
        return value != null ? value.toString() : "";
    }

    private void sendToNewRelic(String jsonPayload) throws IOException {
        HttpPost request = new HttpPost(NEW_RELIC_ENDPOINT);
        request.setHeader(API_KEY_HEADER, newrelicKey);
        request.setHeader(CONTENT_TYPE_HEADER, APPLICATION_JSON);
        request.setEntity(new StringEntity(jsonPayload));

        try (CloseableHttpResponse response = httpClient.execute(request)) {
            int statusCode = response.getStatusLine().getStatusCode();
            String responseBody = response.getEntity() != null ? 
                org.apache.http.util.EntityUtils.toString(response.getEntity()) : "No response body";
            if (statusCode != HttpStatus.SC_OK && statusCode != HttpStatus.SC_ACCEPTED) {
                if (statusCode == 403) {
                    log.error("New Relic authentication failed. Check your license key");
                } else if (statusCode == 413) {
                    log.error("New Relic payload too large. Size: {} bytes", jsonPayload.length());
                } else {
                    log.error("New Relic API returned status code: {} with response: {}", statusCode, responseBody);
                }
                throw new IOException("New Relic API request failed with status: " + statusCode 
                    + ", response: " + responseBody);
            }
            log.info("New Relic API request successful. Status: {}, Response: {}", statusCode, responseBody);
        }
    }
}
