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

package org.wso2.am.analytics.publisher.reporter.newrelic.util;

/**
 * Constants for New Relic Event Publisher implementation.
 */
public class NewRelicConstants {
    
    // Configuration keys
    public static final String NEW_RELIC = "newrelic";
    public static final String LICENSE_KEY = "newRelicLicenseKey";
    public static final String ACCOUNT_ID = "newRelicAccountId";
    public static final String ENDPOINT = "newRelicEndpoint";
    public static final String EVENT_TYPE = "newRelicEventType";
    public static final String BATCH_SIZE = "newRelicBatchSize";
    public static final String COMPRESSION_ENABLED = "newRelicCompressionEnabled";
    public static final String RETRY_ATTEMPTS = "newRelicRetryAttempts";
    public static final String RETRY_DELAY = "newRelicRetryDelay";
    
    // Default values
    public static final String DEFAULT_ENDPOINT = 
            "https://insights-collector.newrelic.com/v1/accounts/YOUR_ACCOUNT_ID/events";
    public static final String DEFAULT_ENDPOINT_TEMPLATE = 
            "https://insights-collector.newrelic.com/v1/accounts/{accountId}/events";
    public static final String DEFAULT_EU_ENDPOINT_TEMPLATE = 
            "https://insights-collector.eu01.nr-data.net/v1/accounts/{accountId}/events";
    public static final String DEFAULT_EVENT_TYPE = "APIAnalyticsEvent";
    public static final int DEFAULT_BATCH_SIZE = 100;
    public static final int DEFAULT_RETRY_ATTEMPTS = 3;
    public static final long DEFAULT_RETRY_DELAY = 5000;
    public static final boolean DEFAULT_COMPRESSION_ENABLED = true;
    
    // HTTP headers
    public static final String API_KEY_HEADER = "Api-Key";
    public static final String CONTENT_TYPE_HEADER = "Content-Type";
    public static final String CONTENT_ENCODING_HEADER = "Content-Encoding";
    public static final String APPLICATION_JSON = "application/json";
    public static final String GZIP_ENCODING = "gzip";
    
    // Event field names (New Relic conventions)
    public static final String EVENT_TYPE_FIELD = "eventType";
    public static final String TIMESTAMP_FIELD = "timestamp";
    public static final String SERVICE_FIELD = "service";
    public static final String ENVIRONMENT_FIELD = "environment";
    public static final String API_NAME_FIELD = "apiName";
    public static final String API_VERSION_FIELD = "apiVersion";
    public static final String APPLICATION_NAME_FIELD = "applicationName";
    public static final String RESPONSE_TIME_FIELD = "responseTimeMs";
    public static final String RESPONSE_CODE_FIELD = "responseCode";
    public static final String USER_AGENT_FIELD = "userAgent";
    public static final String REQUEST_TIMESTAMP_FIELD = "requestTimestamp";
    
    // Service identification
    public static final String SERVICE_NAME = "apim-analytics";
    
    // Rate limiting
    public static final int MAX_REQUESTS_PER_MINUTE = 100000;
    public static final int MAX_EVENTS_PER_REQUEST = 1000;
    public static final int MAX_PAYLOAD_SIZE_BYTES = 102400; // 100KB
    
    // Retry configuration
    public static final long MIN_RETRY_DELAY_MS = 1000;
    public static final long MAX_RETRY_DELAY_MS = 30000;
    public static final double RETRY_BACKOFF_MULTIPLIER = 2.0;
    
    // HTTP status codes that should trigger retries
    public static final int[] RETRYABLE_STATUS_CODES = {500, 502, 503, 504, 429};
    
    // Validation patterns
    public static final String LICENSE_KEY_PATTERN = "^[a-fA-F0-9]{40}$";
    public static final String ACCOUNT_ID_PATTERN = "^[0-9]+$";
    public static final String ATTRIBUTE_NAME_PATTERN = "[a-zA-Z0-9_:]+";
    
    // New Relic event constraints
    public static final int MAX_ATTRIBUTE_NAME_LENGTH = 255;
    public static final int MAX_ATTRIBUTE_VALUE_LENGTH = 4096;
    public static final int MAX_ATTRIBUTES_PER_EVENT = 255;
    public static final int MAX_EVENT_SIZE_BYTES = 64000;
    
    // Reserved attribute names (New Relic built-ins)
    public static final java.util.Set<String> RESERVED_ATTRIBUTE_NAMES = 
        java.util.Collections.unmodifiableSet(new java.util.HashSet<String>() { {
            add("account"); add("accountid"); add("agent"); add("appid"); add("appname"); 
            add("duration"); add("endtimestamp"); add("entity.guid"); add("entity.name"); 
            add("entity.type"); add("host"); add("instrumentation.name"); 
            add("instrumentation.provider"); add("instrumentation.version"); add("newrelic"); 
            add("nr"); add("realagentid"); add("timestamp"); add("trustedaccountkey"); 
            add("type"); add("eventtype");
        }});
    
    private NewRelicConstants() {
        // Utility class - prevent instantiation
    }
}
