# Custom Data Provider for API Manager

This sample will allow you to add custom analytics data to the existing event schema.

__Steps to add custom analytics data:__

Add the necessary component versions for `carbon.apimgt.version`, and `synapse.version` in pom file in the root directory.

> **Optional:**  
> <ins>If you do not have access to the Nexus repository</ins>, prepare the necessary component versions for  
> `carbon.apimgt.gateway.version`, `synapse.version`, and `carbon.apimgt.common.analytics.version`  
> to include in the `pom.xml` file in the root directory as follows:  
> <br>  
>  
> Add the required artifacts to the local Maven (`.m2`) repository and configure it as a repository in the `pom.xml` file.  
>  
> - Locate the `org.wso2.carbon.apimgt.gateway` and `org.wso2.carbon.apimgt.common.analytics` JAR files inside the `<APIM_HOME>/repository/components/plugins` directory of the latest U2 updated APIM pack.  
> - Manually install the JAR files to the local Maven repository using the following commands:  
>  
> ```
> mvn install:install-file -Dfile=<PATH_TO_FILE>/org.wso2.carbon.apimgt.gateway_<COMPONENT_VERSION>.jar -DgroupId=org.wso2.carbon.apimgt -DartifactId=org.wso2.carbon.apimgt.gateway -Dversion=<COMPONENT_VERSION> -Dpackaging=jar
>  
> mvn install:install-file -Dfile=<PATH_TO_FILE>/org.wso2.carbon.apimgt.common.analytics_<COMPONENT_VERSION>.jar -DgroupId=org.wso2.carbon.apimgt -DartifactId=org.wso2.carbon.apimgt.common.analytics -Dversion=<COMPONENT_VERSION> -Dpackaging=jar
> ```  
>  
> - Configure the local Maven repository in your project’s `pom.xml` by adding:  
>  
> ```
> <repository>
>     <id>local-maven-repo</id>
>     <url>file://home/user/.m2/repository</url>
> </repository>
> ```  
>  
> Follow the URL pattern exactly when specifying the repository URL.


Build the project using Maven:

        mvn clean install


Copy the generated JAR file from the target folder and place it in `<WSO2AM-HOME>/repository/components/lib`.

Edit apim.analytics configurations in the `deployment.toml` located inside `<WSO2AM-HOME>/repository/conf` with the
following configuration.

        [apim.analytics]
        enable = true
        type = "elk"
        properties."publisher.custom.data.provider.class" = "org.wso2.carbon.apimgt.gateway.sample.publisher.CustomDataProvider"



Once this is successfully deployed you can check whether this is working by following the below steps:
1. [Enable trace logs](https://apim.docs.wso2.com/en/latest/administer/logging-and-monitoring/logging/configuring-logging/#enabling-logs-for-a-component) for the component: `org.wso2.am.analytics.publisher`
1. Follow this sample configurations,

        logger.org-wso2-analytics-publisher.name = org.wso2.am.analytics.publisher
        logger.org-wso2-analytics-publisher.level = TRACE
        logger.org-wso2-analytics-publisher.appenderRef.CARBON_TRACE_LOGFILE.ref = CARBON_TRACE_LOGFILE
   
1. Then append logger name to the `loggers`

        loggers = org-wso2-analytics-publisher, trace-messages, 
   
1. Now you can trigger an event and check the` <WSO2AM-HOME>/repository/logs/wso2carbon-trace-messages.log` to find the event object passed out from API Manager.

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



