

## APIM Configuration

1. Build workflow-executor and add to repository/component/lib folder
2. Add below to workflow extension

```
    <UserSignUp executor="com.sample.workflowexecutor.ActivitiUserSignupWorkflow">
        <Property name="serviceEndpoint">http://20.235.134.224:8080/activiti-rest/service</Property>
        <Property name="username">kermit</Property>
        <Property name="password">kermit</Property>
    </UserSignUp>
```

## Activiti Configuration

### Setup database

use mysql 5.7 db and create a database `activitidb`

Deploy activiti wars https://github.com/chamilaadhi/upload/releases/download/1/activiti5.zip in tomcat (tested in tomcat 9)

configure db in both webapp in `/WEB-INF/classes/db.properties`

```
db=mysql
jdbc.driver=com.mysql.jdbc.Driver
jdbc.url=jdbc:mysql://localhost:3306/activitidb?characterEncoding=UTF-8&useSSL=false
jdbc.username=
jdbc.password=
```

Add mysql jdbc drivers to lib folders in both applications

add following jars to activit-explorer lib

https://repo1.maven.org/maven2/com/googlecode/json-simple/json-simple/1.1.1/json-simple-1.1.1.jar
https://repo1.maven.org/maven2/org/apache/httpcomponents/httpcore/4.4.12/httpcore-4.4.12.jar 
https://repo1.maven.org/maven2/org/apache/httpcomponents/httpclient/4.5.10/httpclient-4.5.10.jar

Jar from activiti-sample project


login to /activiti-explorer using kermit:kermit and create manager and submanager groups and assing users
 upload bpmn file
