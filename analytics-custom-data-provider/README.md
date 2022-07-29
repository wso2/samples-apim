# Custom Data Provider for API-M 4.2.0

This sample will allow you to add custom analytics data to the existing event schema.

__Steps to add custom analytics data:__

Add the necessary component versions for `carbon.apimgt.version`, and `synapse.version` in pom file in the root directory.

Build the project using Maven:

        mvn clean install


Copy the generated JAR file from the target folder and place it in `<WSO2AM-4.2.0-HOME>/repository/components/lib`.

Edit apim.analytics configurations in the `deployment.toml` located inside `<WSO2AM-4.2.0-HOME>/repository/conf` with the
following configuration.

        [apim.analytics]
        enable = true
        properties."publisher.custom.data.provider.class" = "org.wso2.carbon.apimgt.gateway.sample.publisher.CustomDataProvider"



Once this is successfully deployed you can check whether this is working by following the below steps:
1. [Enable trace logs](https://apim.docs.wso2.com/en/4.2.0/administer/logging-and-monitoring/logging/configuring-logging/#enabling-logs-for-a-component) for the component: `org.wso2.am.analytics.publisher`
1. Follow this sample configurations,

        logger.org-wso2-analytics-publisher.name = org.wso2.am.analytics.publisher
        logger.org-wso2-analytics-publisher.level = TRACE
        logger.org-wso2-analytics-publisher.appenderRef.CARBON_TRACE_LOGFILE.ref = CARBON_TRACE_LOGFILE
   
1. Then append logger name to the `loggers`

        loggers = org-wso2-analytics-publisher, trace-messages, 
   
1. Now you can trigger an event and check the` <WSO2AM-4.2.0-HOME>/repository/logs/wso2carbon-trace-messages.log` to find the event object passed out from API Manager.

        TRACE {org.wso2.am.analytics.publisher.client.EventHubClient} - [{ Cloud-Analytics-Queue-Worker-pool-2-thread-1 }] - 
        Adding event: 
        {
           "apiName":"API1",
           "proxyResponseCode":200,
           "destination":"https://run.mocky.io/v3/d14fad1d-d57b-41bc-8be3-146b6aaddfaf",
           "apiCreatorTenantDomain":"carbon.super",
           "platform":"Linux",
           "apiMethod":"GET",
           "apiVersion":"2.0.0",
           "gatewayType":"SYNAPSE",
           "apiCreator":"admin",
           "responseCacheHit":false,
           "backendLatency":1866,
           "correlationId":"00a94b54-5579-4f5d-95c1-4bd909fd4c20",
           "requestMediationLatency":578,
           "keyType":"SANDBOX",
           "apiId":"fd5a22ee-144f-4fc1-9f22-ce5ff0382023",
           "applicationName":"AppUser",
           "targetResponseCode":200,
           "requestTimestamp":"2022-07-18T06:49:19Z",
           "applicationOwner":"admin",
           "userAgent":"Chrome",
           "eventType":"response",
           "apiResourceTemplate":"/test",
           "properties":{
                "tokenIssuer":"https://localhost:9443/oauth2/token",
                "apiContext":"/api1/2.0.0",
                "userName":"admin@carbon.super"
           },
           "responseLatency":2446,
           "regionId":"default",
           "responseMediationLatency":2,
           "userIp":"127.0.0.1",
           "applicationId":"5d6d0135-810a-4b4e-8f9a-45187e943fff",
           "apiType":"HTTP"
        }



