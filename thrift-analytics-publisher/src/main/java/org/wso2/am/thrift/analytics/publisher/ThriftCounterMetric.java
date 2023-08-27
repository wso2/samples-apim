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

import org.wso2.am.analytics.publisher.exception.MetricCreationException;
import org.wso2.am.analytics.publisher.exception.MetricReportingException;
import org.wso2.am.analytics.publisher.reporter.CounterMetric;
import org.wso2.am.analytics.publisher.reporter.MetricEventBuilder;
import org.wso2.am.analytics.publisher.reporter.MetricSchema;

/**
 * Implementation of {@link CounterMetric} for the Thrift Metric Reporter.
 */
public class ThriftCounterMetric implements CounterMetric {
    private String name;
    private MetricSchema schema;
    private EventQueue eventQueue;

    public ThriftCounterMetric(String name, MetricSchema schema, EventQueue eventQueue) throws MetricCreationException {
        this.name = name;
        this.schema = schema;
        this.eventQueue = eventQueue;
    }

    @Override
    public int incrementCount(MetricEventBuilder builder) throws MetricReportingException {
        eventQueue.put(builder);
        return 0;
    }

    @Override
    public String getName() {
        return name;
    }

    @Override
    public MetricSchema getSchema() {
        return schema;
    }

    @Override
    public MetricEventBuilder getEventBuilder() {
        switch (schema) {
            case ERROR:
                return new ThriftMetricEventBuilder(
                        InputValidator.getInstance().getEventProperties(ThriftMetricSchema.THRIFT_ERROR),
                        ThriftStream.FAULT_STREAM);
            case RESPONSE:
            default:
                return new ThriftMetricEventBuilder(
                        InputValidator.getInstance().getEventProperties(ThriftMetricSchema.THRIFT_RESPONSE),
                        ThriftStream.REQUEST_STREAM);
        }
    }
}
