// Copyright (c) 2024, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 Inc. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein is strictly forbidden, unless permitted by WSO2 in accordance with
// the WSO2 Commercial License available at http://wso2.com/licenses.
// For specific language governing the permissions and limitations under
// this license, please see the license as well as any agreement you’ve
// entered into with WSO2 governing the purchase of this software and any
import ballerina/file;
import ballerina/http;
import ballerina/io;
import ballerina/lang.regexp;
import ballerina/test;
import wso2/ai.agent;

const string SPECIFICATIONS_DIRECTORY = "tests/resources/specifications";
const string PARSED_SPECIFICATIONS_DIRECTORY = "tests/resources/parsed_specifications";
const string EXTRACTED_SPECIFICATIONS_DIRECTORY = "tests/resources/extracted_specifications";

string serviceURL = "http://localhost:9090";
http:Client serviceClient = check new (serviceURL);

@test:Config {
    groups: ["logic"]
}
function parseOpenApiSpecTest() returns error? {
    file:MetaData[] directory = check file:readDir(SPECIFICATIONS_DIRECTORY);
    foreach file:MetaData file in directory {
        string filename = regexp:split(re `/`, file.absPath).pop();
        string parsedSpecPath = string `${PARSED_SPECIFICATIONS_DIRECTORY}/${filename}`;
        map<json> openApiSpec = check io:fileReadJson(file.absPath).ensureType();
        map<json> openApiSpecParsed = check io:fileReadJson(parsedSpecPath).ensureType();
        test:assertEquals(agent:parseOpenApiSpec(openApiSpec), openApiSpecParsed);
    }
}

@test:Config {
    groups: ["logic"]
}
function extractToolsFromOpenApiJsonSpecTest() returns error? {
    file:MetaData[] directory = check file:readDir(PARSED_SPECIFICATIONS_DIRECTORY);
    foreach file:MetaData file in directory {
        string filename = regexp:split(re `/`, file.absPath).pop();
        string extractedSpecPath = string `${EXTRACTED_SPECIFICATIONS_DIRECTORY}/${filename}`;
        map<json> openApiSpecParsed = check io:fileReadJson(file.absPath).ensureType();
        map<json> openApiSpecExtracted = check io:fileReadJson(extractedSpecPath).ensureType();
        test:assertEquals(agent:extractToolsFromOpenApiJsonSpec(openApiSpecParsed), openApiSpecExtracted);
    }
}

//to store execution and completion responses for each test case.
type TestResponse record {|
    COMPLETED|TERMINATED|ERROR terminationCause;
    TestExecutionResponse[] executionResponseList;
    string completionResponseResult?;
|};

const header = {
    "token": "token",
    "x-request-id": "123"
};

//to call the service and return the received responses according to the command.
function getTestResponse(string query, agent:HttpTool[] tools) returns TestResponse|ErrorInfo|error {

    TestExecutionResponse[] executionResponses = [];
    TestExecutionResponse|ErrorInfo executionResponse = check serviceClient->/execute.post(
        {
            command: query,
            apiSpec: {
                serviceUrl: "http://localhost:8080",
                tools
            }
        }, headers = header
    );

    if executionResponse is ErrorInfo {
        return executionResponse;
    }
    executionResponses.push(executionResponse);
    if executionResponse.result.output.path == "/" {
        return {
            terminationCause: ERROR,
            executionResponseList: executionResponses
        };
    }

    while true {
        TestExecutionResponse|TestCompletionResponse|ErrorInfo response = check serviceClient->/execute.post({
            tokenRefreshed: false
        }, headers = header);

        if response is ErrorInfo {
            return response;
        }
        if response is TestCompletionResponse {
            //break the loop when we get the completion response.
            return {
                terminationCause: COMPLETED,
                executionResponseList: executionResponses,
                completionResponseResult: response.result
            };
        }
        if response is TestExecutionResponse && response.result.output.path == "/" {
            executionResponses.push(response);
            return {
                terminationCause: ERROR,
                executionResponseList: executionResponses
            };
        }
        if response is TestExecutionResponse {
            if response.taskStatus == TERMINATED {
                executionResponses.push(response);
                //break the loop when we get the termination response.
                return {
                    terminationCause: TERMINATED,
                    executionResponseList: executionResponses
                };
            } else {
                executionResponses.push(response);
            }
        }
    }
}

//expected execution Response for validPayloadTest test case.
ExecutionResult getUserResult = {
    'resource: {
        method: "GET",
        path: "/user/{username}",
        inputs: {"parameters": {"username": "Bob_123"}}
    },
    output: {
        code: 200,
        path: "/user/Bob_123",
        headers: {contentType: "application/json"},
        body: [
            {
                "id": 1,
                "username": "Bob_123",
                "firstName": "Bob",
                "lastName": "Johnson",
                "email": "bob@gmail.com",
                "password": "XXXXXXXXXXX",
                "phone": "123-456-7890",
                "userStatus": 1
            }
        ]
    }
};

TestExecutionResponse expectedGetUserResponse = {
    taskStatus: IN_PROGRESS,
    result: getUserResult
};

//test case for the correct TestInitializationRequest and TestExecutionRequest.
@test:Config {
    groups: ["logic"]
}
function validPayloadTest() returns error? {

    isolated function mockPetstore = mockPetStore;
    lock {
        mockResource = mockPetstore;
    }

    TestResponse|ErrorInfo|error testResponse = getTestResponse("Get user with username Bob_123", petStoreTools);
    if testResponse is error {
        test:assertFail(msg = string `Error occurred while retrieving the response : ${testResponse.toString()}`);
    }

    if testResponse is ErrorInfo {
        test:assertFail(msg = string `Error message:${testResponse.message}`);
    }
    boolean isExpectedResponseReceived = false;
    if testResponse.executionResponseList[0] == expectedGetUserResponse {
        isExpectedResponseReceived = true;
    }
    test:assertTrue(isExpectedResponseReceived, msg = "The expected response is not included in the TestExecutionResponse list");
    test:assertEquals(testResponse.terminationCause, COMPLETED);
    test:assertEquals(testResponse.completionResponseResult, "The user with username \"Bob_123\" is Bob Johnson.");
}

//test case to test when there is an empty command.
@test:Config {
    groups: ["logic"]
}
function testEmptyCommand() returns error? {

    isolated function mockPetstore = mockPetStore;
    lock {
        mockResource = mockPetstore;
    }

    TestResponse|ErrorInfo|error response = getTestResponse("", petStoreTools);

    if response is TestResponse {
        test:assertFail(msg = "Cannot receive a TestResponse for an empty command.");
    }
    if response is ErrorInfo {
        test:assertFail(msg = "Cannot receive an ErrorInfo for an empty command.");
    }
    test:assertEquals(response.detail().toArray()[0], 500);
    test:assertEquals(response.detail().toArray()[2], {"level": "WARN", "message": "Invalid query is provided.", "code": "INVALID_COMMAND"});
}

//test when the payload has an invalid initialization request.
@test:Config {
    groups: ["logic"]
}
function testInvalidInitializationRequest() returns error? {
    isolated function mockPetstore = mockPetStore;
    lock {
        mockResource = mockPetstore;
    }

    TestExecutionResponse|ErrorInfo|http:ClientError response = serviceClient->/execute.post("invalidInitializationRequest", headers = header);

    if response is TestExecutionResponse {
        test:assertFail(msg = "cannot receive a TestExecutionResponse for an invalid initialization request.");
    }
    if response is ErrorInfo {
        test:assertFail(msg = "cannot receive an ErrorInfo for an invalid initialization request.");
    }
    test:assertEquals(response.detail().toArray()[0], 400);
    test:assertEquals(response.message(), "Bad Request");
}

//expected execution result for maxIterationTest test case.
ExecutionResult getPet = {
    'resource: {
        method: "GET",
        path: "/pet/getPet/{petId}",
        inputs: {"parameters": {"petId": 5}}
    },
    output: {
        code: 200,
        path: "/pet/getPet/5",
        headers: {contentType: "application/json"},
        body:
            {
            "id": 5,
            "name": "Fluffy",
            "category": {
                "id": 1,
                "name": "Domestic"
            },
            "photoUrls": [
                "https://example.com/fluffy.jpg"
            ],
            "tags": [
                {
                    "id": 101,
                    "name": "Cute"
                }
            ],
            "status": "available"
        }
    }
};

//test case to check when it reaches maximum iterations.
@test:Config {
    groups: ["logic"]
}
function maxIterationTest() returns error? {

    isolated function mockPetstore = mockPetStore;
    lock {
        mockResource = mockPetstore;
    }
    TestResponse|ErrorInfo|error testResponse = check getTestResponse("Get pet with ID 5", petStoreTools);

    if testResponse is error {
        test:assertFail(msg = "An error occurred while retrieving the response for maxIterationTest.");
    }

    if testResponse is ErrorInfo {
        test:assertFail(msg = string `Error message:${testResponse.message}`);
    }
    if testResponse.terminationCause == COMPLETED {
        test:assertFail(msg = "Cannot recieve a completion response for maxIterationTest");
    }
    TestExecutionResponse lastResponse = testResponse.executionResponseList.pop();
    test:assertEquals(testResponse.terminationCause, TERMINATED);
    test:assertEquals(lastResponse.result, getPet);
}

//test case to test when the LLM sends an invalid response.
@test:Config {
    groups: ["logic"]
}
function invalidLLMResponseTest() returns error? {

    isolated function mockPetstore = mockPetStore;
    lock {
        mockResource = mockPetstore;
    }
    TestResponse|ErrorInfo|error testResponse = getTestResponse("Delete pet 1", petStoreTools);

    if testResponse is TestResponse {
        test:assertFail(msg = "Cannot receive a TestResponse for an invalid LLM response.");
    }

    if testResponse is ErrorInfo {
        test:assertFail(msg = "Cannot receive an ErrorInfo for an invalid LLM response.");
    }
    test:assertEquals(testResponse.detail().toArray()[0], 500);
    test:assertEquals(testResponse.detail().toArray()[2], {"level": "ERROR", "message": "An error occurred during query execution. Try again.", "code": "LLM"});
}

//test case for to test when the initialization request has an invalid service url.
@test:Config {
    groups: ["logic"]
}
function emptyServiceUrlTest() returns error? {

    isolated function mockPetstore = mockPetStore;
    lock {
        mockResource = mockPetstore;
    }

    TestInitializationRequest initializationRequest = {
        command: "List available pets",
        apiSpec: {
            tools: petStoreTools
        }
    };

    TestExecutionResponse|ErrorInfo|error response = serviceClient->/execute.post(initializationRequest, headers = header);

    if response is TestExecutionResponse {
        test:assertFail(msg = "cannot receive a TestExecutionResponse for an empty service url.");
    }

    if response is ErrorInfo {
        test:assertFail(msg = "cannot receive an ErrorInfo for an empty service url.");
    }
    test:assertEquals(response.detail().toArray()[0], 500);
    test:assertEquals(response.detail().toArray()[2], {"level": "WARN", "message": "The specification could not be parsed. Ensure you are using a valid specification.", "code": "INVALID_SPECIFICATION"});
}

//expected executionResponse for invokeAllTest test case.
TestExecutionResponse[] expectedExecutionResponse = [{"taskStatus": "IN_PROGRESS", "result": {"resource": {"method": "GET", "path": "/books", "inputs": {}}, "output": {"code": 200, "path": "/books", "headers": {"contentType": "application/json"}, "body": {"value": ["The Lord of the Rings", "Harry Potter", "Brave New World"]}}}}, {"taskStatus": "IN_PROGRESS", "result": {"resource": {"method": "DELETE", "path": "/books/{id}", "inputs": {"parameters": {"id": "12345"}}}, "output": {"code": 200, "path": "/books/12345", "headers": {"contentType": "application/json"}, "body": {"value": "The book has been deleted successfully."}}}}];

//test case to test when the command is to invoke all resources.
@test:Config {
    groups: ["logic"]
}
function invokeAllTest() returns error? {

    isolated function readingList = mockReadingList;
    lock {
        mockResource = readingList;
    }
    agent:HttpTool[] tools = [
        {
            "name": "GET-books",
            "description": "Returns a list of all books.. This tool invokes a HTTP GET resource",
            "method": "GET",
            "path": "/books"
        },
        {
            "name": "DELETE-books_id",
            "description": "Deletes a book with the specified ID.. This tool invokes a HTTP DELETE resource",
            "method": "DELETE",
            "path": "/books/{id}",
            "parameters": {
                "id": {
                    "location": "path",
                    "description": "id of book to delete",
                    "required": true,
                    "schema": {
                        "type": "string"
                    }
                }
            }
        }
    ];

    TestResponse|ErrorInfo|error testResponse = getTestResponse("invoke all resources", tools);

    if testResponse is error {
        test:assertFail(msg = string `Error occurred while retrieving the response : ${testResponse.toString()}`);
    }

    if testResponse is ErrorInfo {
        test:assertFail(msg = string `Error message:${testResponse.message}`);
    }
    //all the expected responses in the expectedExecutionResponse should be received.
    if testResponse.terminationCause == COMPLETED {
        test:assertEquals(testResponse.completionResponseResult, "All 2 resources were invoked.", msg = "Incorrect completion response was received for invokeAllTest");
    } else {
        test:assertFail(msg = "Cannot recieve a completion response for invokeAllTest");
    }

    boolean isAllExpectedResponsesReceived = false;
    if testResponse.executionResponseList == expectedExecutionResponse {
        isAllExpectedResponsesReceived = true;
    }
    test:assertTrue(isAllExpectedResponsesReceived, msg = "All the expected responses were not received.");
}

//test case to test when there is a connection issue.
@test:Config {
    groups: ["logic"]
}
function llmConnectionErrorTest() returns error? {

    isolated function mockPetstore = mockPetStore;
    lock {
        mockResource = mockPetstore;
    }
    TestResponse|ErrorInfo|error testResponse = getTestResponse("Find all available pets", petStoreTools);

    if testResponse is error {
        test:assertFail(msg = string `Error occurred while retrieving the response : ${testResponse.toString()}`);
    }

    if testResponse is TestResponse {
        test:assertFail(msg = "Cannot receive a TestResponse for an invalid LLM response.");
    }
    test:assertEquals(testResponse.level, "WARN");
    test:assertEquals(testResponse.message, "There was an error connecting to Azure OpenAI.");
    test:assertEquals(testResponse.code, "LLM_CONNECTION");
}
