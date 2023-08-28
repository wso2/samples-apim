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
import org.wso2.am.analytics.publisher.reporter.MetricEventBuilder;

import java.util.concurrent.BlockingQueue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * A bounded queue that wraps {@link java.util.concurrent.LinkedBlockingDeque}.
 * Each element of the queue is a {@link ThriftMetricEventBuilder}.
 */
public class EventQueue {
    private static final Logger log = LoggerFactory.getLogger(EventQueue.class);
    private final BlockingQueue<MetricEventBuilder> eventQueue;
    private final ExecutorService publisherExecutorService;
    private final AtomicInteger failureCount;

    public EventQueue(int queueSize, int workerThreadCount, ObjectPool dataPublisherPool) {
        // Using a fixed worker thread pool and a bounded queue to control the load on the server
        this.publisherExecutorService = Executors.newFixedThreadPool(workerThreadCount,
                new ThriftAnalyticsThreadFactory("Queue-Worker"));
        this.eventQueue = new LinkedBlockingQueue<>(queueSize);
        this.failureCount = new AtomicInteger(0);
        for (int i = 0; i < workerThreadCount; i++) {
            publisherExecutorService.submit(new ParallelQueueWorker(eventQueue, dataPublisherPool));
        }
    }

    public void put(MetricEventBuilder builder) {
        try {
            if (!eventQueue.offer(builder)) {
                int count = failureCount.incrementAndGet();
                if (count == 1) {
                    log.error("Event queue is full. Starting to drop analytics events.");
                } else if (count % 1000 == 0) {
                    log.error("Event queue is full. " + count + " events dropped so far");
                }
            }
        } catch (RejectedExecutionException e) {
            log.error("Task submission failed. Task queue might be full", e);
        }
    }

    @Override
    protected void finalize() throws Throwable {
        publisherExecutorService.shutdown();
        super.finalize();
    }
}
