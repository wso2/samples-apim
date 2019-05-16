import ballerina/io;
import ballerina/http;
import ballerina/log;
import ballerina/config;
import ballerinax/kubernetes;

@kubernetes:Ingress {
    hostname:"kubernetes-hellov1",
    name:"kubernetes-hello-v1"

}

@kubernetes:Service {
    name:"kubernetes-hello-v1"

}

listener http:Listener helloKubernetesEP = new(9090);

@kubernetes:Deployment {
    enableLiveness:true,
    push:true,
    image:"index.docker.io/wso2am/kubernetes-hello:v1",
    name:"kubernetes-hello-v1",
    username:"",
    password:"",
    singleYAML: false

}

@http:ServiceConfig {
    basePath: "/kuberneteshello"
}

service hellokubernetes on helloKubernetesEP {

    @http:ResourceConfig {
        methods: ["GET"],
        path: "/"
    }
    resource function sayHello(http:Caller caller, http:Request req) {

        var result = caller->respond("Hello Kubernetes!!!");
        if (result is error) {
            log:printError("Error in responding ", err = result);
        }
    }
}
