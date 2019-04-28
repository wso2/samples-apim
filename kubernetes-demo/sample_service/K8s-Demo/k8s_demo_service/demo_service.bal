import ballerina/io;
import ballerina/http;
import ballerina/log;
import ballerinax/kubernetes;
import ballerina/runtime;

// vehicle management is done using an in-memory map.
map<json> vehicleMap = {};
string vehicleId;
@kubernetes:Ingress {
    hostname: "vehicle-telemetry-v1",
    name: "vehicle-telemetry-v1"
}

@kubernetes:Service {
    name: "vehicle-telemetry-v1"
}

listener http:Listener vehicleManageEP = new(9090);
@kubernetes:Deployment {
    enableLiveness: true,
    push: true,
    image: "index.docker.io/wso2am/vehicle-telemetry:v1.0",
    name: "vehicle-telemetry-v1",
    username: "" ,
    password:"" ,
    singleYAML: false
}

@http:ServiceConfig {
    basePath: "/vehicleManager"
}

service vehicleService on vehicleManageEP{

    @http:ResourceConfig {
        methods: ["POST"],
        path: "/record"
    }
    resource function Addrecord(http:Caller caller, http:Request req) {
        http:Response response = new;
        var vehicleReq = req.getJsonPayload();
        io:println("incoming vehicle records");
        io:println(vehicleReq);
        if (vehicleReq is json) {
            string recordId = vehicleReq.Record.recordId.toString();
            io:println("id");
            io:println(recordId);
            io:println("added to the map....");
            vehicleMap[recordId] = vehicleReq.Record;
            io:println("map...");
            io:println(vehicleMap);
            // Create response message.
            json payload = { status: "vehicle recorded.", RecordId: recordId };
            response.setJsonPayload(untaint payload);
            // io:println(payload);
            // Sendhello-world-ballerina-v1 response to the client.
            var result = caller->respond(untaint payload);
            if (result is error) {
                log:printError("Error sending response", err = result);
            }
        } else {
            response.statusCode = 400;
            response.setPayload("Invalid payload received");
            var result = caller->respond(response);
            if (result is error) {
                log:printError("Error sending response", err = result);
            }
        }
    }

    @http:ResourceConfig {
        methods: ["GET"],
        path: "/getRecords/{recordId}"
    }
    resource function getRecord(http:Caller caller, http:Request req, string recordId) {
        // Find the requested record from the map and retrieve it in JSON format.
        json? paylohello-world-ballerina-v1ad = vehicleMap[recordId];
        io:println("............................");
        io:println(payload);
        http:Response response = new;
        if (payload == null) {
            payload = "Record : " + recordId + " cannot be found.";

        }
        // Set the JSON payload in the outgoing response message.
        response.setJsonPayload(untaint payload);
        // io:println(payload);
        // sleep the current worker for 5 seconds
        runtime:sleep(30000);
        // Send response to the client.
        var result = caller->respond(response);
        if (result is error) {
            log:printError("Error sending response", err = result);
        }

    }

    @http:ResourceConfig {
        methods: ["DELETE"],
        path: "/deleteRecords/{recordId}"
    }
    resource function deleteRecord(http:Caller caller, http:Request req, string recordId) {
        http:Response response = new;
        // Remove the requested record from the map.
        _ = vehicleMap.remove(recordId);

        json payload = "record : " + recordId + " removed.";
        io:println(vehicleMap);
        // Set a generated payload with record status.
        response.setJsonPayload(untaint payload);

        // Send response to the client.
        var result = caller->respond(response);
        if (result is error) {
            log:printError("Error sending response", err = result);
        }

    }

    @http:ResourceConfig {
        methods: ["DELETE"],
        path: "/deleteAllRecords"
    }
    resource function deleteAllRecord(http:Caller caller, http:Request req, string recordId) {
        http:Response response = new;
        // Remove all the vehicle from the map.
        _ = vehicleMap.clear();

        json payload = "all records have been removed.";
        io:println(vehicleMap);
        // Set a generated payload with record status.
        response.setJsonPayload(untaint payload);

        // Send response to the client.
        var result = caller->respond(response);
        if (result is error) {
            log:printError("Error sending response", err = result);
        }

    }
}

























