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

import org.apache.commons.pool.BasePoolableObjectFactory;
import org.apache.commons.pool.ObjectPool;
import org.apache.commons.pool.impl.StackObjectPool;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.wso2.am.analytics.publisher.exception.MetricCreationException;
import org.wso2.am.analytics.publisher.reporter.AbstractMetricReporter;
import org.wso2.am.analytics.publisher.reporter.CounterMetric;
import org.wso2.am.analytics.publisher.reporter.MetricSchema;
import org.wso2.am.analytics.publisher.reporter.TimerMetric;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * Responsible for initiating and maintaining the Thrift event queue and the Thrift client object pool, 
 * and creating the Thrift counter metric.
 */
public class ThriftMetricReporter extends AbstractMetricReporter {

    private static final Logger log = LoggerFactory.getLogger(ThriftMetricReporter.class);
    private EventQueue eventQueue;
    private ObjectPool dataPublisherPool;

    public ThriftMetricReporter(Map<String, String> properties) throws MetricCreationException {
        super(properties);

        // If agentType is not configured (i.e: null), ThriftClient#createDataPublisher would use the default type
        String agentType = properties.get(Constants.THRIFT_ENDPOINT_AGENT_TYPE);
        String receiverUrlSet = properties.get(Constants.THRIFT_ENDPOINT_RECEIVER_URL_SET);
        String authUrlSet = properties.get(Constants.THRIFT_ENDPOINT_AUTH_URL_SET);
        String username = properties.get(Constants.THRIFT_ENDPOINT_USERNAME);
        String password = properties.get(Constants.THRIFT_ENDPOINT_PASSWORD);

        int queueSize = Constants.DEFAULT_THRIFT_DATA_PUBLISHER_EVENT_QUEUE_SIZE;
        int workerThreads = Constants.DEFAULT_THRIFT_DATA_PUBLISHER_WORKER_THREAD_COUNT;
        if (properties.get(Constants.THRIFT_DATA_PUBLISHER_EVENT_QUEUE_SIZE) != null) {
            queueSize = Integer.parseInt(properties.get(Constants.THRIFT_DATA_PUBLISHER_EVENT_QUEUE_SIZE));
        }
        if (properties.get(Constants.THRIFT_DATA_PUBLISHER_WORKER_THREAD_COUNT) != null) {
            workerThreads = Integer.parseInt(properties.get(Constants.THRIFT_DATA_PUBLISHER_WORKER_THREAD_COUNT));
        }
        
        int maxIdle = Constants.DEFAULT_THRIFT_DATA_PUBLISHER_POOL_MAX_IDLE;
        int initIdleCapacity = Constants.DEFAULT_THRIFT_DATA_PUBLISHER_INIT_IDLE_CAPACITY;
        if (properties.get(Constants.THRIFT_DATA_PUBLISHER_POOL_MAX_IDLE) != null) {
            maxIdle = Integer.parseInt(properties.get(Constants.THRIFT_DATA_PUBLISHER_POOL_MAX_IDLE));
        }
        if (properties.get(Constants.THRIFT_DATA_PUBLISHER_INIT_IDLE_CAPACITY) != null) {
            initIdleCapacity = Integer.parseInt(properties.get(Constants.THRIFT_DATA_PUBLISHER_INIT_IDLE_CAPACITY));
        }
        
        dataPublisherPool = new StackObjectPool(new BasePoolableObjectFactory() {
            @Override
            public Object makeObject() throws Exception {
                if (log.isDebugEnabled()) {
                    log.debug("Initializing new ThriftClient instance");
                }
                return new ThriftClient(agentType, receiverUrlSet, authUrlSet, username, password);
            }
        }, maxIdle, initIdleCapacity);
        eventQueue = new EventQueue(queueSize, workerThreads, dataPublisherPool);
    }

    @Override
    protected void validateConfigProperties(Map<String, String> properties) throws MetricCreationException {
        List<String> requiredProperties = Arrays.asList(Constants.THRIFT_ENDPOINT_RECEIVER_URL_SET,
                Constants.THRIFT_ENDPOINT_AUTH_URL_SET, Constants.THRIFT_ENDPOINT_USERNAME,
                Constants.THRIFT_ENDPOINT_PASSWORD);
        List<String> missingProperties = new ArrayList<>();

        if (properties != null && !properties.isEmpty()) {
            for (String property : requiredProperties) {
                if (properties.get(property) == null || properties.get(property).isEmpty()) {
                    missingProperties.add(property);
                }
            }
        } else {
            missingProperties = requiredProperties;
        }

        if (!missingProperties.isEmpty()) {
            throw new MetricCreationException("The following configuration properties are required: " +
                        Arrays.toString(missingProperties.toArray()));
        }
    }

    @Override
    protected CounterMetric createCounter(String name, MetricSchema schema) throws MetricCreationException {
        return new ThriftCounterMetric(name, schema, eventQueue);
    }

    @Override
    protected TimerMetric createTimer(String name) {
        return null;
    }
}
