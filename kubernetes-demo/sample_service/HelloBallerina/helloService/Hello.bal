import ballerina/io;
import ballerina/http;
import ballerina/log;
import ballerina/config;
import ballerinax/kubernetes;

@kubernetes:Ingress {
    hostname:"hello-world-ballerina-v1",
    name:"hello-world-ballerina-v1"

}

@kubernetes:Service {
    name:"hello-world-ballerina-v1"

}

listener http:Listener helloBallerinaEP = new(9091);

@kubernetes:Deployment {
    enableLiveness:true,
    push:true,
    image:"index.docker.io/wso2am/hello-world-ballerina:v1",
    name:"hello-world-ballerina-v1",
    username:config:getAsString("DOCKERHUB_USERNAME"),
    password:config:getAsString("DOCKERHUB_PASSWORD"),
    singleYAML: false

}

@http:ServiceConfig {
    basePath: "/hello"
}

service helloWorld on helloBallerinaEP {

    @http:ResourceConfig {
        methods: ["GET"],
        path: "/"
    }
    resource function sayHello(http:Caller caller, http:Request req) {

        var result = caller->respond("Hello World Ballerina!!!");
        if (result is error) {
            log:printError("Error in responding ", err = result);
        }
    }
}

