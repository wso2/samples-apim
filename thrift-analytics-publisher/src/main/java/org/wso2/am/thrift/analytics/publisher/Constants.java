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

public class Constants {
    //Event attribute names
    public static final String CORRELATION_ID = "correlationId";
    public static final String KEY_TYPE = "keyType";
    public static final String API_ID = "apiId";
    public static final String API_NAME = "apiName";
    public static final String API_CONTEXT = "apiContext";
    public static final String USER_NAME = "userName";
    public static final String API_VERSION = "apiVersion";
    public static final String API_CREATION = "apiCreator";
    public static final String API_METHOD = "apiMethod";
    public static final String API_RESOURCE_TEMPLATE = "apiResourceTemplate";
    public static final String API_CREATOR_TENANT_DOMAIN = "apiCreatorTenantDomain";
    public static final String DESTINATION = "destination";
    public static final String APPLICATION_ID = "applicationId";
    public static final String APPLICATION_NAME = "applicationName";
    public static final String APPLICATION_OWNER = "applicationOwner";
    public static final String REGION_ID = "regionId";
    public static final String ORGANIZATION_ID = "organizationId";
    public static final String ENVIRONMENT_ID = "environmentId";
    public static final String GATEWAY_TYPE = "gatewayType";
    public static final String USER_AGENT_HEADER = "userAgentHeader";
    public static final String USER_AGENT = "userAgent";
    public static final String PLATFORM = "platform";
    public static final String PROXY_RESPONSE_CODE = "proxyResponseCode";
    public static final String TARGET_RESPONSE_CODE = "targetResponseCode";
    public static final String RESPONSE_CACHE_HIT = "responseCacheHit";
    public static final String RESPONSE_LATENCY = "responseLatency";
    public static final String BACKEND_LATENCY = "backendLatency";
    public static final String REQUEST_MEDIATION_LATENCY = "requestMediationLatency";
    public static final String RESPONSE_MEDIATION_LATENCY = "responseMediationLatency";
    public static final String REQUEST_TIMESTAMP = "requestTimestamp";
    public static final String EVENT_TYPE = "eventType";
    public static final String API_TYPE = "apiType";
    public static final String USER_IP = "userIp";
    public static final String ERROR_TYPE = "errorType";
    public static final String ERROR_CODE = "errorCode";
    public static final String ERROR_MESSAGE = "errorMessage";
    public static final String PROPERTIES = "properties";
    public static final String META_CLIENT_TYPE = "meta_clientType";
    public static final String APPLICATION_CONSUMER_KEY = "applicationConsumerKey";
    public static final String API_RESOURCE_PATH = "apiResourcePath";
    public static final String API_TIER = "apiTier";
    public static final String API_HOSTNAME = "apiHostname";
    public static final String USERNAME = "username";
    public static final String USER_TENANT_DOMAIN = "userTenantDomain";
    public static final String THROTTLED_OUT = "throttledOut";
    public static final String THROTTLED_OUT_REASON = "throttledOutReason";
    public static final String THROTTLED_OUT_TIMESTAMP = "throttledOutTimestamp";
    public static final String RESPONSE_TIME = "responseTime";
    public static final String SERVICE_TIME = "serviceTime";
    public static final String BACKEND_TIME = "backendTime";
    public static final String RESPONSE_SIZE = "responseSize";
    public static final String PROTOCOL = "protocol";
    public static final String RESPONSE_CODE = "responseCode";
    public static final String SECURITY_LATENCY = "securityLatency";
    public static final String THROTTLING_LATENCY = "throttlingLatency";
    public static final String REQUEST_MED_LAT = "requestMedLat";
    public static final String RESPONSE_MED_LAT = "responseMedLat";
    public static final String OTHER_LATENCY = "otherLatency";
    public static final String LABEL = "label";
    public static final String HOSTNAME = "hostname";
    public static final String SUBSCRIBER = "subscriber";

    // Thrift data publisher related constants
    public static final String THRIFT_ENDPOINT_AGENT_TYPE = "thrift.endpoint.agent.type";
    public static final String THRIFT_ENDPOINT_RECEIVER_URL_SET = "thrift.endpoint.receiver.url.set";
    public static final String THRIFT_ENDPOINT_AUTH_URL_SET = "thrift.endpoint.auth.url.set";
    public static final String THRIFT_ENDPOINT_USERNAME = "thrift.endpoint.username";
    public static final String THRIFT_ENDPOINT_PASSWORD = "thrift.endpoint.password";
    public static final String THRIFT_DATA_PUBLISHER_POOL_MAX_IDLE = "thrift.data.publisher.pool.max.idle";
    public static final String THRIFT_DATA_PUBLISHER_INIT_IDLE_CAPACITY =
            "thrift.data.publisher.pool.init.idle.capacity";
    public static final String THRIFT_DATA_PUBLISHER_EVENT_QUEUE_SIZE = "thrift.data.publisher.event.queue.size";
    public static final String THRIFT_DATA_PUBLISHER_WORKER_THREAD_COUNT = "thrift.data.publisher.worker.thread.count";
    public static final int DEFAULT_THRIFT_DATA_PUBLISHER_EVENT_QUEUE_SIZE = 20000;
    public static final int DEFAULT_THRIFT_DATA_PUBLISHER_WORKER_THREAD_COUNT = 1;
    public static final int DEFAULT_THRIFT_DATA_PUBLISHER_POOL_MAX_IDLE = 1000;
    public static final int DEFAULT_THRIFT_DATA_PUBLISHER_INIT_IDLE_CAPACITY = 200;
}
