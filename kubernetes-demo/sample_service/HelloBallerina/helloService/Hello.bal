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

