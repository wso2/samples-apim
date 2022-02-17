This sample is for API-M 4.0.0

This sample will write analytics event details to a log. 

Build the project using Maven:

        mvn clean install


Copy the generated JAR file from the target folder and place it in wso2am-4.0.0/repository/components/lib.

Edit apim.analytics configurations in the deployment.toml located inside wso2am-4.0.0/repository/conf with the 
following configuration.

        [apim.analytics]
        enable = true
        properties."publisher.reporter.class" = "org.wso2.am.analytics.publisher.sample.reporter.CustomReporter"
        logger.reporter.level = "INFO"


To enable logging for reporter, edit log4j2.properties file located inside wso2am-4.0.0/repository/conf 

Add reporter to the loggers list

        loggers = reporter, ...(list of other available loggers)


Add bellow configurations after the loggers

        logger.reporter.name = org.wso2.am.analytics.publisher.sample.reporter
        logger.reporter.level = INFO


Once this is successfully deployed a sample log will look like bellow,

        INFO - LogCounterMetric apimMetrics: apim:response, properties :{"apiName":"PizzaShackAPI",
        "proxyResponseCode":200,"destination":"https://localhost:9443/am/sample/pizzashack/v1/api/",
        "apiCreatorTenantDomain":"carbon.super","platform":"Linux","apiMethod":"GET","apiVersion":"1.0.0",
        "gatewayType":"SYNAPSE","apiCreator":"admin","responseCacheHit":false,"backendLatency":335,
        "correlationId":"70a30874-1e19-41e2-ad44-0ec1957fc740","requestMediationLatency":55,"keyType":"PRODUCTION",
        "apiId":"dd4423d0-769a-4515-8b5e-8994daaad3ff","applicationName":"internal-key-app","targetResponseCode":200,
        "requestTimestamp":"2022-02-17T09:47:48.913Z","applicationOwner":"internal-key-app","userAgent":"Chrome",
        "eventType":"response","apiResourceTemplate":"/menu","responseLatency":392,"regionId":"default",
        "responseMediationLatency":2,"userIp":"127.0.0.1","applicationId":"118fd1a4-73aa-3969-8c72-4f5cc06b1b0a",
        "apiType":"HTTP"}



