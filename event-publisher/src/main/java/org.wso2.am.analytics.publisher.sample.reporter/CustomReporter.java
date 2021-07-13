package org.wso2.am.analytics.publisher.sample.reporter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.wso2.am.analytics.publisher.exception.MetricCreationException;
import org.wso2.am.analytics.publisher.reporter.CounterMetric;
import org.wso2.am.analytics.publisher.reporter.MetricReporter;
import org.wso2.am.analytics.publisher.reporter.MetricSchema;
import org.wso2.am.analytics.publisher.reporter.TimerMetric;

import java.util.Map;

public class CustomReporter implements MetricReporter {

    private static final Logger log = LoggerFactory.getLogger(CustomReporter.class);

    public CustomReporter(Map<String, String> properties) {
        log.info("Successfully initialized");
    }

    @Override
    public CounterMetric createCounterMetric(String name, MetricSchema metricSchema) throws MetricCreationException {
        LogCounterMetric logCounterMetric = new LogCounterMetric(name, metricSchema);
        return logCounterMetric;
    }

    @Override
    public TimerMetric createTimerMetric(String s) {
        return null;
    }

    @Override
    public Map<String, String> getConfiguration() {
        return null;
    }
}
