/*
 *  Copyright (c) 2023, WSO2 LLC. (http://www.wso2.org) All Rights Reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *
 */

package org.wso2.am.thrift.analytics.publisher;

import org.wso2.am.analytics.publisher.exception.MetricReportingException;
import org.wso2.am.analytics.publisher.reporter.AbstractMetricEventBuilder;
import org.wso2.am.analytics.publisher.reporter.MetricEventBuilder;
import org.wso2.am.analytics.publisher.util.EventMapAttributeFilter;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Event builder for the Thrift Metric Reporter.
 */
public class ThriftMetricEventBuilder extends AbstractMetricEventBuilder {
    private static final String PROPERTIES_KEY = "properties";
    private static final String META_CLIENT_TYPE = "meta_clientType";

    private static final String KEY_TYPE = "keyType";
    private static final String CORRELATION_ID = "correlationId";
    private static final String REQUEST_TIMESTAMP = "requestTimestamp";
    private static final String APPLICATION_ID = "applicationId";
    private static final String APPLICATION_CONSUMER_KEY = "applicationConsumerKey";
    private static final String API_CONTEXT = "apiContext";
    private static final String API_RESOURCE_PATH = "apiResourcePath";
    private static final String API_RESOURCE_TEMPLATE = "apiResourceTemplate";
    private static final String API_TIER = "apiTier";
    private static final String API_HOSTNAME = "apiHostname";
    private static final String HOST_NAME = "hostName";
    private static final String HOSTNAME = "hostname";
    private static final String USER_TENANT_DOMAIN = "userTenantDomain";
    private static final String THROTTLED_OUT = "throttledOut";
    private static final String RESPONSE_TIME = "responseTime";
    private static final String SERVICE_TIME = "serviceTime";
    private static final String BACKEND_TIME = "backendTime";
    private static final String RESPONSE_SIZE = "responseSize";
    private static final String PROTOCOL = "protocol";
    private static final String SECURITY_LATENCY = "securityLatency";
    private static final String THROTTLING_LATENCY = "throttlingLatency";
    private static final String OTHER_LATENCY = "otherLatency";
    private static final String LABEL = "label";
    private static final String ERROR_CODE = "errorCode";
    private static final String ERROR_MESSAGE = "errorMessage";
    private static final String SUBSCRIBER = "subscriber";
    private static final String THROTTLED_OUT_REASON = "throttledOutReason";
    private static final String THROTTLED_OUT_TIMESTAMP = "throttledOutTimestamp";
    private static final String USERNAME = "username";
    private static final String USER_NAME = "userName";
    private static final String USER_AGENT_HEADER = "userAgentHeader";
    private static final String PROXY_RESPONSE_CODE = "proxyResponseCode";
    private static final String REQUEST_MEDIATION_LATENCY = "requestMediationLatency";
    private static final String RESPONSE_MEDIATION_LATENCY = "responseMediationLatency";
    private static final String USER_AGENT = "userAgent";
    private static final String RESPONSE_CODE = "responseCode";
    private static final String REQUEST_MED_LAT = "requestMedLat";
    private static final String RESPONSE_MED_LAT = "responseMedLat";
    private static final String RENAMED_CORRELATION_ID = "correlationID";
    private static final String ERROR_TYPE = "errorType";
    private static final String THROTTLED = "THROTTLED";
    private static final String DEFAULT_UNKNOWN_VALUE = "UNKNOWN";

    protected Map<String, Class> requiredAttributes;
    private Map<String, Object> eventMap;
    private Boolean isBuilt = false;
    private ThriftStream thriftStream;

    public ThriftMetricEventBuilder(Map<String, Class> requiredAttributes, ThriftStream thriftStream) {
        this.requiredAttributes = requiredAttributes;
        this.eventMap = new HashMap<>();
        this.thriftStream = thriftStream;
    }

    @Override
    protected Map<String, Object> buildEvent() {
        if (!isBuilt) {
            eventMap = EventMapAttributeFilter.getInstance().filter(eventMap, requiredAttributes);
            isBuilt = true;
        }
        return eventMap;
    }

    @Override
    public boolean validate() throws MetricReportingException {
        if (!isBuilt) {
            /*
            * apiResourceTemplate and apiMethod is set to null in websocket frame throttled out scenario.
            * Therefore, these two attributes were explicitly set to their default values before the validation process.
            *
            * Internal: https://github.com/wso2-enterprise/wso2-apim-internal/issues/8757
            * */
            if (!eventMap.containsKey(Constants.API_RESOURCE_TEMPLATE)) {
                eventMap.put(Constants.API_RESOURCE_TEMPLATE, "/*");
            }
            if (!eventMap.containsKey(Constants.API_METHOD)) {
                eventMap.put(Constants.API_METHOD, "PUBLISH");
            }
            sanitizeNullableAttributes();
            for (Map.Entry<String, Class> entry : requiredAttributes.entrySet()) {
                Object attribute = eventMap.get(entry.getKey());
                if (attribute == null) {
                    throw new MetricReportingException(entry.getKey() + " is missing in metric data. This metric event "
                            + "will not be processed further. Metric event content is: " + eventMap);
                } else if (!attribute.getClass().equals(entry.getValue())) {
                    throw new MetricReportingException(entry.getKey() + " is expecting a " + entry.getValue() + " type "
                            + "attribute, while attribute of type " + attribute.getClass() + " is present. "
                            + "This metric event will not be processed further. Metric event content is: " + eventMap);
                }
            }
        }
        return true;
    }


    /**
     * This method sets default values for special attributes that are missing or can be null in the event map.
     *
     * For example, the `APPLICATION_CONSUMER_KEY` may be null in scenarios where not all applications generate keys—
     * such as APIs that use API keys or unsecured APIs. In such cases,
     * we explicitly set `APPLICATION_CONSUMER_KEY` to "UNKNOWN".
     */
    private void sanitizeNullableAttributes() {
        String[] nullableAttributes = {APPLICATION_CONSUMER_KEY};
        for (String attribute : nullableAttributes) {
            if (!eventMap.containsKey(attribute) || eventMap.get(attribute) == null) {
                eventMap.put(attribute, DEFAULT_UNKNOWN_VALUE);
            }
        }
    }

    @Override
    public MetricEventBuilder addAttribute(String key, Object value) throws MetricReportingException {
        if (ERROR_TYPE.equals(key) && THROTTLED.equals(value)) {
            /*
            We get to know that this is a throttle event, only when adding the attribute 'errorType: THROTTLED'.
            The stream will be considered as FAULT_STREAM till that.
            */
            thriftStream = ThriftStream.THROTTLE_STREAM;
            requiredAttributes =
                    InputValidator.getInstance().getEventProperties(ThriftMetricSchema.THRIFT_THROTTLE_OUT);
        }
        remapAndAddAttribute(key, value);
        return this;
    }

    private void remapAndAddAttribute(String key, Object value) {
        if (PROPERTIES_KEY.equals(key)) {
            addCustomPropertiesAsAttributes((Map<String, Object>) value);
        } else if (key.equals(KEY_TYPE) || key.equals(CORRELATION_ID)) {
            putMetaClientTypeAttribute(getRenamedKey(key), (String) value);
        } else if (key.equals(REQUEST_TIMESTAMP)) {
            String timestampString = (String) value;
            eventMap.put(REQUEST_TIMESTAMP, OffsetDateTime.parse(timestampString).toInstant().toEpochMilli());
        } else if (!APPLICATION_ID.equals(key)) {
            // Ignore application UUID, as the application ID integer will be added through properties
            eventMap.put(getRenamedKey(key), value);
        }
    }

    private void addCustomPropertiesAsAttributes(Map<String, Object> properties) {
        Map<String, Object> customProperties = new LinkedHashMap<>();
        for (Map.Entry<String, Object> property : properties.entrySet()) {
            String propertyKey = property.getKey();
            Object propertyValue = property.getValue();

            switch (propertyKey) {
                case RESPONSE_SIZE:
                    // Changing the type from long to int as the responseSize is calculated as an int in newer versions of APIM
                    if (propertyValue != null) {
                        eventMap.put(getRenamedKey(propertyKey), Long.parseLong(propertyValue.toString()));
                        break;
                    } else {
                        propertyValue = 0L;
                    }
                case APPLICATION_CONSUMER_KEY:
                case APPLICATION_ID:
                case API_CONTEXT:
                case API_RESOURCE_PATH:
                case API_TIER:
                case API_HOSTNAME:
                case HOST_NAME:
                case HOSTNAME:
                case USER_TENANT_DOMAIN:
                case THROTTLED_OUT:
                case RESPONSE_TIME:
                case SERVICE_TIME:
                case BACKEND_TIME:
                case PROTOCOL:
                case SECURITY_LATENCY:
                case THROTTLING_LATENCY:
                case OTHER_LATENCY:
                case LABEL:
                case ERROR_CODE:
                case ERROR_MESSAGE:
                case SUBSCRIBER:
                case THROTTLED_OUT_REASON:
                case THROTTLED_OUT_TIMESTAMP:
                case USERNAME:
                case USER_NAME:
                    // Put to root level
                    eventMap.put(getRenamedKey(propertyKey), propertyValue);
                    break;
                default:
                    customProperties.put(propertyKey, propertyValue);
            }
        }
        eventMap.put(PROPERTIES_KEY, customProperties);
    }

    private String getRenamedKey(String originalKey) {
        switch (originalKey) {
            case USER_NAME:
                return USERNAME;
            case USER_AGENT_HEADER:
                return USER_AGENT;
            case PROXY_RESPONSE_CODE:
                return RESPONSE_CODE;
            case REQUEST_MEDIATION_LATENCY:
                return REQUEST_MED_LAT;
            case RESPONSE_MEDIATION_LATENCY:
                return RESPONSE_MED_LAT;
            case CORRELATION_ID:
                return RENAMED_CORRELATION_ID;
            default:
                return originalKey;
        }
    }

    private void putMetaClientTypeAttribute(String key, String value) {
        Object metaClientTypeObject = eventMap.get(META_CLIENT_TYPE);
        Map<String, String> metaClientTypeMap;
        if (metaClientTypeObject != null) {
            metaClientTypeMap = (Map<String, String>) metaClientTypeObject;
        } else {
            metaClientTypeMap = new HashMap<>(2);
        }
        metaClientTypeMap.put(key, value);
        eventMap.put(META_CLIENT_TYPE, metaClientTypeMap);
    }

    public ThriftStream getThriftStream() {
        return thriftStream;
    }
}
