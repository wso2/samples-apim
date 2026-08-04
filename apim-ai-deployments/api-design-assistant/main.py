"""
  Copyright (c) 2024, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.

  This software is the property of WSO2 LLC. and its suppliers, if any.
  Dissemination of any information or reproduction of any material contained
  herein is strictly forbidden, unless permitted by WSO2 in accordance with
  the WSO2 Commercial License available at http://wso2.com/licenses.
  For specific language governing the permissions and limitations under
  this license, please see the license as well as any agreement you’ve
  entered into with WSO2 governing the purchase of this software and any
"""
import redis
import asyncio
import json
import yaml
from fastapi import FastAPI, Header
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from prompts import (
    check_user_input_validity,
    identify_api_type,
    check_for_spec_generation_request,
    answer_general_question,
    generate_openapi_spec,
    regenerate_openapi_spec,
    generate_graphql_spec,
    generate_asyncapi_spec
)
from config import r, get_llm
from graphql import parse, validate, build_schema, GraphQLError

app = FastAPI(
    title="WSO2 APIM API Design Assistant",
    description="Backend for WSO2 APIM API Design Assistant",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["POST"],
    allow_headers=["*"]
)

class TokenUsage:
    """
    Tracks token consumption across LLM (Large Language Model) invocations.
    Attributes:
        prompt_tokens (int): The number of tokens used in the prompt.
        completion_tokens (int): The number of tokens generated in the completion.
        total_tokens (int): The total number of tokens used (prompt + completion).
    Methods:
        add_usage(response): Updates token usage statistics based on the response
        from the LLM, which includes usage details.
    """
    def __init__(self):
        self.prompt_tokens = 0
        self.completion_tokens = 0 
        self.total_tokens = 0
    
    def add_usage(self, token_usage):
        # OpenAI responses include usage statistics
        self.prompt_tokens += token_usage.prompt_tokens
        self.completion_tokens += token_usage.completion_tokens
        self.total_tokens += token_usage.total_tokens

# Defines the expected structure of incoming JSON payloads to the chat endpoint
class ChatInput(BaseModel):
    text: str
    sessionId: str


# Validates the JSON payload
async def validate_user_input(data: dict):
    """
    Validates the user input JSON payload for required fields.

    Args:
        data (dict): The request body containing user input.

    Returns:
        tuple: A tuple of (response: dict, status_code: int)
            - If validation fails, returns an error message and appropriate HTTP status code.
            - If validation passes, returns (None, 200).
    """
    if not data:
        return {"error": "Request body must be in JSON format."}, 415
    if 'text' not in data or not data['text'].strip():
        return {"error": "Please provide the details of the API you would like to create."}, 400
    if 'sessionId' not in data or not data['sessionId'].strip():
        return {"error": "Please enter a Session ID."}, 400
    return None, 200


# Retry logic for Redis operations
async def retry_redis_operation(func, *args, max_retries=3, delay=2, **kwargs):
    """
    Executes a Redis operation with retry logic in case of connection failures.

    Parameters:
        func (Callable): The Redis operation to execute.
        *args: Positional arguments to pass to the Redis operation.
        max_retries (int): Maximum number of retry attempts.
        delay (int or float): Delay (in seconds) between retries.
        **kwargs: Keyword arguments to pass to the Redis operation.

    Returns:
        Result of the Redis operation if successful.

    Raises:
        Exception: If the operation fails after the maximum number of retries.
    """
    retries = 0
    while retries < max_retries:
        try:
            return await func(*args, **kwargs)
        except redis.exceptions.ConnectionError as e:
            retries += 1
            if retries >= max_retries:
                raise Exception(f"Redis operation failed after {max_retries} retries due to: {e}")
            # Waits for 2 seconds before retrying
            await asyncio.sleep(delay)


# Retrieves data stored in Redis for a given session ID
async def get_task_data(session_id):
    """
    Retrieves task-related data from Redis for the specified session ID.

    If no data exists for the session ID, a default structure is returned.

    Args:
        session_id (str): The session ID used as the Redis key.

    Returns:
        dict: A dictionary containing task state, chat history, specification, API type, and paths.
    """
    async def redis_get():
        task_data = await r.get(session_id)
        return json.loads(task_data) if task_data else {
            "state": "START",
            "chat_history": [],
            "specification": "",
            "api_type": "",
            "paths": ['No resources']
        }
    
    return await retry_redis_operation(redis_get)


# Updates data stored in Redis for a given session ID  
async def update_task_data(session_id, state=None, chat_history=None, specification=None, api_type=None, paths=None):
    """
    Updates task-related data in Redis for the specified session ID.

    Only the fields provided (non-None) are updated. The updated data is set to expire after 15 minutes.

    Args:
        session_id (str): The session ID used as the Redis key.
        state (str, optional): New task state.
        chat_history (list, optional): Updated chat history.
        specification (str, optional): Updated API specification.
        api_type (str, optional): Type of API (e.g., REST, GraphQL).
        paths (list, optional): List of resource paths.

    Returns:
        None
    """
    async def redis_set():
        task_data = await get_task_data(session_id)
        if state: 
            task_data["state"] = state
        if chat_history is not None: 
            task_data["chat_history"] = chat_history
        if specification is not None: 
            task_data["specification"] = specification
        if api_type is not None: 
            task_data["api_type"] = api_type
        if paths is not None: 
            task_data["paths"] = paths
        
        await r.setex(session_id, 900, json.dumps(task_data))
    
    await retry_redis_operation(redis_set)


# Invokes LLM and handles errors
async def async_llm_invoke(llm, prompt, token_usage: TokenUsage, max_retries=3, delay=2):
    """
    Asynchronously invokes the LLM with the given prompt, retrying on failure.

    Retries are triggered for rate limiting, timeout, or connection errors.

    Args:
        prompt (str): The prompt to send to the LLM.
        max_retries (int): Maximum number of retry attempts.
        delay (int): Delay in seconds between retries.

    Returns:
        Any: The response from the LLM if successful.

    Raises:
        Exception: If all retries fail, an exception with the final error is raised.
    """
    retries = 0
    while retries < max_retries:
        try:
            response = await llm.ainvoke(prompt)
            
            # Extract usage metadata if available
            if hasattr(response, 'usage_metadata') and response.usage_metadata:
                usage = response.usage_metadata
                token_usage.add_usage(type('TokenUsage', (), {
                    'prompt_tokens': usage.get('input_tokens', 0),
                    'completion_tokens': usage.get('output_tokens', 0),
                    'total_tokens': usage.get('total_tokens', 0)
                })())

            

            # Extract text content from AIMessage
            if hasattr(response, 'content'):
                # Handle list of content blocks
                if isinstance(response.content, list):
                    text_content = ""
                    for block in response.content:
                        if isinstance(block, dict) and block.get('type') == 'text':
                            text_content += block.get('text', '')
                    return text_content
                # Handle string content
                elif isinstance(response.content, str):
                    return response.content

            return str(response)
        except Exception as e:
            retries += 1
            if retries >= max_retries:
                raise Exception(f"Failed after {max_retries} retries due to: {e}")
            await asyncio.sleep(delay)

# Invokes LLM to check user's query's validity
async def validate_query_content(llm, user_input, chat_history, token_usage: TokenUsage):
    prompt = check_user_input_validity.format(user_input=user_input, chat_history=chat_history)
    response = await async_llm_invoke(llm, prompt, token_usage)
    return response.strip()


# Invokes LLM to suggest a type of API for the given use case
async def suggest_api_type(llm, user_input, chat_history, token_usage: TokenUsage):
    prompt = identify_api_type.format(user_input=user_input, history=chat_history)
    response = await async_llm_invoke(llm, prompt, token_usage)
    return response.strip()


# Invokes LLM to check user's query if spec generation is requested
async def check_for_spec_gen_request(llm, user_input, chat_history, specification, token_usage: TokenUsage):
    prompt = check_for_spec_generation_request.format(user_input=user_input, chat_history=chat_history, specification=specification)
    response = await async_llm_invoke(llm, prompt, token_usage)
    return response.strip()


# Invokes LLM to answer user's general question
async def form_answer_general_question(llm, user_input, chat_history, specification, token_usage: TokenUsage):
    prompt = answer_general_question.format(user_input=user_input, chat_history=chat_history, specification=specification)
    response = await async_llm_invoke(llm, prompt, token_usage)
    return response.strip()


# Invokes LLM to generate the spec according to API type and provided information
async def generate_spec(llm, api_type, final_input, chat_history, token_usage: TokenUsage, specification=None, schema_validation_error=None, attempt=1, max_attempts=10):
    """
    Generates an API specification using an LLM based on the given API type and user input.

    Args:
        api_type (str): The type of API (e.g., "REST", "GraphQL", "WebSocket", etc.).
        final_input (str): The processed user input/query.
        chat_history (str): Chat history for conversational context.
        specification (str, optional): Existing spec to refine or use for context.
        schema_validation_error (Exception, optional): Previous validation error (if retrying).
        attempt (int, optional): Current retry attempt.
        max_attempts (int, optional): Maximum allowed retry attempts.

    Returns:
        tuple: (generated_spec: str, resources: list, chat_response: str)
    """
    try:
        # Map each api_type to its corresponding prompt template
        template_map = {
            "REST": generate_openapi_spec,          # Generates OpenAPI Spec when api_type is "REST"
            "GraphQL": generate_graphql_spec,       # Generates GraphQL Schema Definition when api_type is "GraphQL"
            "WebSocket": generate_asyncapi_spec,    # Generates AsyncAPI Definition when api_type is either "WebSocket" or "WebSub" or "SSE"
            "WebSub": generate_asyncapi_spec,
            "SSE": generate_asyncapi_spec,
        }

        # Default to generating OpenAPI Spec if api_type not in the map
        template = template_map.get(api_type, generate_openapi_spec)

        prompt = template.format(
            api_type=api_type,
            final_input=final_input,
            history=chat_history,
            specification=specification,
            schema_validation_error=schema_validation_error
        )

        llm_response = await async_llm_invoke(llm, prompt, token_usage)
        answer_text = llm_response.strip()

        # Strip code block markers (```json ... ``` or ``` ... ```)
        cleaned_answer_text = answer_text.strip()
        if cleaned_answer_text.startswith("```"):
            cleaned_answer_text = cleaned_answer_text.split("\n", 1)[-1]
            if cleaned_answer_text.endswith("```"):
                cleaned_answer_text = cleaned_answer_text.rsplit("```", 1)[0]
            cleaned_answer_text = cleaned_answer_text.strip()
        try:
            data = json.loads(cleaned_answer_text)
        except json.JSONDecodeError as e:
            if attempt < max_attempts:
                # Regenerates spec if there is a JSON error when parsing
                return await generate_spec(api_type, final_input, chat_history, token_usage, None, e, attempt + 1)
            return "Failed to parse LLM response as JSON.", ['No Resources'], "Apologies for the inconvenience. It seems that something went wrong with the API Design Assistant. Please try again."

        # Extracts the spec, resoures list and chat response
        generated_spec = data.get("generated_spec", "")
        resources = data.get("resources", [])
        chat_response = data.get("chat_response", "")


        # Validates YAML format in the OpenAPI Spec and AsyncAPI Definition
        if api_type != "GraphQL":
            try:
                yaml.safe_load(generated_spec)
            except yaml.YAMLError as e:
                if attempt < max_attempts:
                    # Regenerates spec if there is a YAML validation error
                    return await generate_spec(api_type, final_input, chat_history, token_usage, None, e, attempt + 1)
                return generated_spec, ['No Resources'], "Apologies for the inconvenience. It seems that something went wrong with the API Design Assistant. Please try again."
        
        # Performs GraphQL schema validation for the GraphQL Schema Definition
        else:
            try:
                # Builds a GraphQL schema from the generated specification string
                schema = build_schema(generated_spec)

                # Validate the schema by executing a simple introspection query (`__typename`) to ensure it is syntactically and semantically correct
                validate(schema, parse("{ __typename }"))
            except (GraphQLError, Exception) as e:
                if attempt < max_attempts:
                    # Regenerates spec if there is a GraphQL schema validation error
                    return await generate_spec(api_type, final_input, chat_history, token_usage, None, e, attempt + 1)
                return generated_spec, ['No Resources'], "Apologies for the inconvenience. It seems that something went wrong with the API Design Assistant. Please try again."

        # Returns spec, resources and chat response successfully
        return generated_spec, resources, chat_response

    except Exception:
        return "Unexpected error during generation.", ['No Resources'], "Apologies for the inconvenience. It seems that something went wrong with the API Design Assistant. Please try again."


# Invokes LLM to generate the spec according to API type and provided information
async def regenerate_spec_method(llm, final_input, token_usage: TokenUsage, specification=None, schema_validation_error=None, attempt=1, max_attempts=10):
    """
    Regenerates an API specification using an LLM based on the previous governance validation errors.

    Args:
        final_input (str): The processed governance validation errors.
        specification (str, optional): Existing spec to refine or use for context.
        schema_validation_error (Exception, optional): Previous validation error (if retrying).
        attempt (int, optional): Current retry attempt.
        max_attempts (int, optional): Maximum allowed retry attempts.

    Returns:
        regenerated_spec: str
    """
    try:
        prompt = regenerate_openapi_spec.format(
            final_input=final_input,
            specification=specification,
            schema_validation_error=schema_validation_error
        )

        llm_response = await async_llm_invoke(llm, prompt, token_usage)
        answer_text = llm_response.strip()

        # Parses LLM response as JSON so the spec, resoures list and chat response can be extracted
        try:
            data = json.loads(answer_text)
        except json.JSONDecodeError as e:
            if attempt < max_attempts:
                # Regenerates spec if there is a JSON error when parsing
                return await regenerate_spec_method(final_input, token_usage, None, e, attempt + 1)
            return "Failed to parse LLM response as JSON.", ['No Resources'], "Apologies for the inconvenience. It seems that something went wrong with the API Design Assistant. Please try again."


        # Extracts the spec, resoures list and chat response
        regenerated_spec = data.get("regenerated_spec", "")

        # Returns spec, resources and chat response successfully
        return regenerated_spec

    except Exception:
        return "Unexpected error during generation.", ['No Resources'], "Apologies for the inconvenience. It seems that something went wrong with the API Design Assistant. Please try again."


# Chat Endpoint generates the API specifications and other related details
@app.post("/chat")
async def generate(request: ChatInput, x_jwt_assertion: str = Header(None)):
    """
    Handles POST requests to the /chat endpoint for generating API specifications.

    This endpoint performs the following:
    - Validates the incoming JSON payload for required fields (`text`, `sessionId`)
    - Retrieves session-specific data from Redis (e.g., chat history, spec, paths)
    - Analyzes the user input to determine if it's a greeting, irrelevant text, or an API-related query
    - If it's a valid API request, either generates an API specification or provides a relevant response
    - Updates Redis with the current session state, including updated chat history and specification
    - Returns a structured response including the generated API specification

    Args:
        request (Request): The incoming HTTP request containing a JSON body with `text` and `sessionId`.

    Returns:
        Tuple[dict, int]: A response dictionary with keys such as:
            - `backendResponse`: Reserved for future backend-generated content (currently always None)
            - `isSuggestions`: Indicates if the response is a suggestion
            - `typeOfApi` / `api_type`: The determined or selected API type (e.g., REST, GraphQL)
            - `code` / `specification`: The generated OpenAPI specification if available
            - `paths`: List of resource paths extracted/generated
            - `apiTypeSuggestion`: Suggestion or response message from LLM
            - `missingValues`: Placeholder for missing values in spec generation
            - `state`: Session state, typically "COMPLETE" if an API spec was successfully generated

        HTTP status code: 200 for success, or other status codes returned by `validate_user_input`.
    """
    # Convert Pydantic model to dict
    data = request.dict()

    # Validates the JSON payload
    error_response, status_code = await validate_user_input(data)
    if status_code != 200:
        return error_response, status_code

    # Extracts text and session ID from the JSON payload
    user_input = data["text"].strip()
    session_id = data["sessionId"].strip()

    # Retrieves data stored in Redis for a given session ID and extracts the api type, specification, paths and chat history
    task_data = await get_task_data(session_id)
    api_type = task_data.get("api_type", "")
    specification = task_data.get("specification", "")
    paths = task_data.get("paths", [])
    chat_history = task_data.get("chat_history", [])

    token_usage = TokenUsage()

    # Use context manager for automatic cleanup of LLM client
    llm = get_llm(x_jwt_assertion)
    try:
        # Determines whether the user's query is a greeting, nonsensical input or an API related prompt
        validation_response = await validate_query_content(llm, user_input, chat_history, token_usage)

        # Returns response when user's query is a greeting or nonsensical input
        if validation_response != 'API prompt':
            chat_history += [
                {"user_input": user_input},
                {"response to above user_input": validation_response}
            ]
            await update_task_data(session_id, chat_history=chat_history)

            return {
                "backendResponse": None,
                "isSuggestions": False,
                "typeOfApi": api_type if specification else '',
                "code": specification if specification else '',
                "paths": paths if specification else ['No Resources'],
                "apiTypeSuggestion": validation_response,
                "missingValues": None,
                "state": "COMPLETE" if specification else None,
                "usage": {
                    "prompt_tokens": token_usage.prompt_tokens,
                    "completion_tokens": token_usage.completion_tokens,
                    "total_tokens": token_usage.total_tokens
                }
            }
            

        # Determines whether the user's API related prompt requests for an API specification generation
        is_spec_generation_requested = await check_for_spec_gen_request(llm, user_input, chat_history, specification, token_usage)

        # Response template
        response = {
            "backendResponse": None,
            "isSuggestions": False,
            "missingValues": None
        }

        # Generates API spec and other details when user's prompt requests for an API specification generation
        if is_spec_generation_requested == "spec generation required":
            # Invokes LLM to suggest a suitable API type for the given use case and saves it in chat history
            chat_history += [{"user_input": user_input}, {"API TYPE": f"Create this type of API: {api_type}"}]
            api_type = await suggest_api_type(llm, user_input, chat_history, token_usage)
            chat_history += [{"user_input": user_input}, {"API TYPE": f"Create this type of API: {api_type}"}]

            # Invokes LLM to generate the API spec, paths and chat response according to the provided information
            specification, paths, chat_response = await generate_spec(llm, api_type, user_input, chat_history, token_usage, specification)

            # Adds specification, paths, api type and chat response to the response template
            response["apiTypeSuggestion"] = chat_response
            response["paths"] = paths
            response["typeOfApi"] = api_type
            response["code"] = specification

        # Generates an answer for user's prompt when it does not request for an API specification generation
        else:
            answer = await form_answer_general_question(llm, user_input, chat_history, specification, token_usage)
            # Saves response to chat history and response template
            chat_history += [{"user's general question": user_input}, {"response to user's general question": answer}]
            response["apiTypeSuggestion"] = answer

        # Handles suitations when chat response is empty
        if not response.get("apiTypeSuggestion"):
            response["apiTypeSuggestion"] = "Apologies for the inconvenience. It seems that something went wrong with the API Design Assistant. Please try again with more detailed requirements."

        # Set response state to "COMPLETE" only if a valid specification was generated
        response["state"] = "COMPLETE" if specification else None

        # Updates Redis with data if the session state is "COMPLETE"
        if response["state"] == "COMPLETE":
            await update_task_data(session_id, chat_history=chat_history, api_type=api_type, specification=specification, paths=paths, state="COMPLETE")

        response["usage"] = {
            "prompt_tokens": token_usage.prompt_tokens,
            "completion_tokens": token_usage.completion_tokens, 
            "total_tokens": token_usage.total_tokens
        }
        
        # Returns response successfully
        return response
    finally:
        # Close the LLM client session to prevent unclosed connection warnings
        if hasattr(llm, 'aclose'):
            await llm.aclose()


@app.post("/regenerate-spec")
async def regenerate_spec(body: ChatInput, x_jwt_assertion: str = Header(None)):
    # Convert Pydantic model to dict
    data = body.dict()

    # Validate user input
    error_response, status_code = await validate_user_input(data)
    if status_code != 200:
        return JSONResponse(content=error_response, status_code=status_code)

    # Extract values
    user_input = data["text"].strip()
    session_id = data["sessionId"].strip()

    # Retrieve task data from Redis
    task_data = await get_task_data(session_id)
    specification = task_data.get("specification", "")
    token_usage = TokenUsage()

    llm = get_llm(x_jwt_assertion)
    try:
        # Call LLM to regenerate new spec
        specification = await regenerate_spec_method(llm, user_input, token_usage, specification)

        # Updates Redis with data 
        await update_task_data(session_id, specification=specification)

        # Return final response
        return {
            "regeneratedSpec": specification,
            "usage": {
                "prompt_tokens": token_usage.prompt_tokens,
                "completion_tokens": token_usage.completion_tokens,
                "total_tokens": token_usage.total_tokens
            }
        }
    finally:
        # Close the LLM client session to prevent unclosed connection warnings
        if hasattr(llm, 'aclose'):
            await llm.aclose()
