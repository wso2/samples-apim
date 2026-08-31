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
import org.apache.http.HttpEntity;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.ByteArrayEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.wso2.am.analytics.publisher.client.newrelic.NewRelicEvent;
import org.wso2.am.analytics.publisher.exception.MetricReportingException;
import org.wso2.am.analytics.publisher.reporter.MetricEventBuilder;
import org.wso2.am.analytics.publisher.reporter.newrelic.util.NewRelicConstants;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import java.util.zip.GZIPOutputStream;

/**
 * Simple HTTP client implementation for New Relic Event API.
 * Sends events to New Relic directly using HTTP POST with gzip compression.
 */
public class SimpleNewRelicClient {

    private static final Logger log =
            LogManager.getLogger(SimpleNewRelicClient.class);

    private final ObjectMapper objectMapper;
    private final String newrelicKey;
    private final CloseableHttpClient httpClient;

    /**
     * Creates a new SimpleNewRelicClient with the specified newrelicKey.
     *
     * @param newrelicKey the New Relic license key
     */
    public SimpleNewRelicClient(final String newrelicKey) {
        this.newrelicKey = newrelicKey;
        this.objectMapper = new ObjectMapper();
        this.httpClient = HttpClients.createDefault();
    }

    public final void publish(final MetricEventBuilder builder)
            throws MetricReportingException {
        try {
            Map<String, Object> eventData = builder.build();
            NewRelicEvent event = buildEvent(eventData);

            // Always publish events in this simple implementation

            sendSingleEvent(event);
            log.debug("Successfully published single event to New Relic");

        } catch (Exception e) {
            throw new MetricReportingException("Failed to publish single event to New Relic", e);
        }
    }

    public final void publishBatch(final List<MetricEventBuilder> builders) {
        if (builders == null || builders.isEmpty()) {
            log.debug("No events to publish in batch");
            return;
        }

        try {
            List<NewRelicEvent> events = new ArrayList<>();
            for (MetricEventBuilder builder : builders) {
                try {
                    Map<String, Object> eventData = builder.build();
                    NewRelicEvent event = buildEvent(eventData);
                    events.add(event);
                } catch (Exception e) {
                    log.warn("Failed to build event from builder, skipping: {}", e.getMessage());
                }
            }

            if (events.isEmpty()) {
                log.debug("No valid events to publish after filtering");
                return;
            }

            // Split into batches if needed
            List<List<NewRelicEvent>> batches = splitIntoBatches(events, NewRelicConstants.DEFAULT_BATCH_SIZE);

            for (List<NewRelicEvent> batch : batches) {
                sendEventBatch(batch);
                log.debug("Successfully published batch of {} events to New Relic", batch.size());
            }

        } catch (Exception e) {
            log.error("Failed to publish batch events to New Relic", e);
        }
    }

    protected NewRelicEvent buildEvent(Map<String, Object> data) {
        NewRelicEvent event = new NewRelicEvent("APIAnalyticsEvent");
        populateCommonFields(data, event);

        log.debug("Built New Relic event with {} attributes", event.getAttributes().size());
        return event;
    }

    /**
     * Populates common fields from event data to New Relic event.
     */
    private void populateCommonFields(Map<String, Object> eventData, NewRelicEvent event) {
        // Add essential metrics
        event.addAttribute("requestCount", 1);
        event.addAttribute("timestamp", System.currentTimeMillis());

        // Add success/failure flags for easier querying
        Object proxyResponseCode = eventData.get("proxyResponseCode");
        if (proxyResponseCode instanceof Number) {
            int responseCode = ((Number) proxyResponseCode).intValue();
            event.addAttribute("isSuccess", responseCode >= 200 && responseCode < 400);
            event.addAttribute("isError", responseCode >= 400);
            event.addAttribute("isServerError", responseCode >= 500);
        }

        // Map common fields from APIM to New Relic format
        addAttributeIfPresent(eventData, event, "apiId", "apiId");
        addAttributeIfPresent(eventData, event, "apiName", "apiName");
        addAttributeIfPresent(eventData, event, "apiVersion", "apiVersion");
        addAttributeIfPresent(eventData, event, "apiContext", "apiContext");
        addAttributeIfPresent(eventData, event, "apiMethod", "apiMethod");
        addAttributeIfPresent(eventData, event, "apiResourceTemplate",
                            "apiResourceTemplate");
        addAttributeIfPresent(eventData, event, "apiCreator", "apiCreator");
        addAttributeIfPresent(eventData, event, "apiCreatorTenantDomain",
                            "apiCreatorTenantDomain");
        addAttributeIfPresent(eventData, event, "applicationId", "applicationId");
        addAttributeIfPresent(eventData, event, "applicationName",
                            "applicationName");
        addAttributeIfPresent(eventData, event, "applicationOwner",
                            "applicationOwner");
        addAttributeIfPresent(eventData, event, "correlationId", "correlationId");
        addAttributeIfPresent(eventData, event, "keyType", "keyType");
        addAttributeIfPresent(eventData, event, "userName", "userName");
        addAttributeIfPresent(eventData, event, "userIp", "userIp");
        addAttributeIfPresent(eventData, event, "userAgent", "userAgent");
        addAttributeIfPresent(eventData, event, "requestTimestamp",
                            "requestTimestamp");
        addAttributeIfPresent(eventData, event, "responseLatency",
                            "responseLatency");
        addAttributeIfPresent(eventData, event, "backendLatency",
                            "backendLatency");
        addAttributeIfPresent(eventData, event, "requestMediationLatency",
                            "requestMediationLatency");
        addAttributeIfPresent(eventData, event, "responseMediationLatency",
                            "responseMediationLatency");
        addAttributeIfPresent(eventData, event, "targetResponseCode",
                            "targetResponseCode");
        addAttributeIfPresent(eventData, event, "proxyResponseCode",
                            "proxyResponseCode");
        addAttributeIfPresent(eventData, event, "destination", "destination");
        addAttributeIfPresent(eventData, event, "organizationId",
                            "organizationId");
        addAttributeIfPresent(eventData, event, "environmentId",
                            "environmentId");
        addAttributeIfPresent(eventData, event, "regionId", "regionId");
        addAttributeIfPresent(eventData, event, "gatewayType", "gatewayType");
        addAttributeIfPresent(eventData, event, "responseCacheHit",
                            "responseCacheHit");
        addAttributeIfPresent(eventData, event, "apiType", "apiType");
        addAttributeIfPresent(eventData, event, "platform", "platform");

        // Handle properties as nested attributes with conversion
        if (eventData.containsKey("properties")) {
            Object propertiesObj = eventData.get("properties");
            if (propertiesObj instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> properties = (Map<String, Object>) propertiesObj;
                for (Map.Entry<String, Object> entry : properties.entrySet()) {
                    Object convertedValue = convertToSupportedType(entry.getValue());
                    event.addAttribute("prop_" + entry.getKey(), convertedValue);
                }
            }
        }
    }

    /**
     * Adds an attribute to the event if the source value is present.
     *
     * @param source The source map containing the data
     * @param target The target New Relic event
     * @param sourceKey The key in the source map
     * @param targetKey The key to use in the target event
     */
    private void addAttributeIfPresent(final Map<String, Object> source,
                                      final NewRelicEvent target,
                                      final String sourceKey,
                                      final String targetKey) {
        Object value = source.get(sourceKey);
        if (value != null) {
            Object convertedValue = convertToSupportedType(value);
            target.addAttribute(targetKey, convertedValue);
        }
    }

    /**
     * Converts complex types to New Relic supported types.
     *
     * @param value The value to convert
     * @return The converted value
     */
    private Object convertToSupportedType(final Object value) {
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

    /**
     * Sends a single event to New Relic with retry logic.
     *
     * @param event The event to send
     * @throws IOException If an I/O error occurs
     * @throws MetricReportingException If the event cannot be sent
     */
    private void sendSingleEvent(final NewRelicEvent event)
            throws IOException, MetricReportingException {
        List<Map<String, Object>> eventArray = new ArrayList<>();
        eventArray.add(event.toFlatMap());

        sendEventPayload(eventArray);
    }

    /**
     * Sends a batch of events to New Relic with retry logic.
     *
     * @param events The list of events to send
     * @throws IOException If an I/O error occurs
     * @throws MetricReportingException If the events cannot be sent
     */
    private void sendEventBatch(final List<NewRelicEvent> events)
            throws IOException, MetricReportingException {
        List<Map<String, Object>> eventArray = new ArrayList<>();
        for (NewRelicEvent event : events) {
            eventArray.add(event.toFlatMap());
        }

        sendEventPayload(eventArray);
    }

    /**
     * Sends the event payload to New Relic Event API with retry logic.
     *
     * @param events The list of event maps to send
     * @throws IOException If an I/O error occurs
     * @throws MetricReportingException If the events cannot be sent
     */
    private void sendEventPayload(final List<Map<String, Object>> events)
            throws IOException, MetricReportingException {
        String jsonPayload = objectMapper.writeValueAsString(events);

        Exception lastException = null;
        int attempts = 0;
        int maxAttempts = NewRelicConstants.DEFAULT_RETRY_ATTEMPTS + 1; // +1 for the initial attempt

        while (attempts < maxAttempts) {
            try {
                sendHttpRequest(jsonPayload);
                return; // Success

            } catch (IOException e) {
                lastException = e;
                attempts++;

                if (attempts >= maxAttempts) {
                    break; // No more retries
                }

                if (shouldRetry(e)) {
                    long delay = calculateRetryDelay(attempts);
                    log.warn("Event publishing failed (attempt {}/{}), retrying in {}ms: {}",
                            attempts, maxAttempts, delay, e.getMessage());

                    try {
                        Thread.sleep(delay);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new MetricReportingException("Interrupted during retry delay", ie);
                    }
                } else {
                    break; // Don't retry for non-retryable errors
                }
            }
        }

        throw new MetricReportingException(
                String.format("Failed to publish events after %d attempts", attempts), lastException);
    }

    /**
     * Sends the HTTP request to New Relic Event API.
     *
     * @param jsonPayload The JSON payload to send
     * @throws IOException If an I/O error occurs
     */
    private void sendHttpRequest(final String jsonPayload) throws IOException {
        HttpPost request = new HttpPost(NewRelicConstants.DEFAULT_ENDPOINT);

        // Set headers
        request.setHeader(NewRelicConstants.API_KEY_HEADER, newrelicKey);
        request.setHeader(NewRelicConstants.CONTENT_TYPE_HEADER, NewRelicConstants.APPLICATION_JSON);

        // Compress payload if enabled
        byte[] payloadBytes;
        if (NewRelicConstants.DEFAULT_COMPRESSION_ENABLED) {
            request.setHeader(NewRelicConstants.CONTENT_ENCODING_HEADER, NewRelicConstants.GZIP_ENCODING);
            payloadBytes = gzipCompress(jsonPayload.getBytes(StandardCharsets.UTF_8));
        } else {
            payloadBytes = jsonPayload.getBytes(StandardCharsets.UTF_8);
        }

        request.setEntity(new ByteArrayEntity(payloadBytes));

        // Execute request
        try (CloseableHttpResponse response = httpClient.execute(request)) {
            int statusCode = response.getStatusLine().getStatusCode();

            final int successCode = 200;
            if (statusCode == successCode) {
                log.debug("Successfully sent events to New Relic");
            } else {
                String responseBody = getResponseBody(response);
                String errorMessage = String.format("New Relic API returned status %d: %s",
                        statusCode, responseBody);

                log.error(errorMessage);
                throw new IOException(errorMessage);
            }
        }
    }

    /**
     * Compresses data using GZIP.
     *
     * @param data The data to compress
     * @return The compressed data
     * @throws IOException If compression fails
     */
    private byte[] gzipCompress(final byte[] data) throws IOException {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             GZIPOutputStream gzipOut = new GZIPOutputStream(baos)) {

            gzipOut.write(data);
            gzipOut.finish();
            return baos.toByteArray();
        }
    }

    /**
     * Gets the response body from HTTP response.
     *
     * @param response The HTTP response
     * @return The response body as a string
     */
    private String getResponseBody(final CloseableHttpResponse response) {
        try {
            HttpEntity entity = response.getEntity();
            if (entity != null) {
                return EntityUtils.toString(entity, StandardCharsets.UTF_8);
            }
        } catch (IOException e) {
            log.debug("Failed to read response body", e);
        }
        return "";
    }

    /**
     * Determines if an error should trigger a retry.
     *
     * @param e The exception to check
     * @return True if the error is retryable
     */
    private boolean shouldRetry(final Exception e) {
        String message = e.getMessage();
        if (message != null) {
            // Check for retryable HTTP status codes
            for (int retryableCode : NewRelicConstants.RETRYABLE_STATUS_CODES) {
                if (message.contains("status " + retryableCode)) {
                    return true;
                }
            }
        }

        // Retry on general network errors
        return e instanceof IOException;
    }

    /**
     * Calculates retry delay with exponential backoff and jitter.
     *
     * @param attempt The attempt number
     * @return The delay in milliseconds
     */
    private long calculateRetryDelay(final int attempt) {
        long baseDelay = NewRelicConstants.DEFAULT_RETRY_DELAY;
        long delay = (long) (baseDelay * Math.pow(NewRelicConstants.RETRY_BACKOFF_MULTIPLIER, attempt - 1));

        // Apply bounds
        delay = Math.min(delay, NewRelicConstants.MAX_RETRY_DELAY_MS);
        delay = Math.max(delay, NewRelicConstants.MIN_RETRY_DELAY_MS);

        // Add jitter to avoid thundering herd
        final double minJitter = 0.1;
        final double maxJitter = 0.3;
        double jitter = ThreadLocalRandom.current().nextDouble(minJitter, maxJitter);
        delay = (long) (delay * (1 + jitter));

        return delay;
    }

    /**
     * Splits a list of events into smaller batches.
     *
     * @param events The list of events to split
     * @param batchSize The size of each batch
     * @return A list of event batches
     */
    private List<List<NewRelicEvent>> splitIntoBatches(final List<NewRelicEvent> events,
                                                      final int batchSize) {
        List<List<NewRelicEvent>> batches = new ArrayList<>();

        for (int i = 0; i < events.size(); i += batchSize) {
            int endIndex = Math.min(i + batchSize, events.size());
            batches.add(events.subList(i, endIndex));
        }

        return batches;
    }

    /**
     * Closes the HTTP client and releases resources.
     */
    public final void close() {
        try {
            if (httpClient != null) {
                httpClient.close();
            }
        } catch (IOException e) {
            log.warn("Error closing HTTP client", e);
        }
    }

    @Override
    protected final void finalize() throws Throwable {
        close();
        super.finalize();
    }
}
