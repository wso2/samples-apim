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
import org.wso2.am.analytics.publisher.exception.MetricReportingException;
import org.wso2.am.analytics.publisher.reporter.MetricEventBuilder;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.BlockingQueue;

/**
 * Worker thread that dequeues events from the blocking queue and sends them to the New Relic client.
 * Events are processed in batches to optimize performance and reduce API calls.
 */
public class NewRelicQueueWorker implements Runnable {
    
    private static final Logger log = LogManager.getLogger(NewRelicQueueWorker.class);
    private final BlockingQueue<MetricEventBuilder> eventQueue;
    private final NewRelicClient client;
    private final int batchSize = 5;    // LOWERED FOR TESTING: 5 events instead of 50
    private final long batchTimeoutMs = 2000;

    /**
     * Creates a new NewRelicQueueWorker.
     * 
     * @param queue  The blocking queue to poll events from
     * @param client The New Relic client to send events to
     */
    public NewRelicQueueWorker(BlockingQueue<MetricEventBuilder> queue, NewRelicClient client) {
        this.eventQueue = queue;
        this.client = client;
    }

    /**
     * Continuously runs a worker thread that processes analytics events in batches from a blocking queue.
     */
    @Override
    public void run() {
        List<MetricEventBuilder> batch = new ArrayList<>(batchSize);
        long lastBatchTime = System.currentTimeMillis();
        
        while (!Thread.currentThread().isInterrupted()) {
            try {
                MetricEventBuilder eventBuilder = eventQueue.poll(100, java.util.concurrent.TimeUnit.MILLISECONDS);
                if (eventBuilder != null) {
                    batch.add(eventBuilder);
                }

                long currentBatchTime = System.currentTimeMillis();
                boolean shouldSendBatch = batch.size() >= batchSize ||
                        (currentBatchTime - lastBatchTime) >= batchTimeoutMs;

                if (shouldSendBatch && !batch.isEmpty()) {
                    log.debug("Processing batch of {} events (size trigger: {}, time trigger: {})", 
                        batch.size(), batch.size() >= batchSize, (currentBatchTime - lastBatchTime) >= batchTimeoutMs);
                    processBatch(new ArrayList<>(batch));
                    batch.clear();
                    lastBatchTime = currentBatchTime;
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.info("New Relic queue worker interrupted, shutting down");
                break;
            } catch (Exception e) {
                log.error("Analytics event sending failed. Event will be dropped", e);
            }
        }
        
        // Process any remaining events in the batch before shutting down
        if (!batch.isEmpty()) {
            log.info("Processing final batch of {} events before shutdown", batch.size());
            processBatch(batch);
        }
    }

    /**
     * Processes a batch of events by sending them to the New Relic client.
     * Single events are sent individually, while multiple events are sent as a batch.
     * 
     * @param batch The list of events to process
     */
    private void processBatch(List<MetricEventBuilder> batch) {
        try {
            if (batch.size() == 1) {
                client.publish(batch.get(0));
                log.debug("Processed single event");
            } else {
                client.publishBatch(batch);
                log.debug("Processed batch of {} events", batch.size());
            }
        } catch (MetricReportingException e) {
            log.error("Failed to process batch of {} events: {}", batch.size(), e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error processing batch of {} events", batch.size(), e);
        }
    }
}
