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

package org.wso2.am.analytics.publisher.reporter.newrelic;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.wso2.am.analytics.publisher.exception.MetricCreationException;
import org.wso2.am.analytics.publisher.reporter.AbstractMetricReporter;
import org.wso2.am.analytics.publisher.reporter.CounterMetric;
import org.wso2.am.analytics.publisher.reporter.MetricSchema;
import org.wso2.am.analytics.publisher.reporter.TimerMetric;
import org.wso2.am.analytics.publisher.util.Constants;

import java.util.Map;

/**
 * New Relic Analytics Reporter for WSO2 API Manager.
 * 
 */
public class NewRelicReporter extends AbstractMetricReporter {
    
    private static final Logger log = LogManager.getLogger(NewRelicReporter.class);
    private final NewRelicEventQueue eventQueue;

    /**
     * Constructs a New Relic reporter with the specified configuration.
     * 
     * @param properties Configuration properties map containing:
     * @throws MetricCreationException if configuration validation fails or queue initialization fails
     */
    public NewRelicReporter(Map<String, String> properties) throws MetricCreationException {        
        super(properties);
        
        // Parse configuration with defaults
        int queueSize = Constants.DEFAULT_QUEUE_SIZE;
        int workerThreads = Constants.DEFAULT_WORKER_THREADS;
        if (properties.get(Constants.QUEUE_SIZE) != null) {
            queueSize = Integer.parseInt(properties.get(Constants.QUEUE_SIZE));
        }
        if (properties.get(Constants.WORKER_THREAD_COUNT) != null) {
            workerThreads = Integer.parseInt(properties.get(Constants.WORKER_THREAD_COUNT));
        }
        String newrelicKey = properties.get(Constants.NEW_RELIC_KEY);

        log.info("Initializing New Relic reporter with queue size: {}, worker threads: {}", queueSize, workerThreads);
        this.eventQueue = new NewRelicEventQueue(queueSize, workerThreads, newrelicKey);
        log.info("New Relic reporter initialized successfully");
    }

    /**
     * Validates the New Relic configuration properties.
     * 
     * @param properties Configuration properties map to validate
     * @throws MetricCreationException if properties are null or New Relic key is missing/empty
     */
    @Override
    protected void validateConfigProperties(Map<String, String> properties) throws MetricCreationException {
        log.debug("Validating New Relic configuration properties");
        
        if (properties == null) {
            log.error("Configuration properties are null");
            throw new MetricCreationException("Properties cannot be null");
        }
        
        String newrelicKey = properties.get(Constants.NEW_RELIC_KEY);
        if (newrelicKey == null || newrelicKey.trim().isEmpty()) {
            log.error("New Relic key is missing or empty");
            throw new MetricCreationException("New Relic key is required");
        }
        
        log.info("New Relic configuration properties validated successfully");
    }

    /**
     * Creates a counter metric for tracking API analytics events.
     * 
     * @param name The unique name identifier for the counter metric
     * @param metricSchema The schema defining the structure of events for this metric
     * @return A new {@link NewRelicCounterMetric} instance ready for event tracking
     * @throws MetricCreationException if metric name is null/empty, schema is null,
     *                                 or counter creation fails
     */
    @Override
    public CounterMetric createCounter(String name, MetricSchema metricSchema) throws MetricCreationException {
        if (name == null || name.trim().isEmpty()) {
            throw new MetricCreationException("Counter metric name cannot be null or empty");
        }
        
        if (metricSchema == null) {
            throw new MetricCreationException("Metric schema cannot be null");
        }
        
        try {
            return new NewRelicCounterMetric(name, eventQueue, metricSchema);
        } catch (Exception e) {
            log.error("Failed to create counter metric: '{}'", name, e);
            throw new MetricCreationException("Failed to create counter metric: " + e.getMessage(), e);
        }
    }

    /**
     * Creates a timer metric for measuring execution durations.
     * 
     * @param name The name of the timer metric
     * @return {@code null} as timer metrics are not implemented
     */
    @Override
    protected TimerMetric createTimer(String name) {
        log.warn("Timer metrics are not implemented for New Relic reporter: '{}'", name);
        return null;
    }

    /**
     * Provides access to the event queue for testing and monitoring purposes.
     * 
     * @return The {@link NewRelicEventQueue} instance used by this reporter
     */
    public NewRelicEventQueue getEventQueue() {
        return eventQueue;
    }

    /**
     * Gracefully shuts down the New Relic reporter and releases all resources.
     * 
     */
    public void shutdown() {
        if (eventQueue != null) {
            log.info("Shutting down New Relic reporter");
            eventQueue.shutdown();
            log.info("New Relic reporter shutdown completed");
        }
    }

    /**
     * Ensures proper cleanup when the object is garbage collected.
     * 
     * @throws Throwable if cleanup fails
     * @deprecated Finalizers are deprecated in Java 9+. Use try-with-resources or explicit shutdown.
     */
    @Override
    protected void finalize() throws Throwable {
        shutdown();
        super.finalize();
    }
}
