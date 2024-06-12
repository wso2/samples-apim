# Thrift Data Provider for API-M 4.2.0

This extracts and populates necessary attributes of API Analytics events from WSO2 APIM 4.2.0, as required by the [Thrift Data Publisher](../thrift-analytics-publisher).

In order to collect the response message size, the `build_response_message` property needs to be explicitly set to `true`, as shown below. The value of this property will be `false` by default.

```toml
[apim.analytics]
enable = true
properties."publisher.custom.data.provider.class" = "org.wso2.am.thrift.analytics.data.provider.ThriftAnalyticsDataProvider"
properties."publisher.reporter.class" = "org.wso2.am.thrift.analytics.publisher.ThriftMetricReporter"
properties."thrift.endpoint.agent.type" = "THRIFT"
properties."thrift.endpoint.receiver.url.set" = "tcp://0.0.0.0:7612" # Point this to a Thrift server
properties."thrift.endpoint.auth.url.set" = "ssl://0.0.0.0:7712" # Point this to a Thrift Server
properties."thrift.endpoint.username" = "admin"
properties."thrift.endpoint.password" = "admin"
properties.build_response_message = true # Enable this to collect the response message size
```

## Building the Thrift Data Provider
- Run `mvn clean install` from the directory where the `pom.xml` file is present. This will produce the file: `org.wso2.am.thrift.analytics.data.provider-1.0.jar`.
- Copy the `org.wso2.am.thrift.analytics.data.provider-1.0.jar` file to `<WSO2_APIM_4.2.0_HOME>/repository/components/lib`

## Configurations to Enable Thrift Reporting
Go to `<WSO2_APIM_4.2.0_HOME>/repository/conf/deployment.toml`, and provide the following configurations to enable Thrift analytics publishing:
```toml
[apim.analytics]
enable = true
properties."publisher.custom.data.provider.class" = "org.wso2.am.thrift.analytics.data.provider.ThriftAnalyticsDataProvider"
properties."publisher.reporter.class" = "org.wso2.am.thrift.analytics.publisher.ThriftMetricReporter"
properties."thrift.endpoint.agent.type" = "THRIFT"
properties."thrift.endpoint.receiver.url.set" = "tcp://0.0.0.0:7612" # Point this to a Thrift server
properties."thrift.endpoint.auth.url.set" = "ssl://0.0.0.0:7712" # Point this to a Thrift Server
properties."thrift.endpoint.username" = "admin"
properties."thrift.endpoint.password" = "admin"

# Optional
properties."thrift.data.publisher.event.queue.size" = 32768 # Size of the event queue 
properties."thrift.data.publisher.worker.thread.count" = 10 # No. of worker threads that will take events from the event queue
properties."thrift.data.publisher.pool.max.idle" = 250
properties."thrift.data.publisher.pool.init.idle.capacity" = 200
```

## Logger Configurations for the Thrift Data Provider
Go to the `loggers` section of the `<WSO2_APIM_4.2.0_HOME>/repository/conf/log4j2.properties` file, and provide the following:

```
loggers = thrift-analytics-data-provider, # ...rest of the loggers

logger.thrift-analytics-data-provider.name = org.wso2.am.thrift.analytics.data.provider
logger.thrift-analytics-data-provider.level = INFO
```
