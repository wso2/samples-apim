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
import ballerina/log;
import wso2/ai.agent;

// llm used by the agent
final agent:AzureChatGptModel model = check initializeModel();

class ApiChatAgent {
    final int iteration;
    agent:HttpApiSpecification apiSpec;
    agent:AgentTool[] tools;
    agent:FunctionCallAgent agent;
    agent:Executor agentExecutor;
    TestExecutionStep[] executionHistory;
    string testCaseId;
    agent:ExecutionProgress progress;

    isolated function init(string query, agent:HttpApiSpecification apiSpec, TestExecutionStep[] executionHistory, string token, int iteration, string testCaseId) returns error? {
        self.testCaseId = testCaseId;
        self.iteration = iteration;
        self.executionHistory = executionHistory;
        string? serviceUrl = apiSpec.serviceUrl;
        if serviceUrl == () {
            return error InvalidSpecificationError("Service URL not found in the OpenAPI specification.");
        }
        agent:HttpServiceToolKit toolKit = check createToolkit(serviceUrl, apiSpec.tools, token);
        agent:FunctionCallAgent agent = check new (model, toolKit);
        self.agent = agent;
        self.progress = {
            query,
            history: from TestExecutionStep step in executionHistory
                select {llmResponse: step.llmResponse, observation: step.observation},
            context: getApiChatContext()
        };
        self.agentExecutor = new (self.agent, self.progress);
        self.tools = agent:getTools(self.agent);
        log:printDebug("Agent created successfully.", id = testCaseId, url = apiSpec.serviceUrl);
        self.apiSpec = apiSpec;
    }

    isolated function execute(json? restoredResponse, boolean isTestAll = false) returns ExecutionResult|string|error {
        // execute the agent
        json? previousResponse = restoredResponse;
        retry<RetryManager> (APICHAT_RETRY_COUNT) {
            int iteration = self.iteration;
            // generate the thought
            json|error llmResponse;
            if previousResponse !is () {
                llmResponse = previousResponse;
                previousResponse = ();
            } else if isTestAll {
                int resourceCount = self.apiSpec.tools.length();
                if iteration > resourceCount {
                    log:printDebug(string `Task is completed in ${iteration == 1 ? iteration : iteration - 1} iteration(s).`, id = self.testCaseId);
                    return string `All ${resourceCount} resources were invoked.`;
                }
                llmResponse = self.getNextTool();
            } else {
                llmResponse = self.agentExecutor.reason();
            }
            // fix the llm response if it is not a function call
            llmResponse = self.fixLlmResponse(llmResponse);
            if llmResponse is error {
                fail handleLlmGenerationErrors(llmResponse);
            }
            // execute the thought
            agent:ExecutionResult|agent:LlmChatResponse|agent:ExecutionError executionResult = self.agentExecutor.act(llmResponse);
            // handles execution errors due to invalid generation by the agent
            if executionResult is agent:ExecutionError {
                fail error agent:LlmInvalidGenerationError("Error due to invalid generation by the agent.", executionResult.'error, llmResponse = executionResult.llmResponse);
            }
            // handles the completion of the task
            if executionResult is agent:LlmChatResponse {
                log:printDebug(string `Task is completed in ${iteration == 1 ? iteration : iteration - 1} iteration(s).`, id = self.testCaseId);
                string answer = executionResult.content;
                return answer.length() > 1 ? answer.trim() : "Execution is completed.";
            }

            // handle tool output 
            anydata|error observation = executionResult.observation;
            // handles rest of the http tools
            // check for http client errors 
            if observation is http:ClientError {
                return error ApiCommunicationError("Http client error when invoking API.", observation, llmResponse = llmResponse);
            }
            // check for response parsing errors
            if observation is agent:HttpResponseParsingError {
                return error ApiCommunicationError("Error while parsing the response.", observation, llmResponse = llmResponse);
            }
            // check for generation errors
            if observation !is agent:HttpOutput {
                fail error agent:LlmInvalidGenerationError("Error due to invalid generation by the agent.", observation is error ? observation : (), llmResponse = llmResponse, observation = observation is anydata ? observation : ());
            }
            ApiResourceDefinition|error 'resource = self.extractApiSpecFromThought(executionResult.tool);
            if 'resource is error {
                fail 'resource;
            }
            return {
                'resource,
                output: observation
            };
        }
    }

    isolated function chat(TokenCounts tokenCounts, boolean isTestAll = false) returns NextAction|string|error {
        // execute the agent
        retry<RetryManager> (APICHAT_RETRY_COUNT) {
            int iteration = self.iteration;
            // generate the thought
            json|error llmResponse;
            if isTestAll {
                int resourceCount = self.apiSpec.tools.length();
                if iteration > resourceCount {
                    log:printDebug(string `Task is completed in ${iteration == 1 ? iteration : iteration - 1} iteration(s).`, id = self.testCaseId);
                    return string `All ${resourceCount} resources were invoked.`;
                }
                llmResponse = self.getNextTool(tokenCounts);
            } else {
                llmResponse = self.agentExecutor.reason();
            }
            // fix the llm response if it is not a function call
            llmResponse = self.fixLlmResponse(llmResponse);
            if llmResponse is error {
                fail handleLlmGenerationErrors(llmResponse);
            }
            // handles the completion of the task
            if llmResponse is string {
                log:printDebug(string `Task is completed in ${iteration == 1 ? iteration : iteration - 1} iteration(s).`);
                string answer = llmResponse.toString();
                int completion_tokens = getTokenCount(answer);
                tokenCounts.completion_tokens += completion_tokens;
                tokenCounts.total_tokens += completion_tokens;
                return answer.length() > 1 ? answer.trim() : "Execution is completed.";
            }

            agent:LlmToolResponse|agent:LlmChatResponse|error parseLlmResponse = self.agent.parseLlmResponse(llmResponse);
            if parseLlmResponse !is agent:LlmToolResponse {
                return error agent:LlmInvalidGenerationError("Error due to invalid generation by the agent.", llmResponse = llmResponse);
            }
            ApiResourceDefinition|error 'resource = self.extractApiSpecFromThought(parseLlmResponse);
            if 'resource is error {
                fail 'resource;
            }
            return {
                'resource,
                llmResponse
            };
        }
    }

    isolated function getNextTool(TokenCounts tokenCounts = {prompt_tokens: 0, completion_tokens: 0, total_tokens: 0}) returns agent:FunctionCall|agent:LlmError {
        agent:AgentTool tool = self.tools[self.iteration - 1];
        string|agent:FunctionCall|agent:LlmError functionCall = model.functionCall(
            [{"role": agent:USER, "content": string `call ${tool.name} function with appropriate data`}],
            functions = [
            {
                name: tool.name,
                description: tool.description,
                parameters: tool.variables
            }
        ]);
        if functionCall is string {
            return error agent:LlmInvalidGenerationError("Error due to invalid generation by the agent.");
        }

        string command = string `call ${tool.name} function with appropriate data`;
        (map<json>|string)? context = self.progress.context;
        string contextString = "";
        if context is string {
            contextString = context;
        }
        else if context is map<json> {
            contextString = context.toString();
        }
        string prompt = string `${command} ${tool.description} ${tool.variables.toString()} ${tool.name} ${self.progress.query} ${contextString} ${self.progress.history.toString()}`;
        int promptTokens = getTokenCount(prompt);
        int responseTokens = 0;

        if functionCall is agent:FunctionCall {
            responseTokens = getTokenCount(functionCall.toString());
        }

        tokenCounts.prompt_tokens += promptTokens;
        tokenCounts.completion_tokens += responseTokens;
        tokenCounts.total_tokens += promptTokens + responseTokens;

        return functionCall;
    }

    private isolated function extractApiSpecFromThought(agent:LlmToolResponse tool) returns ApiResourceDefinition|error {
        map<json>? inputs = tool.arguments;
        if inputs !is () && inputs.hasKey(PATH_KEY) {
            _ = inputs.remove(PATH_KEY);
        }
        foreach agent:HttpTool httpTool in self.apiSpec.tools {
            if httpTool.name == tool.name {
                return {
                    path: httpTool.path,
                    method: httpTool.method,
                    inputs
                };
            }
        }
        return error("No Http tool matches the name of the tool invoked", invokedTool = tool, availableApis = from agent:HttpTool httpTool in self.apiSpec.tools
            select httpTool.name);
    }

    isolated function fixLlmResponse(json|error llmResponse) returns string|agent:FunctionCall|error {
        if llmResponse is string|error {
            return llmResponse;
        }
        if llmResponse !is agent:FunctionCall {
            return error agent:LlmInvalidGenerationError("Error due to invalid generation by the agent.", llmResponse = llmResponse);
        }
        agent:LlmToolResponse|agent:LlmChatResponse|error parseLlmResponse = self.agent.parseLlmResponse(llmResponse);
        if parseLlmResponse !is agent:LlmToolResponse {
            return llmResponse;
        }
        map<json>? arguments = parseLlmResponse.arguments;
        if arguments is () || arguments.length() == 0 || arguments.hasKey(PARAMETER_KEY) || arguments.hasKey(REQUEST_BODY_KEY) {
            return llmResponse;
        }
        map<json> correctedArguments = {};
        foreach agent:HttpTool tool in self.apiSpec.tools {
            if tool.name == parseLlmResponse.name {
                map<agent:ParameterSchema>? parameters = tool.parameters;
                if parameters !is () && parameters.length() > 0 {
                    correctedArguments[PARAMETER_KEY] = arguments;
                }
                agent:RequestBodySchema? requestBody = tool.requestBody;
                if requestBody !is () {
                    correctedArguments[REQUEST_BODY_KEY] = arguments;
                }
            }
        }
        return {
            name: parseLlmResponse.name,
            arguments: correctedArguments.toString()
        };
    }
}

isolated function getApiChatContext() returns string => string `You are a API testing assistant called "API Chat". Your capabilities are STRICTLY limited to the followings.
    - Introduce yourself as the API Chat; an Intelligent Agent that can engage with user's APIs in natural language.
    - Answer user's questions by invoking API resources provided to you as functions, in order to test those APIs.
    - You can invoke the functions with the appropriate input parameters to test the APIs. You are NOT allowed to ask for user input to invoke the functions.
    - If asked to invoke all resources, you MUST try to execute all the available functions.
    - When asked, provide information about the available API resources, their input parameters, accordingly. ALWAYS refer to functions as API resources.
    - If user asks for a sample question, reply with a example natural language query to invoke one or more functions.
DO NOT respond to question unrelated to the above capabilities. Respond appropriately to the invalid questions with proper feedback to improve, if needed.`;

isolated function handleLlmGenerationErrors(error e) returns error {
    // TODO improve this once these errors are handled from the agent module
    error? cause = e;
    while cause is error && cause !is http:ClientRequestError {
        cause = cause.cause();
    }
    if cause is http:ClientRequestError {
        string message = cause.detail().body.toString();
        if message.includes("context_length_exceeded") || message.includes("maximum context length") {
            return error LlmTokenLimitExceededError("Token limit exceeded.", e);
        }
        if message.includes("content_filter") {
            return error LlmContentPolicyViolationError("Detected a content policy violation", e);
        }
    }
    return e;
}

isolated function createToolkit(string serviceUrl, agent:HttpTool[] httpTools, string token) returns agent:HttpServiceToolKit|error {
    if (token != "") {
        return check new (serviceUrl, httpTools, {httpVersion: http:HTTP_1_1}, headers = {
            "API-Key": token
        });
    } else {
        return check new (serviceUrl, httpTools, {httpVersion: http:HTTP_1_1});
    }
}

isolated function initializeModel() returns agent:AzureChatGptModel|error {
    return check new ({auth: {apiKey: openAIToken}, httpVersion: http:HTTP_1_1}, azureOpenAIServiceUrl, azureOpenAIDeploymentId, AZURE_OPENAI_API_VERSION, {});
}
