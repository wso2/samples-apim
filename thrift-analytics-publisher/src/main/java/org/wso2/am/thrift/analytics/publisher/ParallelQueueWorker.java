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

import org.apache.commons.pool.ObjectPool;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.wso2.am.analytics.publisher.exception.MetricReportingException;
import org.wso2.am.analytics.publisher.reporter.MetricEventBuilder;

import java.util.concurrent.BlockingQueue;

/**
 * The worker thread which takes {@link ThriftMetricEventBuilder} objects from the event queue, and publishes them
 * to the Thrift server via {@link ThriftClient}s taken from the object pool.
 */
public class ParallelQueueWorker implements Runnable {
    private static final Logger log = LoggerFactory.getLogger(ParallelQueueWorker.class);
    private BlockingQueue<MetricEventBuilder> eventQueue;
    private ObjectPool dataPublisherPool;

    public ParallelQueueWorker(BlockingQueue<MetricEventBuilder> eventQueue, ObjectPool dataPublisherPool) {
        this.eventQueue = eventQueue;
        this.dataPublisherPool = dataPublisherPool;
    }
    
    @Override
    public void run() {
        while (true) {
            if (log.isDebugEnabled()) {
                log.debug(eventQueue.size() + " messages in queue before " +
                        Thread.currentThread().getName().replaceAll("[\r\n]", "")
                        + " worker has polled queue");
            }

            ThriftMetricEventBuilder eventBuilder = null;
            ThriftClient thriftClient = null;
            try {
                eventBuilder = (ThriftMetricEventBuilder) eventQueue.take();
                thriftClient = (ThriftClient) dataPublisherPool.borrowObject();
                if (thriftClient != null) {
                    thriftClient.publish(eventBuilder);
                } else {
                    log.error("Failed to publish the eventBuilder, since the thriftClient is null.");
                }
            } catch (MetricReportingException e) {
                if (eventBuilder.getThriftStream() == ThriftStream.FAULT_STREAM) {
                    if (log.isDebugEnabled()) {
                        /*
                        Fault events with null attributes are possible in APIM 4.2.0 (eg: invoke API with invalid token)
                        In such cases, we drop those events, but not log them with error level,
                        since the log file will be flooded upon too many errors.
                         */
                        log.debug("Builder instance is not duly filled. Event building failed", e);
                    }
                } else {
                    log.error("Builder instance is not duly filled. Event building failed", e);
                }
            } catch (InterruptedException e) {
                log.error("Thread was interrupted when taking the ThriftMetricEventBuilder from the event queue", e);
                Thread.currentThread().interrupt();
            } catch (Exception e) {
                log.error("Analytics event sending failed. Event will be dropped", e);
            } finally {
                try {
                    dataPublisherPool.returnObject(thriftClient);
                } catch (Exception e) {
                    log.error("Failed to return the thrift client to the data publisher pool", e);
                }
            }

            if (log.isDebugEnabled()) {
                log.debug(eventQueue.size() + " messages in queue after " +
                        Thread.currentThread().getName().replaceAll("[\r\n]", "")
                        + " worker has finished work");
            }
        }
    }
}
