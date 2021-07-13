package org.wso2.am.analytics.publisher.sample.reporter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.wso2.am.analytics.publisher.exception.MetricReportingException;
import org.wso2.am.analytics.publisher.reporter.CounterMetric;
import org.wso2.am.analytics.publisher.reporter.MetricEventBuilder;
import org.wso2.am.analytics.publisher.reporter.MetricSchema;
import org.wso2.am.analytics.publisher.reporter.cloud.DefaultResponseMetricEventBuilder;

import java.util.Map;

public class LogCounterMetric implements CounterMetric {

    private static final Logger log = LoggerFactory.getLogger(LogCounterMetric.class);
    private String name;
    private MetricSchema schema;

    public LogCounterMetric(String name, MetricSchema schema) {
        this.name = name;
        this.schema = schema;
    }

    @Override
    public int incrementCount(MetricEventBuilder metricEventBuilder) throws MetricReportingException {
        Map<String, Object> properties = metricEventBuilder.build();
        log.info("Metric Name: " + name.replaceAll("[\r\n]", "") + " Metric Value: "
                + properties.toString().replaceAll("[\r\n]", ""));
        return 0;
    }

    @Override
    public String getName() {
        return this.name;
    }

    @Override
    public MetricSchema getSchema() {
        return this.schema;
    }

    @Override
    public MetricEventBuilder getEventBuilder() {
        return new DefaultResponseMetricEventBuilder();
    }
}
