/*
 * Copyright (c) 2025, WSO2 LLC. (http://www.wso2.org) All Rights Reserved.
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

package org.wso2.am.analytics.publisher.reporter.newrelic;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.wso2.am.analytics.publisher.exception.MetricReportingException;
import org.wso2.am.analytics.publisher.reporter.AbstractMetricEventBuilder;
import org.wso2.am.analytics.publisher.reporter.MetricEventBuilder;
import org.wso2.am.analytics.publisher.reporter.newrelic.util.NewRelicConstants;

import java.util.HashMap;
import java.util.Map;

/**
 * Event builder for New Relic Metric Reporter. Validates and builds events
 * conforming to New Relic Custom Event specifications.
 */
public class NewRelicMetricEventBuilder extends AbstractMetricEventBuilder {
    
    private static final Logger log = LogManager.getLogger(NewRelicMetricEventBuilder.class);
    private Map<String, Object> eventMap;
    private boolean isBuilt = false;

    public NewRelicMetricEventBuilder() {
        this.eventMap = new HashMap<>();
        // Set default event type to prevent "eventType is required" error
        this.eventMap.put(NewRelicConstants.EVENT_TYPE_FIELD, NewRelicConstants.DEFAULT_EVENT_TYPE);
    }

    @Override
    public Map<String, Object> build() throws MetricReportingException {
        // Call parent build which will call our buildEvent()
        Map<String, Object> result = super.build();
        log.debug("Built event with {} attributes", result.size());
        return result;
    }

    @Override
    protected Map<String, Object> buildEvent() {
        if (!isBuilt) {
            // Validate event size before building
            try {
                validateEventSize();
            } catch (MetricReportingException e) {
                // Log the error but don't fail the build - validation already happened
                // This is a failsafe check
                log.warn("Validation warning during buildEvent: {}", e.getMessage());
            }
            isBuilt = true;
        }
        return eventMap;
    }

    @Override
    public boolean validate() throws MetricReportingException {
        if (eventMap.isEmpty()) {
            throw new MetricReportingException("Event map cannot be empty for New Relic events");
        }

        // Validate required eventType attribute
        if (!eventMap.containsKey(NewRelicConstants.EVENT_TYPE_FIELD)) {
            throw new MetricReportingException("eventType is required for New Relic custom events");
        }

        // Validate attribute names and values
        for (Map.Entry<String, Object> entry : eventMap.entrySet()) {
            validateAttribute(entry.getKey(), entry.getValue());
        }

        // Validate total event size
        validateEventSize();

        return true;
    }

    @Override
    public MetricEventBuilder addAttribute(String key, Object value) throws MetricReportingException {
        if (value == null) {
            log.debug("Skipping null value for key: '{}'", key);
            return this; // Skip null values instead of throwing error
        }

        // Convert ArrayList and other unsupported types before validation
        Object convertedValue = convertToSupportedType(value);
        
        validateAttribute(key, convertedValue);
        eventMap.put(key, convertedValue);
        return this;
    }

    /**
     * Validates individual attribute key-value pairs according to New Relic constraints.
     * 
     * @param key   Attribute key
     * @param value Attribute value
     * @throws MetricReportingException if attribute is invalid
     */
    private void validateAttribute(String key, Object value) throws MetricReportingException {
        // Note: Null check is handled in addAttribute() method before calling this
        
        // Check supported data types
        if (!(value instanceof String || value instanceof Number || value instanceof Boolean)) {
            throw new MetricReportingException("Unsupported attribute type for key '" + key 
                + "'. Supported types: String, Number, Boolean. Found: " + value.getClass().getSimpleName());
        }

        // Validate string length
        if (value instanceof String) {
            String stringValue = (String) value;
            if (stringValue.length() > NewRelicConstants.MAX_ATTRIBUTE_VALUE_LENGTH) {
                throw new MetricReportingException("String attribute value exceeds maximum length of " 
                    + NewRelicConstants.MAX_ATTRIBUTE_VALUE_LENGTH + " characters for key: " + key);
            }
        }

        // Check for reserved attribute names (allow eventType as it's handled specially)
        if (!NewRelicConstants.EVENT_TYPE_FIELD.equals(key) && 
            NewRelicConstants.RESERVED_ATTRIBUTE_NAMES.contains(key.toLowerCase())) {
            throw new MetricReportingException("'" + key + "' is a reserved attribute name in New Relic");
        }

        // Validate attribute name format
        if (!key.matches(NewRelicConstants.ATTRIBUTE_NAME_PATTERN)) {
            throw new MetricReportingException("Attribute name '" + key 
                + "' contains invalid characters. Only alphanumeric characters, underscores, and colons are allowed");
        }
    }

    /**
     * Validates the total size of the event to ensure it's within New Relic limits.
     * 
     * @throws MetricReportingException if event size exceeds limits
     */
    private void validateEventSize() throws MetricReportingException {
        if (eventMap.size() > NewRelicConstants.MAX_ATTRIBUTES_PER_EVENT) {
            throw new MetricReportingException("Event exceeds maximum number of attributes: " 
                + NewRelicConstants.MAX_ATTRIBUTES_PER_EVENT);
        }

        // Estimate event size (rough calculation)
        int estimatedSize = 0;
        for (Map.Entry<String, Object> entry : eventMap.entrySet()) {
            estimatedSize += entry.getKey().length();
            if (entry.getValue() instanceof String) {
                estimatedSize += ((String) entry.getValue()).length();
            } else {
                estimatedSize += 20; // Rough estimate for numbers/booleans
            }
        }

        if (estimatedSize > NewRelicConstants.MAX_EVENT_SIZE_BYTES) {
            throw new MetricReportingException("Event size exceeds maximum allowed size of " 
                + NewRelicConstants.MAX_EVENT_SIZE_BYTES + " bytes");
        }
    }

    /**
     * Sets the event type for this custom event.
     * 
     * @param eventType Event type name (required)
     * @return this builder for chaining
     * @throws MetricReportingException if event type is invalid
     */
    public NewRelicMetricEventBuilder setEventType(String eventType) throws MetricReportingException {
        if (eventType == null || eventType.trim().isEmpty()) {
            throw new MetricReportingException("Event type cannot be null or empty");
        }
        
        if (eventType.length() > NewRelicConstants.MAX_ATTRIBUTE_VALUE_LENGTH) {
            throw new MetricReportingException("Event type exceeds maximum length");
        }
        
        addAttribute(NewRelicConstants.EVENT_TYPE_FIELD, eventType);
        return this;
    }

    /**
     * Gets the current number of attributes in the event.
     * 
     * @return number of attributes
     */
    public int getAttributeCount() {
        return eventMap.size();
    }

    /**
     * Checks if the event has a specific attribute.
     * 
     * @param key Attribute key to check
     * @return true if attribute exists
     */
    public boolean hasAttribute(String key) {
        return eventMap.containsKey(key);
    }

    /**
     * Gets the value of a specific attribute.
     * 
     * @param key Attribute key
     * @return attribute value or null if not found
     */
    public Object getAttribute(String key) {
        return eventMap.get(key);
    }

    /**
     * QUICK FIX: Converts ArrayList and other complex types to New Relic supported types.
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
        
        // Convert maps to JSON-like string representation
        if (value instanceof java.util.Map) {
            java.util.Map<?, ?> map = (java.util.Map<?, ?>) value;
            if (map.isEmpty()) {
                return "{}";
            }
            return map.entrySet().stream()
                    .map(entry -> entry.getKey() + "=" + entry.getValue())
                    .collect(java.util.stream.Collectors.joining(", ", "{", "}"));
        }
        
        // Convert any other object to string
        return value != null ? value.toString() : "";
    }
}
