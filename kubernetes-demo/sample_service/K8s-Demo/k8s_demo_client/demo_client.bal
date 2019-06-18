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
import ballerina/config;
import ballerina/math;
import ballerina/task;
import ballerina/runtime;
import ballerina/time;
import ballerina/log;
import ballerina/http;
import ballerina/mime;

int randSpeed = 0;
int randOil = 0;
int randMileage = 0;
int rand;
int count;
task:Timer? timer;
string currentDate = "";
string vehicleID = "";
string randLocation;
string currentTime = "";
int i = 1;

http:ClientEndpointConfig clientEPConfig = {
    secureSocket: {
        trustStore: {
            path: "/home/andrea/Desktop/K8s-Demo/k8s_demo_client/ballerinaTruststore.p12",
            password: "ballerina"
        },
        verifyHostname: false
    }
};
http:Client clientEP = new("https://wso2apim-gateway/vehicleManager/1.0.0",
    config = clientEPConfig);
http:Client clientEP1 = new("https://wso2apim/client-registration/v0.14",
    config = clientEPConfig);
http:Client clientEP2 = new("https://wso2apim-gateway",
    config = clientEPConfig);
http:Client clientEP3 = new("https://wso2apim/api/am/store/v0.14",
    config = clientEPConfig);

public function main() {

    randomVehicleId();
    randomLocation();

    //interval for 5 secs
    scheduleTimer(0, config:getAsInt("interval"));
    //sleep after 10 minutes
    runtime:sleep(config:getAsInt("sleep"));
}

//function to generate random vehicleId
function randomVehicleId() {
    string[] b = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t",
    "u", "w", "x", "y", "z"];
    int randNumber5 = math:randomInRange(0, 25);
    int randNumber6 = math:randomInRange(0, 25);
    string char1 = b[randNumber5];
    string char2 = b[randNumber6];
    string sperate = "-";
    int randNumber1 = math:randomInRange(0, 10);
    int randNumber2 = math:randomInRange(0, 10);
    int randNumber3 = math:randomInRange(0, 10);
    int randNumber4 = math:randomInRange(0, 10);
    vehicleID = char1andreanimi + char2 + sperate + <string>randNumber1 + <string>randNumber2 + <string>randNumber3 + <string>
                    randNumber4;
    log:printInfo("vehicle id :" + vehicleID);
}

//function to generate random Location
function randomLocation() {
    string sperate = "-";
    int randNumber1 = math:randomInRange(0, 10);
    int randNumber2 = math:randomInRange(0, 10);
    int randNumber3 = math:randomInRange(0, 10);
    int randNumber4 = math:randomInRange(0, 10);
    randLocation = "Location" + sperate + <string>randNumber1 + <string>randNumber2 + <string>randNumber3 + <string>
                    randNumber4;
    log:printInfo("location  :" + randLocation);
}

function scheduleTimer(int delay, int interval) {
    // Point to the trigger function.
    (function () returns error?) onTriggerFunction = onTrigger;
    // Point to the error function.
    (function (error)) onErrorFunction = onError;
    // Register a task with given ‘onTrigger’ and ‘onError’ functions, and with given ‘delay’ and ‘interval’ times.
    timer = new task:Timer(onTriggerFunction, onErrorFunction, interval, delay = delay);
    // Start the timer.
    timer.start();
}

// Define the ‘onError’ function for the task timer.
function onError(error e) {
    io:print("[ERROR] failed to execute timed task");
    io:println(e);

}

function onTrigger() returns error? {

    time:Time time = time:currentTime();
    currentDate = time.format("yyyy-MM-dd");
    currentTime = time.format("HH:mm:ss");
    log:printInfo("Current date: " + currentDate);
    log:printInfo("Current time: " + currentTime);
    //generating a random speed for the range given
    randSpeed = math:randomInRange(config:getAsInt("speedRangeMin"), config:getAsInt("speedRangeMax"));
    log:printInfo("current Vehicle speed :" + randSpeed);
    //generating a oil level for the range given
    randOil = math:randomInRange(config:getAsInt("oilrangeMin"), config:getAsInt("oilrangeMax"));
    log:printInfo("current Vehicle oil level :" + randOil);
    randMileage = math:randomInRange(config:getAsInt("mileageMin"), config:getAsInt("mileageMax"));
    log:printInfo("current Vehicle mileage :" + randMileage);
    randomLocation();
    resourceRecord();
    resourceGetRecords();
    // resourceDeleteRecords();
    //resourceDeleteAllRecords();

    return ();
}

// Function to POST resource 'record vehicle details'.
function resourceRecord() {

    http:Request req = new;
    req.addHeader("Authorization", config:getAsString("AuthorizationToken"));
    req.addHeader("Content-Type", "application/json");
    json v1 = { "Record": { "recordId": i, "Vehicleid": vehicleID, "Time": currentTime, "Date": currentDate, "Speed":
    randSpeed, "Mileage": randMileage, "Oil Level": randOil } };
    i += 1;
    io:println(v1);
    req.setJsonPayload(v1);
    var response = clientEP->post("/record", req);
    io:println("\nSending  records:");
    io:println(response);
    if (response is http:Response) {
        var msg = response.getJsonPayload();
        io:println(msg);
        if (msg is string) {

            log:printInfo(msg);
        }
    }
    else {

        log:printError(<string>response.detail().message);
    }
}

// Function to GET resource 'get record vehicle details'.
function resourceGetRecords() {
    http:Request req = new;
    req.addHeader("Authorization", config:getAsString("AuthorizationToken"));
    req.addHeader("Content-Type", "application/json");
    io:println(i);

    var resp = clientEP->get("/getRecords/" + (i - 1), message = req);
    io:println(resp);
    if (resp is http:Response) {

        var message = resp.getJsonPayload();

        if (message is json) {
            io:println("vehicle details");
            io:println(message);

        } else {
            io:println("it not a json");
            log:printError(<string>message.detail().message);
        }
    } else {
        io:println("it's not a http res");
        log:printError(<string>resp.detail().message);
    }
}

// Function to DELETE resource 'detele a vehicle record '.
function resourceDeleteRecords() {
    http:Request req = new;
    req.addHeader("Authorization", config:getAsString("AuthorizationToken"));
    req.addHeader("Content-Type", "application/json");

    var resp = clientEP->delete("/deleteRecords/" + (i - 1), req);
    io:println(resp);
    if (resp is http:Response) {
        var message = resp.getJsonPayload();

        if (message is json) {
            io:println(message);
        } else {
            io:println("response is not a json");
            log:printError(<string>message.detail().message);
        }
    } else {
        io:println("it's not a http response");
        log:printError(<string>resp.detail().message);
    }

}

// Function to DELETE resource 'delete all the vehicle records '.
function resourceDeleteAllRecords() {
    http:Request req = new;
    req.addHeader("Authorization", config:getAsString("AuthorizationToken"));
    req.addHeader("Content-Type", "application/json");

    var resp = clientEP->delete("/deleteAllRecords", req);
    io:println(resp);
    if (resp is http:Response) {
        var message = resp.getJsonPayload();

        if (message is json) {

            io:println(message);

        } else {
            io:println("response is not a json");
            log:printError(<string>message.detail().message);
        }
    } else {
        io:println("it's not a http response");
        log:printError(<string>resp.detail().message);
    }

}





