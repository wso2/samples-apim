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

        INFO - LogCounterMetric Metric Name: apim:response Metric Value: {apiName=PizzaShackAPI, proxyResponseCode=200, 
        errorType=null, destination=https://localhost:9443/am/sample/pizzashack/v1/api/, 
        apiCreatorTenantDomain=carbon.super, platform=Linux, apiMethod=GET, apiVersion=1.0.0, gatewayType=SYNAPSE, 
        apiCreator=admin, responseCacheHit=false, backendLatency=700, 
        correlationId=f2566443-04f9-4865-9612-40a4d8bd6318, requestMediationLatency=102, keyType=PRODUCTION, 
        apiId=3076a598-65f0-4b8e-a36e-50ecd797aa1b, applicationName=internal-key-app, targetResponseCode=200, 
        requestTimestamp=2021-07-13T09:23:35.311Z, applicationOwner=internal-key-app, userAgent=Chrome, 
        eventType=response, apiResourceTemplate=/menu, responseLatency=804, regionId=default, 
        responseMediationLatency=2, userIp=127.0.0.1, applicationId=118fd1a4-73aa-3969-8c72-4f5cc06b1b0a, apiType=HTTP}



