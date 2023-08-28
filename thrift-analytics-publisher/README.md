# Thrift Data Publisher for API-M 4.2.0

This publishes API Analytics events from WSO2 APIM 4.2.0 to the following Thrift streams:
- Request Events: `org.wso2.apimgt.statistics.request:4.2.0`
- Fault Events: `org.wso2.apimgt.statistics.fault:4.2.0`
- Throttle Events: `org.wso2.apimgt.statistics.throttle:4.2.0`

See the topic **Thrift Stream Attributes** for the definition of the above Thrift streams.

**Note:** This requires the [Thrift Data Provider](../thrift-analytics-data-provider), which generates Thrift events in the appropriate format defined under **Thrift stream Attributes**.

## Building the Thrift Data Publisher
- Run `mvn clean install` from the directory where the `pom.xml` file is present. This will produce the file: `org.wso2.am.thrift.analytics.publisher-1.0.jar`.
- Copy the `org.wso2.am.thrift.analytics.publisher-1.0.jar` file to `<WSO2_APIM_4.2.0_HOME>/repository/components/lib`

## Configurations to Enable Thrift Reporting
Go to `<WSO2_APIM_4.2.0_HOME>/repository/conf/deployment.toml`, and provide the following configurations to enable Thrift analytics publishing:
> **Note:** In order to collect the response message size, the `thrift.data.provider.collect.response.message.size` property needs to be explicitly set to `true`, as shown below. The value of this property will be `false` by default.
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
properties."thrift.data.provider.collect.response.message.size" = true # Collect the response message size

# Optional
properties."thrift.data.publisher.event.queue.size" = 32768 # Size of the event queue 
properties."thrift.data.publisher.worker.thread.count" = 10 # No. of worker threads that will take events from the event queue
properties."thrift.data.publisher.pool.max.idle" = 250
properties."thrift.data.publisher.pool.init.idle.capacity" = 200
```

## Logger Configurations for the Thrift Data Publisher
Go to the `loggers` section of the `<WSO2_APIM_4.2.0_HOME>/repository/conf/log4j2.properties` file, and provide the following:

```
loggers = thrift-analytics-publisher, # ...rest of the loggers

logger.thrift-analytics-publisher.name = org.wso2.am.thrift.analytics.publisher
logger.thrift-analytics-publisher.level = INFO
```

## Thrift stream Attributes
### Request Events: `org.wso2.apimgt.statistics.request:4.2.0`
Attribute | Type | Description
-- | -- | --
meta_clientType | string | The meta information of client type.
applicationConsumerKey | string | The consumer key of the API invoked client application.
applicationName | string | The name of the client application.
applicationId | string | The ID of the client application.
applicationOwner | string | The name of the owner of the application.
apiContext | string | The API context depending on the user's request.
apiName | string | The API name.
apiVersion | string | The API version.
apiResourcePath | string | The API resource path of the API request.
apiResourceTemplate | string | The API resource URL pattern of the API request.
apiMethod | string | The HTTP verb of the API request [e.g.,GET/POST].
apiCreator | string | The creator of the API.
apiCreatorTenantDomain | string | The tenant domain of the API creator.
apiTier | string | The subscription tier associated with the API request.
apiHostname | string | The hostname or Datacenter ID (if specified).
username | string | The end-user of the API request.
userTenantDomain | string | The tenant domain of the user that is associated with the request.
userIp | string | The IP address of the client.
userAgent | string | The user agent of the user.
requestTimestamp | long | The timestamp of the API request when received at the Gateway.
throttledOut | bool | This describes whether the request was allowed after hitting the throttle tier.
responseTime | long | The timestamp of the API response when received at the Gateway.
serviceTime | long | The time that is taken to serve the API request at the API-M side.
backendTime | long | The time taken to process the request at the backend.
responseCacheHit | bool | This describes if response caching is enabled or not.
responseSize | long | The response message size in bytes.
protocol | string | The protocol used to send the response (HTTP/HTTPS) and the port.
responseCode | int | The HTTP response code.
destination | string | The URL of the endpoint.
securityLatency | long | The time taken for authentication.
throttlingLatency | long | The time taken for throttling the request/response.
requestMedLat | long | The time taken to mediate the request.
responseMedLat | long | The time taken to mediate the response.
backendLatency | long | The time taken by the backend to return the response.
otherLatency | long | The time taken to process tasks other than mentioned above.
gatewayType | string | The Gateway type (Synapse/Micro).
label | string | The label of the API (if specified).
properties | string | The JSON string with custom attributes (if specified).

### Fault Events: `org.wso2.apimgt.statistics.fault:4.2.0`
Attribute | Type | Description
-- | -- | --
meta_clientType | string | The meta information of client type.
applicationConsumerKey | string | The consumer key of the API invoked client application.
apiName | string | The API name.
apiVersion | string | The API version.
apiContext | string | The API context depending on the user's request.
apiResourcePath | string | The API resource path of the API request.
apiResourceTemplate | string | The API resource URL pattern of the API request.
apiMethod | string | The HTTP verb of API request [e.g.,GET/POST].
apiCreator | string | The creator of the API.
username | string | The end-user of the API request.
userTenantDomain | string | The tenant domain of the user that is associated with the request.
apiCreatorTenantDomain | string | The tenant domain of the API creator.
hostname | string | The hostname or datacenter ID (if specified).
applicationId | string | The ID of the client application.
applicationName | string | The name of the client application.
applicationOwner | string | The name of the owner of the application.
protocol | string | The protocol used to send the response (HTTP/HTTPS) and the port.
errorCode | string | The Synapse error code.
errorMessage | string | The description of the Synapse error message.
requestTimestamp | long | The timestamp of the API request when received at the Gateway.
properties | string | The JSON string with custom attributes (if specified).

### Throttle Events: `org.wso2.apimgt.statistics.throttle:4.2.0`
Attribute | Type | Description
-- | -- | --
meta_clientType | string | The meta information of client type.
username | string | The end-user of the API request.
userTenantDomain | string | The tenant domain of the user that is associated with the request.
apiName | string | The API name.
apiVersion | string | The APIversion.
apiContext | string | The API context depending on the user's request.
apiCreator | string | The creator of the API.
apiCreatorTenantDomain | string | The tenant domain of the API creator.
apiResourceTemplate | string | The API resource URL pattern of the API request.
apiMethod | string | The HTTP verb of API request [e.g.,GET/POST].
applicationId | string | The ID of the client application.
applicationName | string | The name of the client application.
subscriber | string | The name of the subscriber of the application.
throttledOutReason | string | The reason describing why the request has been throttled out.
gatewayType | string | The Gateway type (Synapse/Micro).
throttledOutTimestamp | long | The timestamp when the request is throttled out.
hostname | string | The hostname or datacenter ID (if specified).
properties | string | The JSON string with custom attributes (if specified).
