// Copyright (c) 2019, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
//
// WSO2 Inc. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations

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
