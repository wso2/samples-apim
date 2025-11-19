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

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.wso2.am.analytics.publisher.client.newrelic.NewRelicEvent;
import org.wso2.am.analytics.publisher.exception.MetricReportingException;
import org.wso2.am.analytics.publisher.reporter.MetricEventBuilder;
import org.wso2.am.analytics.publisher.reporter.newrelic.util.NewRelicConstants;
import org.wso2.am.analytics.publisher.util.Constants;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Abstract base class for New Relic client implementations.
 */
public abstract class AbstractNewRelicClient {
    
    protected final Logger log = LogManager.getLogger(AbstractNewRelicClient.class);
    
    /**
     * Publishes a single event to New Relic.
     * 
     * @param builder The metric event builder containing event data
     * @throws MetricReportingException if publishing fails
     */
    public abstract void publish(MetricEventBuilder builder) throws MetricReportingException;
    
    /**
     * Publishes a batch of events to New Relic.
     * 
     * @param builders List of metric event builders
     */
    public abstract void publishBatch(List<MetricEventBuilder> builders);
    
    /**
     * Builds a New Relic event from raw event data.
     * 
     * @param data Raw event data map
     * @return Formatted New Relic event
     * @throws IOException if event building fails
     * @throws MetricReportingException if data is invalid
     */
    protected abstract NewRelicEvent buildEvent(Map<String, Object> data) 
            throws IOException, MetricReportingException;
    
    /**
     * Populates common fields in the New Relic event from APIM event data.
     * 
     * @param source Source event data
     * @param target Target New Relic event
     */
    protected void populateCommonFields(Map<String, Object> source, NewRelicEvent target) {
        // Set timestamp
        Long requestTimestamp = (Long) source.get(Constants.REQUEST_TIMESTAMP);
        if (requestTimestamp != null && requestTimestamp > 0) {
            target.setTimestamp(requestTimestamp);
        }
        
        // Set event type
        target.setEventType(NewRelicConstants.DEFAULT_EVENT_TYPE);
        
        // Add service identification
        target.addAttribute(NewRelicConstants.SERVICE_FIELD, NewRelicConstants.SERVICE_NAME);
        
        // Map core APIM fields to New Relic attributes with ArrayList conversion
        addAttributeIfPresent(source, target, Constants.API_ID, "apiId");
        addAttributeIfPresent(source, target, Constants.API_NAME, "apiName");
        addAttributeIfPresent(source, target, Constants.API_VERSION, "apiVersion");
        addAttributeIfPresent(source, target, Constants.API_CONTEXT, "apiContext");
        addAttributeIfPresent(source, target, Constants.API_METHOD, "apiMethod");
        addAttributeIfPresent(source, target, Constants.API_RESOURCE_TEMPLATE, "apiResourceTemplate");
        addAttributeIfPresent(source, target, Constants.API_CREATION, "apiCreator");
        addAttributeIfPresent(source, target, Constants.API_CREATOR_TENANT_DOMAIN, "apiCreatorTenantDomain");
        addAttributeIfPresent(source, target, Constants.APPLICATION_ID, "applicationId");
        addAttributeIfPresent(source, target, Constants.APPLICATION_NAME, "applicationName");
        addAttributeIfPresent(source, target, Constants.APPLICATION_OWNER, "applicationOwner");
        addAttributeIfPresent(source, target, Constants.CORRELATION_ID, "correlationId");
        addAttributeIfPresent(source, target, Constants.KEY_TYPE, "keyType");
        addAttributeIfPresent(source, target, Constants.USER_NAME, "userName");
        addAttributeIfPresent(source, target, Constants.USER_IP, "userIp");
        addAttributeIfPresent(source, target, Constants.USER_AGENT_HEADER, "userAgent");
        addAttributeIfPresent(source, target, Constants.REQUEST_TIMESTAMP, "requestTimestamp");
        addAttributeIfPresent(source, target, Constants.RESPONSE_LATENCY, "responseLatency");
        addAttributeIfPresent(source, target, Constants.BACKEND_LATENCY, "backendLatency");
        addAttributeIfPresent(source, target, Constants.REQUEST_MEDIATION_LATENCY, "requestMediationLatency");
        addAttributeIfPresent(source, target, Constants.RESPONSE_MEDIATION_LATENCY, "responseMediationLatency");
        addAttributeIfPresent(source, target, Constants.TARGET_RESPONSE_CODE, "targetResponseCode");
        addAttributeIfPresent(source, target, Constants.PROXY_RESPONSE_CODE, "proxyResponseCode");
        addAttributeIfPresent(source, target, Constants.DESTINATION, "destination");
        addAttributeIfPresent(source, target, Constants.ORGANIZATION_ID, "organizationId");
        addAttributeIfPresent(source, target, Constants.ENVIRONMENT_ID, "environmentId");
        addAttributeIfPresent(source, target, Constants.REGION_ID, "regionId");
        addAttributeIfPresent(source, target, Constants.GATEWAY_TYPE, "gatewayType");
        addAttributeIfPresent(source, target, Constants.ERROR_CODE, "errorCode");
        addAttributeIfPresent(source, target, Constants.ERROR_MESSAGE, "errorMessage");
        addAttributeIfPresent(source, target, Constants.ERROR_TYPE, "errorType");
        
        // Handle properties with ArrayList conversion
        Object propertiesObj = source.get(Constants.PROPERTIES);
        if (propertiesObj instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> properties = (Map<String, Object>) propertiesObj;
            for (Map.Entry<String, Object> entry : properties.entrySet()) {
                Object convertedValue = convertToSupportedType(entry.getValue());
                target.addAttribute("prop_" + entry.getKey(), convertedValue);
            }
        }
    }
    
    /**
     * Adds an attribute to the target event if the value exists in the source.
     * FIXES THE ARRAYLIST ERROR by converting complex types to supported types.
     */
    private void addAttributeIfPresent(Map<String, Object> source, NewRelicEvent target, 
                                      String sourceKey, String targetKey) {
        Object value = source.get(sourceKey);
        if (value != null) {
            // Convert empty strings to null to avoid adding them
            if (value instanceof String && ((String) value).trim().isEmpty()) {
                return;
            }
            
            // QUICK FIX: Convert complex types to strings for New Relic compatibility
            Object convertedValue = convertToSupportedType(value);
            target.addAttribute(targetKey, convertedValue);
        }
    }
    
    /**
     * QUICK FIX METHOD: Converts complex data types to New Relic supported types (String, Number, Boolean).
     * This fixes the "Unsupported attribute type for key 'uriTemplates'. Found: ArrayList" error.
     * 
     * @param value The value to convert
     * @return Converted value suitable for New Relic
     */
    private Object convertToSupportedType(Object value) {
        // Already supported types
        if (value instanceof String || value instanceof Number || value instanceof Boolean) {
            return value;
        }
        
        // MAIN FIX: Convert ArrayList and other Lists to comma-separated strings
        if (value instanceof List) {
            List<?> list = (List<?>) value;
            if (list.isEmpty()) {
                return ""; // Empty list as empty string
            }
            return list.stream()
                    .map(Object::toString)
                    .collect(Collectors.joining(", "));
        }
        
        // Convert arrays to comma-separated strings
        if (value != null && value.getClass().isArray()) {
            Object[] array = (Object[]) value;
            if (array.length == 0) {
                return ""; // Empty array as empty string
            }
            return java.util.Arrays.stream(array)
                    .map(Object::toString)
                    .collect(Collectors.joining(", "));
        }
        
        // Convert maps to JSON-like string representation
        if (value instanceof Map) {
            Map<?, ?> map = (Map<?, ?>) value;
            if (map.isEmpty()) {
                return "{}";
            }
            return map.entrySet().stream()
                    .map(entry -> entry.getKey() + "=" + entry.getValue())
                    .collect(Collectors.joining(", ", "{", "}"));
        }
        
        // Convert any other object to string
        return value != null ? value.toString() : "";
    }
    
    /**
     * Builds a list of New Relic events from metric event builders.
     * 
     * @param builders List of metric event builders
     * @return List of built New Relic events
     */
    protected List<NewRelicEvent> buildEventsFromBuilders(List<MetricEventBuilder> builders) {
        return builders.stream()
                .map(this::buildEventSafely)
                .filter(event -> event != null && event.isValid())
                .collect(Collectors.toList());
    }
    
    /**
     * Safely builds a New Relic event from a builder, handling exceptions.
     */
    private NewRelicEvent buildEventSafely(MetricEventBuilder builder) {
        try {
            Map<String, Object> eventData = builder.build();
            return buildEvent(eventData);
        } catch (Exception e) {
            log.error("Failed to build event from builder", e);
            return null;
        }
    }
    
    /**
     * Validates if the event should be published based on size and content.
     */
    protected boolean shouldPublishEvent(NewRelicEvent event) {
        if (event == null || !event.isValid()) {
            log.debug("Event is null or invalid, skipping publication");
            return false;
        }
        
        int eventSize = event.getApproximateSize();
        if (eventSize > NewRelicConstants.MAX_PAYLOAD_SIZE_BYTES) {
            log.warn("Event size ({} bytes) exceeds maximum payload size, skipping publication", eventSize);
            return false;
        }
        
        return true;
    }
}
