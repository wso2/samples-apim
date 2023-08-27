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

import java.util.AbstractMap;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.wso2.am.thrift.analytics.publisher.Constants.API_CONTEXT;
import static org.wso2.am.thrift.analytics.publisher.Constants.API_CREATION;
import static org.wso2.am.thrift.analytics.publisher.Constants.API_CREATOR_TENANT_DOMAIN;
import static org.wso2.am.thrift.analytics.publisher.Constants.API_HOSTNAME;
import static org.wso2.am.thrift.analytics.publisher.Constants.API_METHOD;
import static org.wso2.am.thrift.analytics.publisher.Constants.API_NAME;
import static org.wso2.am.thrift.analytics.publisher.Constants.API_RESOURCE_PATH;
import static org.wso2.am.thrift.analytics.publisher.Constants.API_RESOURCE_TEMPLATE;
import static org.wso2.am.thrift.analytics.publisher.Constants.API_TIER;
import static org.wso2.am.thrift.analytics.publisher.Constants.API_VERSION;
import static org.wso2.am.thrift.analytics.publisher.Constants.APPLICATION_CONSUMER_KEY;
import static org.wso2.am.thrift.analytics.publisher.Constants.APPLICATION_ID;
import static org.wso2.am.thrift.analytics.publisher.Constants.APPLICATION_NAME;
import static org.wso2.am.thrift.analytics.publisher.Constants.APPLICATION_OWNER;
import static org.wso2.am.thrift.analytics.publisher.Constants.BACKEND_LATENCY;
import static org.wso2.am.thrift.analytics.publisher.Constants.BACKEND_TIME;
import static org.wso2.am.thrift.analytics.publisher.Constants.DESTINATION;
import static org.wso2.am.thrift.analytics.publisher.Constants.ERROR_CODE;
import static org.wso2.am.thrift.analytics.publisher.Constants.ERROR_MESSAGE;
import static org.wso2.am.thrift.analytics.publisher.Constants.GATEWAY_TYPE;
import static org.wso2.am.thrift.analytics.publisher.Constants.HOSTNAME;
import static org.wso2.am.thrift.analytics.publisher.Constants.LABEL;
import static org.wso2.am.thrift.analytics.publisher.Constants.META_CLIENT_TYPE;
import static org.wso2.am.thrift.analytics.publisher.Constants.OTHER_LATENCY;
import static org.wso2.am.thrift.analytics.publisher.Constants.PROPERTIES;
import static org.wso2.am.thrift.analytics.publisher.Constants.PROTOCOL;
import static org.wso2.am.thrift.analytics.publisher.Constants.REQUEST_MED_LAT;
import static org.wso2.am.thrift.analytics.publisher.Constants.REQUEST_TIMESTAMP;
import static org.wso2.am.thrift.analytics.publisher.Constants.RESPONSE_CACHE_HIT;
import static org.wso2.am.thrift.analytics.publisher.Constants.RESPONSE_CODE;
import static org.wso2.am.thrift.analytics.publisher.Constants.RESPONSE_MED_LAT;
import static org.wso2.am.thrift.analytics.publisher.Constants.RESPONSE_SIZE;
import static org.wso2.am.thrift.analytics.publisher.Constants.RESPONSE_TIME;
import static org.wso2.am.thrift.analytics.publisher.Constants.SECURITY_LATENCY;
import static org.wso2.am.thrift.analytics.publisher.Constants.SERVICE_TIME;
import static org.wso2.am.thrift.analytics.publisher.Constants.SUBSCRIBER;
import static org.wso2.am.thrift.analytics.publisher.Constants.THROTTLED_OUT;
import static org.wso2.am.thrift.analytics.publisher.Constants.THROTTLED_OUT_REASON;
import static org.wso2.am.thrift.analytics.publisher.Constants.THROTTLED_OUT_TIMESTAMP;
import static org.wso2.am.thrift.analytics.publisher.Constants.THROTTLING_LATENCY;
import static org.wso2.am.thrift.analytics.publisher.Constants.USERNAME;
import static org.wso2.am.thrift.analytics.publisher.Constants.USER_AGENT;
import static org.wso2.am.thrift.analytics.publisher.Constants.USER_IP;
import static org.wso2.am.thrift.analytics.publisher.Constants.USER_TENANT_DOMAIN;

public class InputValidator {
    private static final InputValidator INSTANCE = new InputValidator();

    private InputValidator() {
        // Prevents instantiation
    }

    public static InputValidator getInstance() {
        return INSTANCE;
    }

    private static final Map<String, Class> thriftResponseEventSchema = Stream.of(
            new AbstractMap.SimpleImmutableEntry<>(META_CLIENT_TYPE, HashMap.class),
            new AbstractMap.SimpleImmutableEntry<>(APPLICATION_CONSUMER_KEY, String.class),
            new AbstractMap.SimpleImmutableEntry<>(APPLICATION_NAME, String.class),
            new AbstractMap.SimpleImmutableEntry<>(APPLICATION_ID, String.class),
            new AbstractMap.SimpleImmutableEntry<>(APPLICATION_OWNER, String.class),
            new AbstractMap.SimpleImmutableEntry<>(API_CONTEXT, String.class),
            new AbstractMap.SimpleImmutableEntry<>(API_NAME, String.class),
            new AbstractMap.SimpleImmutableEntry<>(API_VERSION, String.class),
            new AbstractMap.SimpleImmutableEntry<>(API_RESOURCE_PATH, String.class),
            new AbstractMap.SimpleImmutableEntry<>(API_RESOURCE_TEMPLATE, String.class),
            new AbstractMap.SimpleImmutableEntry<>(API_METHOD, String.class),
            new AbstractMap.SimpleImmutableEntry<>(API_CREATION, String.class),
            new AbstractMap.SimpleImmutableEntry<>(API_CREATOR_TENANT_DOMAIN, String.class),
            new AbstractMap.SimpleImmutableEntry<>(API_TIER, String.class),
            new AbstractMap.SimpleImmutableEntry<>(API_HOSTNAME, String.class),
            new AbstractMap.SimpleImmutableEntry<>(USERNAME, String.class),
            new AbstractMap.SimpleImmutableEntry<>(USER_TENANT_DOMAIN, String.class),
            new AbstractMap.SimpleImmutableEntry<>(USER_IP, String.class),
            new AbstractMap.SimpleImmutableEntry<>(USER_AGENT, String.class),
            new AbstractMap.SimpleImmutableEntry<>(REQUEST_TIMESTAMP, Long.class),
            new AbstractMap.SimpleImmutableEntry<>(THROTTLED_OUT, Boolean.class),
            new AbstractMap.SimpleImmutableEntry<>(RESPONSE_TIME, Long.class),
            new AbstractMap.SimpleImmutableEntry<>(SERVICE_TIME, Long.class),
            new AbstractMap.SimpleImmutableEntry<>(BACKEND_TIME, Long.class),
            new AbstractMap.SimpleImmutableEntry<>(RESPONSE_CACHE_HIT, Boolean.class),
            new AbstractMap.SimpleImmutableEntry<>(RESPONSE_SIZE, Long.class),
            new AbstractMap.SimpleImmutableEntry<>(PROTOCOL, String.class),
            new AbstractMap.SimpleImmutableEntry<>(RESPONSE_CODE, Integer.class),
            new AbstractMap.SimpleImmutableEntry<>(DESTINATION, String.class),
            new AbstractMap.SimpleImmutableEntry<>(SECURITY_LATENCY, Long.class),
            new AbstractMap.SimpleImmutableEntry<>(THROTTLING_LATENCY, Long.class),
            new AbstractMap.SimpleImmutableEntry<>(REQUEST_MED_LAT, Long.class),
            new AbstractMap.SimpleImmutableEntry<>(RESPONSE_MED_LAT, Long.class),
            new AbstractMap.SimpleImmutableEntry<>(BACKEND_LATENCY, Long.class),
            new AbstractMap.SimpleImmutableEntry<>(OTHER_LATENCY, Long.class),
            new AbstractMap.SimpleImmutableEntry<>(GATEWAY_TYPE, String.class),
            new AbstractMap.SimpleImmutableEntry<>(LABEL, String.class),
            new AbstractMap.SimpleImmutableEntry<>(PROPERTIES, LinkedHashMap.class))
            .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (x, y) -> y, LinkedHashMap::new));
    private static final Map<String, Class> thriftFaultEventSchema = Stream.of(
            new AbstractMap.SimpleImmutableEntry<>(META_CLIENT_TYPE, HashMap.class),
            new AbstractMap.SimpleImmutableEntry<>(APPLICATION_CONSUMER_KEY, String.class),
            new AbstractMap.SimpleImmutableEntry<>(API_NAME, String.class),
            new AbstractMap.SimpleImmutableEntry<>(API_VERSION, String.class),
            new AbstractMap.SimpleImmutableEntry<>(API_CONTEXT, String.class),
            new AbstractMap.SimpleImmutableEntry<>(API_RESOURCE_PATH, String.class),
            new AbstractMap.SimpleImmutableEntry<>(API_RESOURCE_TEMPLATE, String.class),
            new AbstractMap.SimpleImmutableEntry<>(API_METHOD, String.class),
            new AbstractMap.SimpleImmutableEntry<>(API_CREATION, String.class),
            new AbstractMap.SimpleImmutableEntry<>(USERNAME, String.class),
            new AbstractMap.SimpleImmutableEntry<>(USER_TENANT_DOMAIN, String.class),
            new AbstractMap.SimpleImmutableEntry<>(API_CREATOR_TENANT_DOMAIN, String.class),
            new AbstractMap.SimpleImmutableEntry<>(HOSTNAME, String.class),
            new AbstractMap.SimpleImmutableEntry<>(APPLICATION_ID, String.class),
            new AbstractMap.SimpleImmutableEntry<>(APPLICATION_NAME, String.class),
            new AbstractMap.SimpleImmutableEntry<>(APPLICATION_OWNER, String.class),
            new AbstractMap.SimpleImmutableEntry<>(PROTOCOL, String.class),
            new AbstractMap.SimpleImmutableEntry<>(ERROR_CODE, String.class),
            new AbstractMap.SimpleImmutableEntry<>(ERROR_MESSAGE, String.class),
            new AbstractMap.SimpleImmutableEntry<>(REQUEST_TIMESTAMP, Long.class),
            new AbstractMap.SimpleImmutableEntry<>(PROPERTIES, LinkedHashMap.class))
            .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (x, y) -> y, LinkedHashMap::new));
    private static final Map<String, Class> thriftThrottledEventSchema = Stream.of(
            new AbstractMap.SimpleImmutableEntry<>(META_CLIENT_TYPE, HashMap.class),
            new AbstractMap.SimpleImmutableEntry<>(USERNAME, String.class),
            new AbstractMap.SimpleImmutableEntry<>(USER_TENANT_DOMAIN, String.class),
            new AbstractMap.SimpleImmutableEntry<>(API_NAME, String.class),
            new AbstractMap.SimpleImmutableEntry<>(API_VERSION, String.class),
            new AbstractMap.SimpleImmutableEntry<>(API_CONTEXT, String.class),
            new AbstractMap.SimpleImmutableEntry<>(API_CREATION, String.class),
            new AbstractMap.SimpleImmutableEntry<>(API_CREATOR_TENANT_DOMAIN, String.class),
            new AbstractMap.SimpleImmutableEntry<>(API_RESOURCE_TEMPLATE, String.class),
            new AbstractMap.SimpleImmutableEntry<>(API_METHOD, String.class),
            new AbstractMap.SimpleImmutableEntry<>(APPLICATION_ID, String.class),
            new AbstractMap.SimpleImmutableEntry<>(APPLICATION_NAME, String.class),
            new AbstractMap.SimpleImmutableEntry<>(SUBSCRIBER, String.class),
            new AbstractMap.SimpleImmutableEntry<>(THROTTLED_OUT_REASON, String.class),
            new AbstractMap.SimpleImmutableEntry<>(GATEWAY_TYPE, String.class),
            new AbstractMap.SimpleImmutableEntry<>(THROTTLED_OUT_TIMESTAMP, Long.class),
            new AbstractMap.SimpleImmutableEntry<>(HOSTNAME, String.class),
            new AbstractMap.SimpleImmutableEntry<>(PROPERTIES, LinkedHashMap.class))
            .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (x, y) -> y, LinkedHashMap::new));

    public Map<String, Class> getEventProperties(ThriftMetricSchema schema) {
        switch (schema) {
            case THRIFT_RESPONSE:
                return thriftResponseEventSchema;
            case THRIFT_ERROR:
                return thriftFaultEventSchema;
            case THRIFT_THROTTLE_OUT:
                return thriftThrottledEventSchema;
            default:
                return new HashMap<>();
        }
    }
}
