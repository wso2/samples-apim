This sample is for API-M 4.0.0

This sample will write event details to a log. 

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



