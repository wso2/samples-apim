package org.wso2.am.analytics.publisher.sample.reporter;

import com.google.gson.Gson;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.wso2.am.analytics.publisher.exception.MetricReportingException;
import org.wso2.am.analytics.publisher.reporter.CounterMetric;
import org.wso2.am.analytics.publisher.reporter.MetricEventBuilder;
import org.wso2.am.analytics.publisher.reporter.MetricSchema;
import org.wso2.am.analytics.publisher.reporter.cloud.DefaultFaultMetricEventBuilder;
import org.wso2.am.analytics.publisher.reporter.cloud.DefaultResponseMetricEventBuilder;

import java.util.Map;

public class LogCounterMetric implements CounterMetric {

    private static final Logger log = LoggerFactory.getLogger(LogCounterMetric.class);
    private String name;
    private MetricSchema schema;
    private final Gson gson;

    public LogCounterMetric(String name, MetricSchema schema) {
        this.name = name;
        this.schema = schema;
        this.gson = new Gson();
    }

    @Override
    public int incrementCount(MetricEventBuilder metricEventBuilder) throws MetricReportingException {
        Map<String, Object> event = metricEventBuilder.build();
        String jsonString = gson.toJson(event);
        log.info("apimMetrics: " + name.replaceAll("[\r\n]", "") + ", properties :" +
                jsonString.replaceAll("[\r\n]", ""));
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
        switch (schema) {
            case RESPONSE:
                return new DefaultResponseMetricEventBuilder();
            case ERROR:
                return new DefaultFaultMetricEventBuilder();
            default:
                // will not happen
                return null;
        }
    }
}
