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
import org.wso2.am.analytics.publisher.client.NewRelicClient;
import org.wso2.am.analytics.publisher.reporter.MetricEventBuilder;
import org.wso2.am.analytics.publisher.reporter.cloud.DefaultAnalyticsThreadFactory;

import java.util.concurrent.BlockingQueue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Asynchronous event queue for New Relic analytics processing.
 */
public class NewRelicEventQueue {
    
    private static final Logger log = LogManager.getLogger(NewRelicEventQueue.class);
    private final BlockingQueue<MetricEventBuilder> eventQueue;
    private final ExecutorService publisherExecutorService;
    private final AtomicInteger failureCount;

    /**
     * Creates a new NewRelicEventQueue with the specified newrelicKey.
     * 
     * @param queueSize         Maximum number of events to buffer
     * @param workerThreadCount Number of worker threads for processing events
     * @param newrelicKey       New Relic license key for authentication
     */
    public NewRelicEventQueue(int queueSize, int workerThreadCount, String newrelicKey) {
        this(queueSize, workerThreadCount, new NewRelicClient(newrelicKey));
    }

    /**
     * Creates a new NewRelicEventQueue with the specified client.
     * 
     * @param queueSize         Maximum number of events to buffer
     * @param workerThreadCount Number of worker threads for processing events
     * @param client           New Relic client for publishing events
     */
    public NewRelicEventQueue(int queueSize, int workerThreadCount, NewRelicClient client) {
        publisherExecutorService = Executors.newFixedThreadPool(workerThreadCount,
                new DefaultAnalyticsThreadFactory("NewRelic-Queue-Worker"));
        eventQueue = new LinkedBlockingQueue<>(queueSize);
        failureCount = new AtomicInteger(0);
        
        // Start worker threads
        for (int i = 0; i < workerThreadCount; i++) {
            publisherExecutorService.submit(new NewRelicQueueWorker(eventQueue, client));
        }
    }

    /**
     * Puts an event builder into the queue for asynchronous processing.
     * If the queue is full, the event will be dropped and a warning will be logged.
     * 
     * @param builder The metric event builder to queue
     */
    public void put(MetricEventBuilder builder) {
        try {
            if (!eventQueue.offer(builder)) {
                int count = failureCount.incrementAndGet();
                if (count == 1) {
                    log.error("New Relic event queue is full. Starting to drop analytics events.");
                } else if (count % 1000 == 0) {
                    log.error("New Relic event queue is full. {} events dropped so far", count);
                }
            }
        } catch (RejectedExecutionException e) {
            log.warn("Task submission failed. Task queue might be full", e);
        }
    }

    /**
     * Gets the current size of the event queue.
     * 
     * @return Number of events currently in the queue
     */
    public int size() {
        return eventQueue.size();
    }

    /**
     * Gets the number of events that have been dropped due to queue overflow.
     * 
     * @return Number of dropped events
     */
    public int getFailureCount() {
        return failureCount.get();
    }

    /**
     * Shuts down the queue and terminates all worker threads.
     * This method should be called when the application is shutting down.
     */
    public void shutdown() {
        if (publisherExecutorService != null) {
            publisherExecutorService.shutdown();
            log.info("New Relic event queue shutdown initiated");
        }
    }

    @Override
    protected void finalize() throws Throwable {
        shutdown();
        super.finalize();
    }
}
