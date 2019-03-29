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

json applicationListDetails;
json applicationKeyDetails;
string accessToken = " ";
string token = " ";
string applicationid = " ";
string productionToken = " ";
string clientId = " ";
string clientSecret = " ";
string AuthorizationToken = " ";
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

    // string clientSecret = ResourceclientSecret() ;
    token = ResourceAccessToken();
    applicationid = (untaint (ResourcegetApplicationId()));
    //ResourceRegenerateProductionKey();
    productionToken = (untaint (ResourceGetProductionKey()));
    //io:println(productionToken);
    AuthorizationToken = ("Bearer" + " " + productionToken);

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
    vehicleID = char1 + char2 + sperate + <string>randNumber1 + <string>randNumber2 + <string>randNumber3 + <string>
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
    io:println(AuthorizationToken);
    req.addHeader("Authorization", AuthorizationToken);
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
    req.addHeader("Authorization", AuthorizationToken);
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
            io:println("response is not a json");
            log:printError(<string>message.detail().message);
        }
    } else {
        io:println("it not a http res");
        log:printError(<string>resp.detail().message);
    }

}
// Function to DELETE resource 'detele a vehicle record '.
function resourceDeleteRecords() {
    http:Request req = new;
    req.addHeader("Authorization", AuthorizationToken);
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
        io:println("it not a http response");
        log:printError(<string>resp.detail().message);
    }

}
// Function to DELETE resource 'delete all the vehicle records '.
function resourceDeleteAllRecords() {
    http:Request req = new;
    req.addHeader("Authorization", AuthorizationToken);
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


function ResourceAccessToken() returns (string) {

    clientId = config:getAsString("clientId");
    clientSecret = config:getAsString("clientSecret");
    string encodeSecret = ((clientId + ":" + clientSecret));
    //encoding client id and  client secret
    string|error encodedSecret = mime:base64EncodeString(encodeSecret, charset = "utf-8");

    if (encodedSecret is string) {
        http:Request req = new;
        string base64_encoded_authorization_key = ("Basic" + " " + encodedSecret);
        req.addHeader("Authorization", base64_encoded_authorization_key);

        string v1 = "grant_type=password&username=admin&password=admin&scope=apim:subscribe";
        req.setTextPayload(v1);
        //uncoding to application/x-www-form-urlencoded
        req.setHeader("Content-Type", mime:APPLICATION_FORM_URLENCODED);

        var resp = clientEP2->post("/token", req);
        io:println("\nSending  records:");
        io:println(resp);
        if (resp is http:Response) {
            var message = resp.getJsonPayload();
            if (message is json) {
                token = (untaint (message["access_token"].toString()));
                io:println("access_token:" + token);
                return token;
            }
            else {
                io:println("Error,it not a json");
                io:println(message);
                log:printError(<string>message.detail().message);
                return "Error,message is not a json";
            }
        } else {
            io:println("encode secret is not a string");
            log:printError(<string>resp.detail().message);
            return "error,encode secret is not a string";
        }
    }
    else {
        return "Error ,it's not a http response";
    }
}




function ResourcegetApplicationId() returns (string) {

    http:Request req = new;
    accessToken = ("Bearer" + " " + token);


    req.addHeader("Authorization", accessToken);
    //io:println(accessToken) ;
    req.addHeader("Content-Type", "application/json");
    string applicatonName = config:getAsString("appName");
    var resp = clientEP3->get("/applications?query=" + applicatonName, message = req);

    io:println(resp);
    if (resp is http:Response) {
        var message = resp.getJsonPayload();
        if (message is json) {
            io:println("application details");
            applicationListDetails = (untaint (message["list"]));
            //io:println( applicationListDetails);
            json applicationList = (applicationListDetails[0]);
            string appId = (untaint (applicationList["applicationId"].toString()));
            io:println("app id:" + appId);
            //return (untaint(applicationList));
            return (untaint (appId));
        } else {
            io:println("it not a json");
            //log:printInfo(payload);
            log:printError(<string>message.detail().message);
            return (<string>message.detail().message);
        }
    } else {
        io:println("Error,it not a http res");
        log:printError(<string>resp.detail().message);
        return (<string>resp.detail().message);

    }
}

public function ResourceGetProductionKey() returns (string) {
    http:Request req = new;
    accessToken = ("Bearer" + " " + token);
    req.addHeader("Authorization", accessToken);
    //io:println(accessToken);
    req.addHeader("Content-Type", "application/json");

    var resp = clientEP3->get("/applications/" + applicationid + "/keys/PRODUCTION", message = req);

    io:println(resp);
    if (resp is http:Response) {

        //var payload = resp.getTextPayload();
        var message = resp.getJsonPayload();
        int statusCode = resp.statusCode;
        string reasonPhrase = resp.reasonPhrase;
        if (message is json) {

            applicationKeyDetails = (untaint (message["token"]));
            //  io:println(applicationKeyDetails);
            // json applicationList=(applicationListDetails[0]);
            string refreshToken = (untaint (applicationKeyDetails["accessToken"].toString()));
            io:println("refresh Token:" + refreshToken);
            return (untaint (refreshToken));

        } else {
            io:println("it not a json");
            //log:printInfo(payload);
            log:printError(<string>message.detail().message);
            return (<string>message.detail().message);

        }
    } else {
        io:println("it not a http res");
        log:printError(<string>resp.detail().message);
        return (<string>resp.detail().message);

    }
}

function ResourceRegenerateProductionKey() {
    http:Request req = new;
    accessToken = ("Bearer" + " " + token);
    req.addHeader("Authorization", accessToken);
    req.addHeader("Content-Type", "application/json");
    json v1 = {
        "validityTime": "-1",
        "keyType": "PRODUCTION",
        "accessAllowDomains": ["ALL"],
        "scopes": ["am_application_scope", "default"],
        "supportedGrantTypes": ["urn:ietf:params:oauth:grant-type:saml2-bearer", "iwa:ntlm", "refresh_token",
        "client_credentials", "password"]
    };

    io:println(v1);
    req.setJsonPayload(v1);


    var response = clientEP3->post("/applications/generate-keys?applicationId=" + applicationid, req);
    io:println("\nSending  records:");
    io:println(response);
    if (response is http:Response) {
        var msg = response.getJsonPayload();
        io:println(msg);
        if (msg is json) {

        }

        if (msg is string) {

            log:printInfo(msg);

        }

    }
    else {

        log:printError(<string>response.detail().message);
    }


}