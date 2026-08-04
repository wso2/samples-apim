import ballerina/http;
import ballerina/lang.value;
import ballerina/log;
import wso2/ai.agent;

enum ErrorLevel {
    ERROR, WARN
};

enum Task {
    ENRICHMENT, EXECUTION
};

enum ErrorCode {
    INVALID_SPECIFICATION,
    INVALID_RESOURCE_PATH,
    UNSUPPORTED_MEDIA_TYPE,
    UNSUPPORTED_SPECIFICATION,
    LLM,
    LLM_CONNECTION,
    CACHING,
    RESPONSE_PARSING,
    API_COMMUNICATION,
    TOKEN_LIMIT_EXCEEDED,
    CONTENT_POLICY_VIOLATION,
    INVALID_COMMAND,
    STACK_OVERFLOW,
    GENERIC
}

type ErrorInfo record {|
    ErrorLevel level;
    string message;
    ErrorCode code;
|};

type InternalServerError record {|
    *http:InternalServerError;
    ErrorInfo body;
|};

public type InvalidResourcePathError distinct error;

public type InvalidSpecificationError distinct error;

public type UnsupportedSpecificationError distinct error;

public type CachingError distinct error;

public type ApiCommunicationError distinct error;

public type LlmTokenLimitExceededError distinct error;

public type LlmContentPolicyViolationError distinct error;

public type InvalidCommandError distinct error;

isolated function handleServerError(error 'error, Task task, *log:KeyValues keyValues) returns InternalServerError|ErrorInfo {
    string message;
    ErrorLevel level;
    ErrorCode code;
    if 'error is InvalidSpecificationError {
        error? cause = 'error.cause();
        if cause is InvalidResourcePathError {
            message = cause.message();
            code = INVALID_RESOURCE_PATH;
        } else if cause is agent:UnsupportedOpenApiVersion {
            message = cause.message();
            code = UNSUPPORTED_SPECIFICATION;
        } else {
            message = "The specification could not be parsed. Ensure you are using a valid specification.";
            code = INVALID_SPECIFICATION;
        }
        level = WARN;
    }
    else if 'error is agent:UnsupportedMediaTypeError {
        message = "The OpenAPI specification includes non-JSON input types, which are not currently supported.";
        code = UNSUPPORTED_MEDIA_TYPE;
        level = WARN;
    }
    else if 'error is UnsupportedSpecificationError {
        message = "The OpenAPI specification includes components that are currently not supported.";
        code = UNSUPPORTED_SPECIFICATION;
        level = WARN;
    }
    else if 'error is agent:LlmInvalidGenerationError || 'error is agent:LlmConnectionError || 'error is LlmTokenLimitExceededError {
        error? cause = 'error.cause();
        if 'error is LlmTokenLimitExceededError || cause is LlmTokenLimitExceededError {
            if task == ENRICHMENT {
                message = "The OpenAPI specification for the API exceeds the maximum limit.";
            } else {
                message = "Execution has been terminated due to exceeding input token limit to LLM.";
            }
            code = TOKEN_LIMIT_EXCEEDED;
            level = WARN;
        }
        else if cause is LlmContentPolicyViolationError {
            if task == ENRICHMENT {
                message = "The content in the OpenAPI specification violates the Azure OpenAI content policy.";
            } else {
                message = "Your query seems to contain inappropriate content. Please try again with a different query.";
            }
            code = CONTENT_POLICY_VIOLATION;
            level = WARN;
        }
        else if 'error is agent:LlmConnectionError || cause is agent:LlmConnectionError {
            message = "There was an error connecting to Azure OpenAI.";
            code = LLM_CONNECTION;
            level = WARN;
        } else {
            if task == ENRICHMENT {
                message = "Failed to load API Chat.";
            } else {
                message = "An error occurred during query execution. Try again.";
            }
            code = LLM;
            level = ERROR;
        }
    }
    else if 'error is CachingError {
        message = "An error occurred during query execution. Try again later.";
        code = CACHING;
        level = ERROR;
    }
    else if 'error is ApiCommunicationError {
        error? cause = 'error.cause();
        if cause is agent:HttpResponseParsingError {
            message = "An error occurred while attempting to extract the API response.";
            code = RESPONSE_PARSING;

        } else {
            message = "An error occurred while attempting to establish a connection with your API.";
            code = API_COMMUNICATION;
        }
        level = ERROR;
    }
    else if 'error is InvalidCommandError {
        message = "Invalid query is provided.";
        code = INVALID_COMMAND;
        level = WARN;
    }
    else if 'error is agent:ParsingStackOverflowError {
        message = "Parsing failed due to either a cyclic reference or the excessive length of the specification.";
        code = STACK_OVERFLOW;
        level = WARN;
    }
    else {
        if task == ENRICHMENT {
            message = "An error occurred during loading API Chat.";
        } else {
            message = "An error occurred during query execution.";
        }
        code = GENERIC;
        level = ERROR;
    }
    return createErrorMessage(message, level, code, 'error, keyValues);
}

isolated function createErrorMessage(string message, ErrorLevel level, ErrorCode code, error 'error, *log:KeyValues keyValues) returns InternalServerError|ErrorInfo {
    error? cause = 'error.cause();
    log:KeyValues keyValuesWithCause = keyValues;
    if cause is error {
        keyValuesWithCause["cause"] = cause.toString();
    } else {
        foreach [string, value:Cloneable & readonly] [key, detail] in 'error.detail().entries() {
            if detail is string {
                keyValuesWithCause[key] = detail.toString();
            }
        }
    }
    if level == ERROR {
        log:printError(message, 'error, keyValues = keyValuesWithCause);
    } else {
        log:printWarn(message, 'error, keyValues = keyValuesWithCause);
    }
    if code == LLM_CONNECTION {
        return {
            level,
            message,
            code
        };
    }
    return {
        body: {
            level,
            message,
            code
        }
    };
}
