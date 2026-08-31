/*
 * Copyright (c) 2025, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
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

package org.wso2.am.analytics.publisher.reporter;

import org.testng.Assert;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;
import org.wso2.am.analytics.publisher.exception.MetricCreationException;
import org.wso2.am.analytics.publisher.reporter.newrelic.NewRelicCounterMetric;
import org.wso2.am.analytics.publisher.reporter.newrelic.NewRelicMetricEventBuilder;
import org.wso2.am.analytics.publisher.reporter.newrelic.NewRelicReporter;
import org.wso2.am.analytics.publisher.util.Constants;

import java.util.HashMap;
import java.util.Map;

/**
 * Unit tests for New Relic Reporter.
 */
public class NewRelicReporterTest {

    private Map<String, String> properties;

    @BeforeClass
    public void setup() {
        properties = new HashMap<>();
        properties.put(Constants.NEW_RELIC_KEY, "test-license-key");
        properties.put(Constants.TYPE, Constants.NEW_RELIC);
    }

    @Test
    public void testNewRelicReporterCreation() throws MetricCreationException {
        NewRelicReporter reporter = new NewRelicReporter(properties);
        Assert.assertNotNull(reporter);
        Assert.assertNotNull(reporter.getEventQueue());
    }

    @Test
    public void testCreateCounterMetric() throws MetricCreationException {
        NewRelicReporter reporter = new NewRelicReporter(properties);
        CounterMetric counter = reporter.createCounter("testCounter", 
                MetricSchema.RESPONSE);
        
        Assert.assertNotNull(counter);
        Assert.assertTrue(counter instanceof NewRelicCounterMetric);
    }

    @Test(expectedExceptions = MetricCreationException.class)
    public void testNewRelicReporterCreationWithInvalidConfig() 
            throws MetricCreationException {
        Map<String, String> invalidProperties = new HashMap<>();
        invalidProperties.put(Constants.NEW_RELIC_KEY, "");
        
        new NewRelicReporter(invalidProperties);
    }

    @Test
    public void testEventBuilder() throws MetricCreationException {
        NewRelicReporter reporter = new NewRelicReporter(properties);
        CounterMetric counter = reporter.createCounter("testCounter", 
                MetricSchema.RESPONSE);
        
        Assert.assertNotNull(counter.getEventBuilder());
        Assert.assertTrue(counter.getEventBuilder() instanceof NewRelicMetricEventBuilder);
    }
}
