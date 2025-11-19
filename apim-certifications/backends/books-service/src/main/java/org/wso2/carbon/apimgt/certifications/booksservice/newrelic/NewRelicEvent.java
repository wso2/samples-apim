/*
 * Copyright (c) 2025, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
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

package org.wso2.am.analytics.publisher.client.newrelic;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.wso2.am.analytics.publisher.reporter.newrelic.util.NewRelicConstants;

import java.util.HashMap;
import java.util.Map;

/**
 * Represents a New Relic custom event with attributes and metadata.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class NewRelicEvent {

    @JsonProperty(NewRelicConstants.EVENT_TYPE_FIELD)
    private String eventType;

    @JsonProperty(NewRelicConstants.TIMESTAMP_FIELD)
    private Long timestamp;

    private Map<String, Object> attributes;

    public NewRelicEvent() {
        this.attributes = new HashMap<>();
        this.timestamp = System.currentTimeMillis();
        this.eventType = NewRelicConstants.DEFAULT_EVENT_TYPE;
    }

    public NewRelicEvent(String eventType) {
        this();
        this.eventType = eventType;
    }

    /**
     * Adds an attribute to the event. Only valid attribute types are accepted.
     * 
     * @param key   The attribute key
     * @param value The attribute value (String, Number, or Boolean)
     */
    public void addAttribute(String key, Object value) {
        if (key != null && !key.trim().isEmpty() && value != null && isValidAttributeValue(value)) {
            attributes.put(key, value);
        }
    }

    /**
     * Adds multiple attributes from a map.
     * 
     * @param attributeMap Map of attributes to add
     */
    public void addAttributes(Map<String, Object> attributeMap) {
        if (attributeMap != null) {
            attributeMap.forEach(this::addAttribute);
        }
    }

    /**
     * Removes an attribute from the event.
     * 
     * @param key The attribute key to remove
     * @return The removed value, or null if not found
     */
    public Object removeAttribute(String key) {
        return attributes.remove(key);
    }

    /**
     * Gets an attribute value.
     * 
     * @param key The attribute key
     * @return The attribute value, or null if not found
     */
    public Object getAttribute(String key) {
        return attributes.get(key);
    }

    /**
     * Checks if the attribute value is valid for New Relic events.
     * New Relic supports String, Number, and Boolean values.
     * 
     * @param value The value to validate
     * @return true if valid, false otherwise
     */
    private boolean isValidAttributeValue(Object value) {
        return value instanceof String ||
                value instanceof Number ||
                value instanceof Boolean;
    }

    /**
     * Validates the event structure and content.
     * 
     * @return true if the event is valid
     */
    public boolean isValid() {
        return eventType != null && !eventType.trim().isEmpty() &&
                timestamp != null && timestamp > 0;
    }

    /**
     * Gets the size of the event in bytes (approximation).
     * 
     * @return Approximate size in bytes
     */
    public int getApproximateSize() {
        int size = 0;

        // Event type and timestamp
        if (eventType != null) {
            size += eventType.length() * 2; // Rough UTF-8 estimate
        }
        size += 8; // timestamp (long)

        // Attributes
        for (Map.Entry<String, Object> entry : attributes.entrySet()) {
            if (entry.getKey() != null) {
                size += entry.getKey().length() * 2;
            }
            if (entry.getValue() != null) {
                if (entry.getValue() instanceof String) {
                    size += ((String) entry.getValue()).length() * 2;
                } else {
                    size += 8; // Rough estimate for numbers/booleans
                }
            }
        }

        return size;
    }

    // Getters and Setters
    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public Long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Long timestamp) {
        this.timestamp = timestamp;
    }

    public Map<String, Object> getAttributes() {
        return new HashMap<>(attributes);
    }

    public void setAttributes(Map<String, Object> attributes) {
        this.attributes.clear();
        if (attributes != null) {
            addAttributes(attributes);
        }
    }

    /**
     * Flattens the event to a single map for JSON serialization.
     * This combines the top-level fields with attributes.
     * 
     * @return Flattened map representation
     */
    public Map<String, Object> toFlatMap() {
        Map<String, Object> flatMap = new HashMap<>(attributes);
        flatMap.put(NewRelicConstants.EVENT_TYPE_FIELD, eventType);
        flatMap.put(NewRelicConstants.TIMESTAMP_FIELD, timestamp);
        return flatMap;
    }

    @Override
    public String toString() {
        return "NewRelicEvent{" +
                "eventType='" + eventType + '\'' +
                ", timestamp=" + timestamp +
                ", attributeCount=" + attributes.size() +
                '}';
    }
}
