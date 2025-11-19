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
import org.wso2.am.analytics.publisher.exception.MetricReportingException;
import org.wso2.am.analytics.publisher.reporter.CounterMetric;
import org.wso2.am.analytics.publisher.reporter.MetricEventBuilder;
import org.wso2.am.analytics.publisher.reporter.MetricSchema;

/**
 * New Relic implementation of counter metrics for API analytics tracking.
 * 
 */
public class NewRelicCounterMetric implements CounterMetric {
    
    private static final Logger log = LogManager.getLogger(NewRelicCounterMetric.class);
    private final NewRelicEventQueue queue;
    private final String name;
    private final MetricSchema schema;

    /**
     * Constructs a New Relic counter metric with the specified configuration.
     * 
     * @param name The unique identifier for this counter metric
     * @param queue The event queue for asynchronous event processing
     * @param schema The metric schema defining the event structure
     */
    public NewRelicCounterMetric(String name, NewRelicEventQueue queue, MetricSchema schema) {
        this.name = name;
        this.schema = schema;
        this.queue = queue;
        
        log.debug("NewRelicCounterMetric created: name='{}', schema='{}'", name, schema);
    }

    /**
     * Increments the counter by queuing the metric event for processing.
     * 
     * @param metricEventBuilder The event builder containing metric data
     * @return Always returns 0 as New Relic doesn't provide synchronous counter values
     * @throws MetricReportingException if the event builder is invalid
     */
    @Override
    public int incrementCount(MetricEventBuilder metricEventBuilder) throws MetricReportingException {
        if (metricEventBuilder == null) {
            throw new MetricReportingException("MetricEventBuilder cannot be null");
        }
        
        try {
            queue.put(metricEventBuilder);
            log.debug("Event queued successfully for counter metric: '{}'", name);
        } catch (Exception e) {
            log.error("Failed to queue event for counter metric: '{}'", name, e);
            throw new MetricReportingException("Failed to queue metric event: " + e.getMessage(), e);
        }
        
        return 0;
    }

    /**
     * Gets the name of this counter metric.
     * 
     * @return The metric name
     */
    @Override
    public String getName() {
        return this.name;
    }

    /**
     * Gets the schema type of this counter metric.
     * 
     * @return The metric schema
     */
    @Override
    public MetricSchema getSchema() {
        return this.schema;
    }

    /**
     * Returns Event Builder used for this CounterMetric.
     * Creates a new New Relic metric event builder instance.
     * 
     * @return {@link MetricEventBuilder} for this {@link CounterMetric}
     */
    @Override
    public MetricEventBuilder getEventBuilder() {
        log.debug("Creating event builder for counter: '{}', schema: '{}'", name, schema);
        return new NewRelicMetricEventBuilder();
    }
}
