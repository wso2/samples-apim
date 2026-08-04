// Copyright (c) 2024, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 Inc. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein is strictly forbidden, unless permitted by WSO2 in accordance with
// the WSO2 Commercial License available at http://wso2.com/licenses.
// For specific language governing the permissions and limitations under
// this license, please see the license as well as any agreement you’ve
// entered into with WSO2 governing the purchase of this software and any
import ballerina/test;
import wso2/ai.agent;

type TotalCorrectResponsesAndPaths record {|
    int correctResponses;
    int correctPaths;
    string[] incorrectPath?;
    string[] incorrectResponse?;
|};

type TestQuery record {|
    string command;
    string[] goldApiPath;
    function (TestExecutionResponse[] executionResponse) returns boolean|error objectiveAssertor;
|};

TestQuery[] petStoreCommandsResponsesAndPaths = [
    {
        command: "Get pet ID 5",
        goldApiPath: [
            "[\"/pet/getPet/5\"]"
        ],
        objectiveAssertor: evaluateGetPet
    },
    {
        command: "Find all available pets and then place a new order in the store for the dog with petID 224.",
        goldApiPath: [
            "[\"/pet/findByStatus?status=available\",\"/store/order\"]",
            "[\"/pet/findByStatus?status=available\",\"/pet/224\",\"/store/order\"]"
        ],
        objectiveAssertor: evaluatePlaceNewOrder
    }
];

TestQuery[] bookStoreCommandResponsesAndPaths = [
    {
        command: "Get all the books written by Joanne Rowling and delete them.",
        goldApiPath: [
            "[\"/booksByAuthor?authorName=Joanne Rowling\",\"/book/delete?bookId=101\"]",
            "[\"/booksByAuthor?authorName=Joanne Rowling\",\"/book/delete?bookId=101\",\"/countBooks\",\"/hasBook?bookTitle=\"Harry Potter and the Sorcerer's Stone\"]",
            "[\"/booksByAuthor?authorName=Joanne Rowling\",\"/book/delete?bookId=101\",\"/hasBook?bookTitle=\"Harry Potter and the Sorcerer's Stone\"]",
            "[\"/booksByAuthor?authorName=Joanne Rowling\",\"/book/delete?bookId=101\",\"/countBooks\"]",
            "[\"/booksByAuthor?authorName=Joanne Rowling\",\"/book/delete?bookId=101\",\"/book/id?bookId=101\"]",
            "[\"/booksByAuthor?authorName=Joanne Rowling\",\"/hasBook?bookTitle=\"Harry Potter and the Sorcerer's Stone\",\"/book/delete?bookId=101\"]"
        ],
        objectiveAssertor: evaluateGetBooks
    },
    {
        command: "Delete the book The Da Vinci Code with bookID 103 if it exists, and then get the count of all books in the bookstore",
        goldApiPath: [
            "[\"/hasBook?bookTitle=The Da Vinci Code\",\"/book/delete?bookId=103\",\"/countBooks\"]",
            "[\"/book/delete?bookId=103\",\"/countBooks\"]"
        ],
        objectiveAssertor: evaluateDeleteBooks
    },
    {
        command: "Update the published year of the books to 2005 that are published in 2003.",
        goldApiPath: [
            "[\"/booksByYear?year=2003\",\"/book/updateBook?bookId=346\"]",
            "[\"/booksByYear?year=2003\",\"/book/updateBook?bookId=346\",\"/booksByYear?year=2005\"]",
            "[\"/booksByYear?year=2003\",\"/book\",\"/book/delete?bookId=346\"]",
            "[\"/booksByYear?year=2003\",\"/book/delete?bookId=346\",\"/book\"]",
            "[\"/booksByYear?year=2003\",\"/book/delete?bookId=346\",\"/book\",\"/booksByYear?year=2005\"]",
            "[\"/booksByYear?year=2003\",\"/book\",\"/book/delete?bookId=346\",\"/booksByYear?year=2005\"]"
        ],
        objectiveAssertor: evaluateUpdateBook
    }
];

function evaluateGetPet(TestExecutionResponse[] executionResponse) returns boolean {

    foreach TestExecutionResponse response in executionResponse {
        if response.result.'resource.path == "/pet/getPet/{petId}" {
            json petDetails = response.result.output.get("body").toJson();
            if petDetails.id == 5 {
                return true;
            }
        }
    }
    return false;
}

function evaluatePlaceNewOrder(TestExecutionResponse[] executionResponse) returns boolean|error {

    boolean isAvailable = false;
    foreach TestExecutionResponse response in executionResponse {
        if response.result.'resource.path == "/pet/findByStatus" {

            json[] petList = <json[]>response?.result?.output?.body;
            foreach var pet in petList {
                if pet.status == "available" {
                    isAvailable = true;
                }
            }
        }
        if isAvailable {
            if response.result.'resource.path == "/store/order" {
                json orderDetails = response.result.output.get("body").toJson();
                if int:fromString((check orderDetails.petId).toString()) == 224 {
                    return true;
                }
            }
        }
    }
    return false;
}

function evaluateGetBooks(TestExecutionResponse[] executionResponse) returns boolean|error {

    boolean isFound = false;
    foreach TestExecutionResponse response in executionResponse {

        if response.result.'resource.path == "/booksByAuthor" {
            json[] bookList = <json[]>response?.result?.output?.body;
            foreach var book in bookList {
                if book.Author == "Joanne Rowling" {
                    isFound = true;
                }
            }
        }
        if isFound {
            if response.result.'resource.path == "/book/delete" {
                json parameterValue = response.result.'resource.inputs.toJson();
                if parameterValue.parameters.bookId == 101 {
                    return true;
                }
            }
        }
    }
    return false;
}

function evaluateDeleteBooks(TestExecutionResponse[] executionResponse) returns boolean|error {

    boolean isDeleted = false;
    foreach TestExecutionResponse response in executionResponse {
        if response.result.'resource.path == "/book/delete" {
            json parameterValue = response.result.'resource.inputs.toJson();
            if parameterValue.parameters.bookId == 103 {
                isDeleted = true;
            }
        }
        if isDeleted {
            if response.result.'resource.path == "/countBooks" {
                return true;
            }
        }
    }
    return false;
}

function evaluateUpdateBook(TestExecutionResponse[] executionResponse) returns boolean|error {

    boolean isFound = false;
    boolean isPostResponse = false;
    boolean isDeleted = false;
    foreach TestExecutionResponse response in executionResponse {
        if response.result.'resource.path == "/booksByYear" {
            json outputBodyJson = response.result.output.get("body").toJson();
            if outputBodyJson.book.year == "2003" {
                isFound = true;
            }
        }

        if isFound {
            if response.result.'resource.path == "/book/updateBook" && response.result.'resource.method == "PUT" {
                json parameterValue = response.result.'resource.inputs.toJson();
                json outputBodyJson = response.result.output.get("body").toJson();

                if parameterValue.parameters.bookId == 346 && int:fromString((check outputBodyJson.year).toString()) == 2005
                && check outputBodyJson.title == "Harry Potter and the Sorcerer's Stone"
                && check outputBodyJson.author.name == "Joanne Rowling"
                && check outputBodyJson.isbn == "123456789" {
                    return true;
                }
            } else if response.result.'resource.path == "/book" && response.result.'resource.method == "POST" {
                json outputBodyJson = response.result.output.get("body").toJson();
                if int:fromString((check outputBodyJson.year).toString()) == 2005
                && check outputBodyJson.title == "Harry Potter and the Sorcerer's Stone"
                && check outputBodyJson.author.name == "Joanne Rowling"
                && check outputBodyJson.isbn == "123456789" {
                    isPostResponse = true;
                }

                if isPostResponse {
                    if response.result.'resource.path == "/book/delete" {
                        json parameterValue = response.result.'resource.inputs.toJson();
                        if parameterValue.parameters.bookId == 346 {
                            return true;
                        }
                    }
                }
            } else if response.result.'resource.path == "/book/delete" {
                json parameterValue = response.result.'resource.inputs.toJson();

                if parameterValue.parameters.bookId == 346 {
                    isDeleted = true;
                }

                if isDeleted {
                    if response.result.'resource.path == "/book" && response.result.'resource.method == "POST" {
                        json outputBodyJson = response.result.output.get("body").toJson();
                        if int:fromString((check outputBodyJson.year).toString()) == 2005
                && check outputBodyJson.title == "Harry Potter and the Sorcerer's Stone"
                && check outputBodyJson.author.name == "Joanne Rowling"
                && check outputBodyJson.isbn == "123456789" {
                            return true;
                        }
                    }
                }
            }
        }
    }
    return false;
}

//to calculate the number of correct paths and the number of correct responses.
function numberOfCorrectPathsAndResponses(TestQuery[] commandsResponsesPaths, agent:HttpTool[] tools, isolated function mockApi) returns TotalCorrectResponsesAndPaths|error {
    lock {
        mockResource = mockApi;
    }
    int correctResponses = 0;
    int correctPaths = 0;
    string[] incorrectPaths = []; //to store the incorrect paths.
    string[] incorrectResponses = []; //to store the commands which did not receive a response.
    foreach TestQuery commandResponsePath in commandsResponsesPaths {
        boolean[] responseRecieved = [];
        string[] modelGeneratedAPIPath = [];
        TestResponse|ErrorInfo|error testResponse = getTestResponse(commandResponsePath.command, tools);
        if testResponse is error || testResponse is ErrorInfo {
            incorrectResponses.push(string `Error occured while executing the command : ${commandResponsePath.command} `);
            continue;
        } else {
            //Check whether the expected responses are received.   
            function (TestExecutionResponse[] executionResponse) returns boolean|error evaluateResponse = commandResponsePath.objectiveAssertor;
            boolean isResponseReceived = check evaluateResponse(testResponse.executionResponseList);

            responseRecieved.push(isResponseReceived);

            if isResponseReceived && testResponse.terminationCause == COMPLETED && testResponse.completionResponseResult != "" {
                correctResponses = correctResponses + 1;
            } else {
                incorrectResponses.push(string `Did not receive a response for the command : ${commandResponsePath.command} `);
            }

            foreach TestExecutionResponse response in testResponse.executionResponseList {
                string path = response.result.output.path.toString();
                modelGeneratedAPIPath.push(path);
            }

            boolean isCorrectPath = false;

            foreach string goldPath in commandResponsePath.goldApiPath {
                if goldPath == modelGeneratedAPIPath.toString() {
                    correctPaths = correctPaths + 1;
                    isCorrectPath = true;
                    break;
                }
            }
            if !isCorrectPath {
                incorrectPaths.push(string `${modelGeneratedAPIPath.toString()}`);
            }
        }
    }
    TotalCorrectResponsesAndPaths correctResponsesAndPaths = {
        correctResponses: correctResponses,
        correctPaths: correctPaths,
        incorrectPath: incorrectPaths,
        incorrectResponse: incorrectResponses
    };
    return correctResponsesAndPaths;
}

@test:Config {
    groups: ["accuracy"]
}
function accuracyTest() returns error? {
    TotalCorrectResponsesAndPaths petStoreValue = check numberOfCorrectPathsAndResponses(petStoreCommandsResponsesAndPaths, petStoreTools, mockPetStore);
    TotalCorrectResponsesAndPaths bookServiceValue = check numberOfCorrectPathsAndResponses(bookStoreCommandResponsesAndPaths, booksServiceTools, mockBookService);

    int correctPaths = petStoreValue.correctPaths + bookServiceValue.correctPaths;
    int totalCommands = petStoreCommandsResponsesAndPaths.length() + bookStoreCommandResponsesAndPaths.length();
    float correctPathRate = <float>correctPaths / totalCommands;

    int correctResponses = petStoreValue.correctResponses + bookServiceValue.correctResponses;
    float successRate = <float>correctResponses / totalCommands;

    test:assertTrue(correctPathRate >= 0.8 && successRate >= 0.8,
    string `Correct path rate is less than 80% or success rate is less than 80%. Observed correct path rate: ${(correctPathRate * 100).toFixedString(0)}% and success rate: ${(successRate * 100).toFixedString(0)}%, ${"\n"} 
    incorrect paths petStore: ${petStoreValue.incorrectPath.toString()} ${"\n"} 
    incorrect paths bookStore: ${bookServiceValue.incorrectPath.toString()} ${"\n"}
    incorrect responses petStore: ${petStoreValue.incorrectResponse.toString()} ${"\n"}
    incorrect responses bookStore: ${bookServiceValue.incorrectResponse.toString()}`);
}
