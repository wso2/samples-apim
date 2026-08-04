// Copyright (c) 2024, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 Inc. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein is strictly forbidden, unless permitted by WSO2 in accordance with
// the WSO2 Commercial License available at http://wso2.com/licenses.
// For specific language governing the permissions and limitations under
// this license, please see the license as well as any agreement you’ve
// entered into with WSO2 governing the purchase of this software and any
import ballerina/http;
import ballerina/test;
import ballerinax/azure.openai.chat as azure_chat;
import wso2/ai.agent;

configurable boolean isAccuracyTest = false;

//Defines an HTTP input record.
public type HttpInput record {|
    string path;
    map<json> parameters?;
    map<json> requestBody?;
|};

//to store the cached data for each iteration
isolated CacheRecord mockCachedRecord = {

    iteration: 0,
    command: "",
    apiSpec: {
        serviceUrl: "",
        tools: []
    },
    executionHistory: [
        {
            llmResponse: {
                "name": "",
                "arguments": "{}"
            },
            observation: {
                code: 0,
                path: "",
                headers: {contentType: "application/json"},
                body: {}
            }
        }
    ]
};

//to store the the mock service
isolated function mockResource = mockPetStore;

public isolated function mockPetStore(HttpInput httpInput) returns agent:HttpOutput|error {

    match httpInput.path {
        "/pet/{petId}" => {
            json parameterValue = httpInput.parameters.toJson();
            json deletePet = {
                "value": "Pet deleted successfully"
            };
            return {
                code: 200,
                path: "/pet/".concat((check parameterValue.petId).toString()),
                headers: {
                    contentType: "application/json"
                },
                body: deletePet
            };

        }
        "/pet/getPet/{petId}" => {
            json parameterValue = httpInput.parameters.toJson();

            json petDetails = {
                "id": check parameterValue.petId,
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
            };

            return {
                code: 200,
                path: "/pet/getPet/".concat((check parameterValue.petId).toString()),
                headers: {
                    contentType: "application/json"
                },
                body: petDetails
            };
        }
        "/user/{username}" => {
            json parameterValue = httpInput.parameters.toJson();

            json userDetails = {
                "id": 1,
                "username": check parameterValue.username,
                "firstName": "Bob",
                "lastName": "Johnson",
                "email": "bob@gmail.com",
                "password": "XXXXXXXXXXX",
                "phone": "123-456-7890",
                "userStatus": 1
            };

            return {
                code: 200,
                path: "/user/".concat((check parameterValue.username).toString()),
                headers: {
                    contentType: "application/json"
                },
                body: [userDetails]
            };
        }
        "/pet/findByStatus" => {
            json parameterValue = httpInput.parameters.toJson();

            json petList = [
                {
                    "id": 224,
                    "category": {
                        "id": 1,
                        "name": "Dogs"
                    },
                    "name": "Scooby",
                    "photoUrls": [
                        "url1",
                        "url2"
                    ],
                    "status": check parameterValue.status
                },
                {
                    "id": 336,
                    "category": {
                        "id": 1,
                        "name": "Lion"
                    },
                    "name": "Leo",
                    "photoUrls": [
                        "url1",
                        "url2"
                    ],
                    "status": check parameterValue.status
                }
            ];

            return {
                code: 200,
                path: "/pet/findByStatus?status=".concat((check parameterValue.status).toString()),
                headers: {
                    contentType: "application/json"
                },
                body: petList
            };
        }
        "/store/inventory" => {
            json inventory = {
                "approved": 55,
                "placed": 100,
                "delivered": 50
            };

            return {
                code: 200,
                path: "/store/inventory",
                headers: {
                    contentType: "application/json"
                },
                body: inventory
            };

        }
        "/store/order" => {
            json inputData = httpInput.get("requestBody").toJson();
            json responseBody = {

                "id": check inputData.id,
                "petId": check inputData.petId,
                "quantity": check inputData.quantity,
                "shipDate": check inputData.shipDate,
                "status": check inputData.status,
                "complete": check inputData.complete
            };

            return {
                code: 200,
                path: "/store/order",
                headers: {
                    contentType: "application/json"
                },
                body: responseBody
            };

        }
        "/pet" => {
            json inputData = httpInput.get("requestBody").toJson();
            json responseBody = {
                "id": check inputData.id,
                "name": check inputData.name,
                "category": {
                    "id": check inputData.category.id,
                    "name": check inputData.category.name
                },
                "photoUrls": check inputData.photoUrls,
                "tags": check inputData.tags,
                "status": check inputData.status
            };

            return {
                code: 200,
                path: "/pet",
                headers: {
                    contentType: "application/json"
                },
                body: responseBody
            };

        }
        _ => {
            return {
                code: 200,
                path: "/",
                headers: {
                    contentType: "application/json"
                },
                body: ""
            };
        }
    }
}

public isolated function mockReadingList(HttpInput httpInput) returns agent:HttpOutput|error {
    match httpInput.path {
        "/books" => {
            json bookList = {
                "value": [
                    "The Lord of the Rings",
                    "Harry Potter",
                    "Brave New World"
                ]
            };
            return {
                code: 200,
                path: "/books",
                headers: {
                    contentType: "application/json"
                },
                body: bookList
            };
        }
        "/books/{id}" => {
            json parameterValue = httpInput.parameters.toJson();
            json deleteBook = {
                "value": "The book has been deleted successfully."
            };
            return {
                code: 200,
                path: "/books/".concat((check parameterValue.id).toString()),
                headers: {
                    contentType: "application/json"
                },
                body: deleteBook
            };
        }
        _ => {
            return {
                code: 200,
                path: "/",
                headers: {
                    contentType: "application/json"
                },
                body: ""
            };
        }
    }
}

public isolated function mockBookService(HttpInput httpInput) returns agent:HttpOutput|error {

    match httpInput.path {
        "/books" => {
            json[] bookList = [
                {
                    "bookId": 346,
                    "book": {
                        "title": "Harry Potter and the Sorcerer's Stone",
                        "author": {
                            "name": "Joanne Rowling",
                            "nationality": "British"
                        },
                        "year": "2003",
                        "isbn": "123456789"
                    }
                },
                {
                    "bookId": 200,
                    "book": {
                        "title": "The Da Vinci Code",
                        "author": {
                            "name": "Dan Brown",
                            "nationality": ""
                        },
                        "year": "1998",
                        "isbn": "23342"
                    }
                }
            ];
            return {
                code: 200,
                path: "/books",
                headers: {
                    contentType: "application/json"
                },
                body: bookList
            };

        }
        "/countBooks" => {
            json bookcount = {
                "value": 20
            };
            return {
                code: 200,
                path: "/countBooks",
                headers: {
                    contentType: "application/json"
                },
                body: bookcount
            };
        }
        "/booksByAuthor" => {
            json parameterValue = httpInput.parameters.toJson();
            json[] bookList = [
                {
                    "bookId": 101,
                    "Book": "Harry Potter and the Sorcerer's Stone",
                    "Author": "Joanne Rowling"
                }
            ];
            return {
                code: 200,
                path: "/booksByAuthor?authorName=".concat((check parameterValue.authorName).toString()),
                headers: {
                    contentType: "application/json"
                },
                body: bookList
            };

        }
        "/hasBook" => {
            json parameterValue = httpInput.parameters.toJson();
            if parameterValue.bookTitle == "The Da Vinci Code" {
                return {
                    code: 200,
                    path: "/hasBook?bookTitle=".concat((check parameterValue.bookTitle).toString()),
                    headers: {
                        contentType: "application/json"
                    },
                    body: {
                        "value": "book is available"
                    }
                };

            } else {
                return {
                    code: 200,
                    path: "/hasBook?bookTitle=".concat((check parameterValue.bookTitle).toString()),
                    headers: {
                        contentType: "application/json"
                    },
                    body: {
                        "value": "book is not available"
                    }
                };
            }
        }
        "/book/updateBook" => {
            json parameterValue = httpInput.parameters.toJson();
            json inputData = httpInput.get("requestBody").toJson();
            json responseBody = {
                "title": check inputData.title,
                "author": {
                    "name": check inputData.author.name,
                    "nationality": check inputData.author.nationality
                },
                "year": check inputData.year,
                "isbn": check inputData.isbn
            };
            return {
                code: 200,
                path: "/book/updateBook?bookId=".concat((check parameterValue.bookId).toString()),
                headers: {
                    contentType: "application/json"
                },
                body: responseBody
            };

        }
        "/book" => {
            json inputData = httpInput.get("requestBody").toJson();
            json responseBody = {

                "title": check inputData.title,
                "author": {
                    "name": check inputData.author.name,
                    "nationality": check inputData.author.nationality
                },
                "year": check inputData.year,
                "isbn": check inputData.isbn
            };
            return {
                code: 200,
                path: "/book",
                headers: {
                    contentType: "application/json"
                },
                body: responseBody
            };

        }
        "/booksByYear" => {
            json parameterValue = httpInput.parameters.toJson();
            return {
                code: 200,
                path: "/booksByYear?year=".concat((check parameterValue.year).toString()),
                headers: {
                    contentType: "application/json"
                },
                body: {
                    "bookId": 346,
                    "book": {
                        "title": "Harry Potter and the Sorcerer's Stone",
                        "author": {
                            "name": "Joanne Rowling",
                            "nationality": "British"
                        },
                        "year": "2003",
                        "isbn": "123456789"
                    }
                }
            };

        }
        "/book/delete" => {
            json parameterValue = httpInput.parameters.toJson();

            return {
                code: 200,
                path: "/book/delete?bookId=".concat((check parameterValue.bookId).toString()),
                headers: {
                    contentType: "application/json"
                },
                body: {
                    "value": "Book deleted successfully"
                }
            };

        }
        "/book/id" => {
            json parameterValue = httpInput.parameters.toJson();

            return {
                code: 200,
                path: "/book/id?bookId=".concat((check parameterValue.bookId).toString()),
                headers: {
                    contentType: "application/json"
                },
                body: {
                    "bookId": 346,
                    "Title": "Harry Potter and the Sorcerer's Stone",
                    "author": {
                        "name": "Joanne Rowling",
                        "nationality": "British"
                    },
                    "year": 2003,
                    "isbn": "978-3-16-148410-0"

                }
            };

        }
        _ => {
            return {
                code: 200,
                path: "/",
                headers: {
                    contentType: "application/json"
                },
                body: ""
            };
        }
    }
}

//Mock class for the HttpServiceToolKit class.
public isolated class MockHttpServiceToolKit {
    *agent:BaseToolKit;
    private final agent:Tool[] & readonly tools;

    public isolated function init(string serviceUrl, agent:HttpTool[] httpTools, http:ClientConfiguration clientConfig = {}, map<string|string[]> headers = {}) returns error? {
        agent:HttpServiceToolKit toolKit = check new agent:HttpServiceToolKit(serviceUrl, httpTools, clientConfig, headers = {
            "API-Key": "token"
        });

        agent:Tool[] actualTools = toolKit.getTools();
        agent:Tool[] mockTools = [];

        isolated function resourceName;
        lock {
            resourceName = <isolated function>mockResource;
        }

        foreach agent:Tool actualTool in actualTools {
            agent:Tool mockTool = {
                name: actualTool.name,
                description: actualTool.description,
                parameters: actualTool.parameters,
                caller: resourceName
            };
            mockTools.push(mockTool);
        }
        self.tools = mockTools.cloneReadOnly();
    }
    public isolated function getTools() returns agent:Tool[] {
        return self.tools;
    }
}

//Mock class for the AzureChatGptModel class.
public isolated class MockAzureChatGptModel {
    final azure_chat:Client llmClient;
    final agent:ChatModelConfig modelConfig;
    private final string deploymentId;
    private final string apiVersion;
    public isolated function init(azure_chat:ConnectionConfig connectionConfig, string serviceUrl, string deploymentId,
            string apiVersion, agent:ChatModelConfig modelConfig = {}) returns error? {
        self.llmClient = check new (connectionConfig, serviceUrl);
        self.modelConfig = modelConfig;
        self.deploymentId = deploymentId;
        self.apiVersion = apiVersion;
    }

    public isolated function functionCall(agent:ChatMessage[] messages, agent:ChatCompletionFunctions[] functions, string? stop = ()) returns agent:FunctionCall|string|agent:LlmError {

        if isAccuracyTest {
            azure_chat:CreateChatCompletionResponse|error response =
    self.llmClient->/deployments/[self.deploymentId]/chat/completions.post(self.apiVersion, {
                ...self.modelConfig,
                stop,
                messages,
                functions
            });
            if response is error {
                return error agent:LlmConnectionError("Error while connecting to the model", response);
            }

            record {|
                azure_chat:ChatCompletionResponseMessage message?;
                azure_chat:ContentFilterChoiceResults content_filter_results?;
                int index?;
                string finish_reason?;
                anydata...;
            |}[]? choices = response.choices;
            if choices !is () {
                // check whether the model response is text
                string? content = choices[0].message?.content;
                if content is string {
                    return content;
                }

                // check whether the model response is a function call
                azure_chat:ChatCompletionFunctionCall? function_call = choices[0].message?.function_call;
                if function_call is azure_chat:ChatCompletionFunctionCall {
                    return {
                        ...function_call
                    };
                }
            }
            return error agent:LlmInvalidResponseError("Empty response from the model when using function call API");

        } else {
            string:RegExp r = re `\r`;
            string replaceMessage = r.replaceAll(messages.toString(), "");

            string commanMessageTemplate = string
`[{"role":"system","content":"You can use these information if needed: You are a API testing assistant called "API Chat". Your capabilities are STRICTLY limited to the followings.
    - Introduce yourself as the API Chat; an Intelligent Agent that can engage with user's APIs in natural language.
    - Answer user's questions by invoking API resources provided to you as functions, in order to test those APIs.
    - You can invoke the functions with the appropriate input parameters to test the APIs. You are NOT allowed to ask for user input to invoke the functions.
    - If asked to invoke all resources, you MUST try to execute all the available functions.
    - When asked, provide information about the available API resources, their input parameters, accordingly. ALWAYS refer to functions as API resources.
    - If user asks for a sample question, reply with a example natural language query to invoke one or more functions.
DO NOT respond to question unrelated to the above capabilities. Respond appropriately to the invalid questions with proper feedback to improve, if needed."},{"role":"user","content":"`;

            string validPayloadTestIteration1 = string `${commanMessageTemplate}Get user with username Bob_123"}]`;

            string validPayloadTestIteration2 = string `${commanMessageTemplate}Get user with username Bob_123"},{"role":"assistant","function_call":{"name":"GET-user_username","arguments":"{"parameters": {"username": "Bob_123"}}"}},{"role":"function","content":"{"code":200,"path":"/user/Bob_123","headers":{"contentType":"application/json"},"body":[{"id":1,"username":"Bob_123","firstName":"Bob","lastName":"Johnson","email":"bob@gmail.com","password":"XXXXXXXXXXX","phone":"123-456-7890","userStatus":1}]}","name":"GET-user_username"}]`;

            string invalidLLMResponseTestIteration1 = string `${commanMessageTemplate}Delete pet 1"}`;

            string maxIterationTestIteration1 = string `${commanMessageTemplate}Get pet with ID 5"}]`;

            string maxIterationTestRemainIterations = string `${commanMessageTemplate}Get pet with ID 5"},{"role":"assistant","function_call":{"name":"GET-pet_petId","arguments":"{"parameters": {"petId": 5}}"}},{"role":"function","content":"{"code":200,"path":"/pet/getPet/5","headers":{"contentType":"application/json"},"body":{"id":5,"name":"Fluffy","category":{"id":1,"name":"Domestic"},"photoUrls":["https://example.com/fluffy.jpg"],"tags":[{"id":101,"name":"Cute"}],"status":"available"}}","name":"GET-pet_petId"}`;

            string llmConnectionErrorTestIteration1 = string `${commanMessageTemplate}Find all available pets"}]`;

            string invokeAllTestIteration1 = string `[{"role":"user","content":"call GET-books function with appropriate data"}]`;

            string invokeAllTestIteration2 = string `[{"role":"user","content":"call DELETE-books_id function with appropriate data"}]`;

            string replaceValidPayloadTestIteration1 = r.replaceAll(validPayloadTestIteration1, "");
            string replaceValidPayloadTestIteration2 = r.replaceAll(validPayloadTestIteration2, "");
            string replaceInvalidLLMResponseTestIteration1 = r.replaceAll(invalidLLMResponseTestIteration1, "");
            string replaceMaxIterationTestIteration1 = r.replaceAll(maxIterationTestIteration1, "");
            string replaceMaxIterationRemainIterations = r.replaceAll(maxIterationTestRemainIterations, "");
            string replaceLlmConnectionErrorTestIteration1 = r.replaceAll(llmConnectionErrorTestIteration1, "");
            string replaceInvokeAllTestIteration1 = r.replaceAll(invokeAllTestIteration1, "");
            string replaceInvokeAllTestIteration2 = r.replaceAll(invokeAllTestIteration2, "");

            if replaceMessage == replaceValidPayloadTestIteration1 {
                return {
                    "name": "GET-user_username",
                    "arguments": "{\"parameters\": {\"username\": \"Bob_123\"}}"
                };
            } else if replaceMessage == replaceValidPayloadTestIteration2 {
                return "The user with username \"Bob_123\" is Bob Johnson.";
            } else if replaceMessage.includes(replaceInvalidLLMResponseTestIteration1) {
                return {
                    "name": "DELETE-pet_petId",
                    "arguments": "{\"parameters \"Bob_123}}"
                };
            } else if replaceMessage == replaceMaxIterationTestIteration1 || replaceMessage.includes(replaceMaxIterationRemainIterations) {
                return {
                    "name": "GET-pet_petId",
                    "arguments": "{\"parameters\": {\"petId\": 5}}"
                };
            } else if replaceMessage == replaceInvokeAllTestIteration1 {
                return {
                    "name": "GET-books",
                    "arguments": "{}"
                };
            } else if replaceMessage == replaceInvokeAllTestIteration2 {
                return {
                    "name": "DELETE-books_id",
                    "arguments": "{\"parameters\": {\"id\": \"12345\"}}"
                };
            }
            else if replaceMessage == replaceLlmConnectionErrorTestIteration1 {
                return error agent:LlmConnectionError("Error while connecting to the model");
            } else {
                return error agent:LlmInvalidResponseError("Empty response from the model when using function call API");
            }
        }
    }
}

//to return a mock AzureChatGptModel
@test:Mock {
    functionName: "initializeModel"
}
isolated function mockInitializeModel() returns agent:AzureChatGptModel|error {
    return test:mock(agent:AzureChatGptModel, check new MockAzureChatGptModel({auth: {apiKey: openAIToken}, httpVersion: http:HTTP_1_1}, azureOpenAIServiceUrl, azureOpenAIDeploymentId, AZURE_OPENAI_API_VERSION, {}));
}

//return a mock toolkit object
@test:Mock {
    functionName: "createToolkit"
}
isolated function mockCreateToolkit(string serviceUrl, agent:HttpTool[] httpTools, string? token = null) returns agent:HttpServiceToolKit|error {
    return test:mock(agent:HttpServiceToolKit, check new MockHttpServiceToolKit(serviceUrl, httpTools, {httpVersion: http:HTTP_1_1}, headers = {
        "API-Key": "token"
    }));
}

//mock function for the updateTestCaseCache function.
@test:Mock {
    functionName: "updateTestCaseCache"
}
isolated function mockUpdateTestCaseCache(string testCaseId, CacheRecord value) {
    lock {
        mockCachedRecord = {
            iteration: value.iteration,
            command: value.command,
            apiSpec: value.apiSpec.cloneReadOnly(),
            executionHistory: value.executionHistory.cloneReadOnly()
        };
    }

}

//mock function for the retrieveCachedTestCase function.
@test:Mock {
    functionName: "retrieveCachedTestCase"
}
isolated function mockRetrieveCachedTestCase(string testCaseId) returns CacheRecord|error {
    CacheRecord cachedRecord;

    lock {
        int retrievedIteration = mockCachedRecord.iteration;
        string retrievedCommand = mockCachedRecord.command;
        agent:HttpApiSpecification retrievedApiSpec = mockCachedRecord.apiSpec;
        TestExecutionStep[] retrievedExecutionHistory = mockCachedRecord.executionHistory;

        cachedRecord = {
            iteration: retrievedIteration,
            command: retrievedCommand,
            apiSpec: retrievedApiSpec.cloneReadOnly(),
            executionHistory: retrievedExecutionHistory.cloneReadOnly()
        };
    }
    return cachedRecord;
}

//mock function for the clearTestCaseCache function.
@test:Mock {
    functionName: "clearTestCaseCache"
}
isolated function mockClearTestCaseCache(string testCaseId) {
    lock {
        mockCachedRecord = {
            iteration: 0,
            command: "",
            apiSpec: {
                serviceUrl: "",
                tools: []
            },
            executionHistory: [
                {
                    llmResponse: {
                        "name": "",
                        "arguments": "{}"
                    },
                    observation: {
                        code: 0,
                        path: "",
                        headers: {contentType: "application/json"},
                        body: {}
                    }
                }
            ]

        };
    }
}
