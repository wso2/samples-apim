# -------------------------------------------------------------------------------------
#
# Copyright (c) 2024, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
#
# This software is the property of WSO2 LLC. and its suppliers, if any.
# Dissemination of any information or reproduction of any material contained
# herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
# You may not alter or remove any copyright or other notice from copies of this content.
#
# --------------------------------------------------------------------------------------

import os
from typing import List, Tuple
import json
from typing import Optional, Any
from langchain_openai import AzureChatOpenAI, AzureOpenAIEmbeddings
from operator import itemgetter
from fastapi import FastAPI, Header
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder, PromptTemplate
from langchain_core.output_parsers import StrOutputParser, BaseOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_core.runnables import RunnableParallel
from langchain.callbacks import get_openai_callback
from langchain_core.documents import Document
import asyncio
from pydantic import BaseModel
import requests

from functools import partial
from functools import lru_cache
from cachetools import cached, TTLCache
from typing import AsyncGenerator, Literal

from langchain_azure_ai.embeddings import AzureAIEmbeddingsModel
from azure.core.credentials import AzureKeyCredential
from langchain_community.vectorstores import Milvus
from langchain.retrievers.multi_query import MultiQueryRetriever

from app.constants import *
import jwt
from app.prompts import qa_system_prompt_choreo_stream, qa_system_prompt_choreo, qa_system_prompt_apim, \
    query_prompt_template, context_q_system_prompt

api = FastAPI(
    title="API Marketplace Chatbot",
    version="0.1.0",
)

# TODO: implement debug logging switch
collection_name = os.getenv("COLLECTION_NAME")


# request input format
class Query(BaseModel):
    query: str
    history: list
    tenant_domain: Optional[str] = None
    user_roles: str


class ChoreoQuery(BaseModel):
    questions: list
    history: Optional[list]
    # tenant_domain: Optional[str] = None


class ChoreoResponse(BaseModel):
    content: str
    usage: dict


class QuerySSEResponse(BaseModel):
    type: Literal["start", "streaming", "end", "error"]
    value: str


class MilvusProxy(Milvus):
    def __init__(self, embeddings, proxy_connection, collection_name, text_field, metadata_field, org_id):
        self.embedding_func = embeddings
        self.collection_name = collection_name
        self.proxy_connection = proxy_connection
        self.text_field = text_field
        self.metadata_field = metadata_field
        self.timeout: Optional[float] = 10000
        self.consistency_level: str = "Session"
        self.search_params: Optional[str] = ""
        self.drop_old: Optional[bool] = False
        self.auto_id: bool = False
        self.primary_field: str = "pk"
        self.text_field: str = "text"
        self.vector_field: str = "vector"
        self.replica_number: int = 1
        self.fields: list[str] = OUTPUT_FIELDS
        self.org_id = org_id

        self._embeddings = None
        self._vector_field = ''
        self._text_field = 'page_content'
        self._metadata_field = 'metadata'

    @property
    def embeddings(self):
        return self._embeddings

    @embeddings.setter
    def embeddings(self, value):
        self._embeddings = value

    def similarity_search(
            self,
            query: str,
            k: int = 4,
            expr: Optional[str] = None,
            timeout: Optional[float] = None,
            **kwargs: Any,
    ) -> List[Document]:

        timeout = self.timeout or timeout
        embedding = self.embedding_func.embed_query(query)
        res = self.similarity_search_with_score_by_vector(
            embedding=embedding, k=k, expr=expr, timeout=timeout, **kwargs
        )
        return [doc for doc, _ in res]

    def similarity_search_with_score_by_vector(
            self,
            embedding: List[float],
            k: int = 4,
            expr: Optional[str] = None,
            timeout: Optional[float] = None,
    ) -> List[Tuple[Document, float]]:

        # Determine result metadata fields with PK.
        output_fields = self.fields
        timeout = self.timeout or timeout

        endpoint_url = f"{self.proxy_connection['uri']}/search"
        # headers = {'x-jwt-assertion': self.proxy_connection["token"], "org-id": self.org_id}
        headers = {'Authorization': self.proxy_connection["token"], "org-id": self.org_id}
        res = requests.post(endpoint_url,
                            headers=headers,
                            json={
                                "data": [embedding],
                                "anns_field": self._vector_field,
                                "limit": k,
                                "expr": expr,
                                "output_fields": output_fields,
                                "timeout": timeout,
                                "collection_name": self.collection_name
                            })

        ret = []
        for result in res.json()[0]:
            data = {x: result.get('entity').get(x) for x in output_fields}
            doc = self._parse_document(data)
            pair = (doc, result.get('distance'))
            ret.append(pair)

        return ret


@cached(cache=TTLCache(maxsize=2, ttl=PROXY_HEALTH_CHECK_CACHE_TTL))
def validate_endpoint(endpoint: str) -> bool:
    try:
        response = requests.options(endpoint, timeout=2)
        return response.status_code < 300
    except:
        return False

def _get_org_id_key(x_jwt_assertion: str):
    """Extract org_id from JWT assertion to use as cache key"""
    payload = jwt.decode(x_jwt_assertion, options={"verify_signature": False})
    aud = payload.get("aud")
    return aud[0]

@cached(cache=TTLCache(maxsize=TOKEN_CACHE_SIZE, ttl=TOKEN_CACHE_TTL), key=_get_org_id_key)
def exchange_assertion_for_api_key(x_jwt_assertion: str):
    headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    }
    data = {
        "subject_token_type": "urn:ietf:params:oauth:token-type:jwt",
        "subject_token": x_jwt_assertion,
        "requested_token_type": "urn:ietf:params:oauth:token-type:access_token",
        "grant_type": "urn:ietf:params:oauth:grant-type:token-exchange",
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET
    }
    response = requests.post(TOKEN_ENDPOINT_URL, headers=headers, data=data)
    response.raise_for_status()
    return response.json().get("access_token")

def get_llm(x_jwt_assertion: str = None):
    """
    Get LLM client with automatic fallback from proxy to direct connection.
    If proxy is enabled but fails, it will automatically fallback to direct connection.
    """
    if USE_PROXY:
        api_key = exchange_assertion_for_api_key(x_jwt_assertion)
        if validate_endpoint(AZURE_CHAT_PROXY_ENDPOINT + "/openai/responses?api-version=2025-04-01-preview"):
            return AzureChatOpenAI(
                azure_endpoint=AZURE_CHAT_PROXY_ENDPOINT,
                azure_deployment=AZURE_CHAT_DEPLOYMENT,
                api_key=api_key,
                api_version=AZURE_CHAT_VERSION,
                output_version="responses/v1"
            )
        else:
            print(f"Warning: Proxy endpoint {AZURE_CHAT_PROXY_ENDPOINT} is not reachable, falling back to direct connection.")

    return AzureChatOpenAI(
        azure_endpoint=AZURE_ENDPOINT,
        azure_deployment=AZURE_CHAT_DEPLOYMENT,
        api_key=AZURE_API_KEY,
        api_version=AZURE_CHAT_VERSION,
        output_version="responses/v1"
    )

def get_embeddings(x_jwt_assertion: str = None):
    if USE_PROXY:
        if validate_endpoint(AZURE_EMBEDDING_PROXY_ENDPOINT + "/embeddings?api-version=2025-01-01-preview"):
            api_key = exchange_assertion_for_api_key(x_jwt_assertion)
            return AzureAIEmbeddingsModel(
                endpoint=AZURE_EMBEDDING_PROXY_ENDPOINT,
                credential=AzureKeyCredential(api_key),
                model=AZURE_EMBEDDING_DEPLOYMENT,
            )
        else:
            print(f"Warning: Proxy endpoint {AZURE_EMBEDDING_PROXY_ENDPOINT} is not reachable, falling back to direct connection.")

    return AzureAIEmbeddingsModel(
        model=AZURE_EMBEDDING_DEPLOYMENT,
        credential=AzureKeyCredential(AZURE_API_KEY),
        endpoint=AZURE_ENDPOINT + "/openai/deployments/" + AZURE_EMBEDDING_DEPLOYMENT,
    )

def get_vectorstore(x_jwt_assertion: str = None) -> Milvus:
    """Get or create cached APIM vectorstore instance"""
    return Milvus(
        get_embeddings(x_jwt_assertion),
        connection_args={
            "uri": ZILLIZ_CLOUD_URI,
            "token": ZILLIZ_CLOUD_API_KEY,
            "secure": True,
        },
        collection_name=collection_name,
        text_field="page_content",
        metadata_field="metadata"
    )

@lru_cache()
def get_choreo_vectorstore(auth_token, org_id) -> Milvus:
    model_name = 'text-embedding-ada-002'
    embeddings = AzureOpenAIEmbeddings(
        model=model_name,
        azure_deployment=AZURE_EMBEDDING_DEPLOYMENT,
        azure_endpoint=AZURE_ENDPOINT,
        openai_api_type="azure",
    )

    vectorstore = MilvusProxy(
        embeddings,
        proxy_connection={
            "uri": PROXY_URL,
            "token": auth_token,
        },
        collection_name=collection_name,
        text_field="page_content",
        metadata_field="metadata",
        org_id=org_id
    )

    return vectorstore


def get_retriever(llm, tenant_domain, partition_id, auth_token=None, user_roles ='') -> MultiQueryRetriever:
    vectorstore = None
    # TODO: Try adding a Self Query retriever
    # Incorporate score based filtering mechanism once Milverse introduces it
    if SOURCE_PLATFORM == APIM:
        vectorstore = get_vectorstore(auth_token)

        if user_roles == '':
            retriever = vectorstore.as_retriever(search_type="similarity",
                                             search_kwargs={"k": 5,
                                                            "expr": 'key_id == "' + partition_id + '" && tenant_domain == "' + tenant_domain + '" && visibility_roles[0] == ""'})
        else:
            retriever = vectorstore.as_retriever(search_type="similarity",
                                             search_kwargs={"k": 5,
                                                            "expr": 'key_id == "' + partition_id + '" && tenant_domain == "' + tenant_domain + '" && ((visibility_roles[0] == "") || (array_contains_any(visibility_roles,'+user_roles+')))'})

    elif SOURCE_PLATFORM == CHOREO:
        vectorstore = get_choreo_vectorstore(auth_token, partition_id)
        retriever = vectorstore.as_retriever(search_type="similarity",
                                                search_kwargs={"k": 5, "expr": 'org_id == "' + partition_id + '"'})

    QUERY_PROMPT = PromptTemplate(
        input_variables=["question"],
        template=query_prompt_template,
    )

    class LineListOutputParser(BaseOutputParser[List[str]]):
        """Output parser for a list of lines."""

        def parse(self, text: str) -> List[str]:
            lines = text.strip().split("\n")
            return lines

    output_parser = LineListOutputParser()
    llm_chain = QUERY_PROMPT | llm | output_parser

    mq_retriever = MultiQueryRetriever(retriever=retriever, llm_chain=llm_chain, parser_key="lines")
    return mq_retriever


def format_docs(docs):
    if not docs:
        return ["No API information available!"]
    else:
        if SOURCE_PLATFORM == CHOREO:
            doc_string = ""
            for doc in docs:
                metadata = doc.metadata
                metadata.pop("api_uuid")
                metadata.pop("id")
                doc_string = "\n\n".join([doc_string, str({"api_details": doc.metadata, "api_spec": doc.page_content})])

            return doc_string

        else:
            return "\n\n".join([str({"api_details": doc.metadata, "api_spec": doc.page_content}) for doc in docs])


def prepare_rag_chain(tenant_domain: str, partition_id: str, stream=False, auth_token=None, user_roles = ''):

    contextualize_q_system_prompt = context_q_system_prompt
    contextualize_q_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", contextualize_q_system_prompt),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{question}"),
        ]
    )

    if SOURCE_PLATFORM == CHOREO:
        llm = AzureChatOpenAI(
            temperature=0.3,
            model_name="gpt-35-turbo",
            #     max_tokens=2048,
            deployment_name=AZURE_CHAT_DEPLOYMENT,
            api_version=AZURE_CHAT_VERSION,
            azure_endpoint=AZURE_ENDPOINT,
        )
        retriever = get_retriever(llm, tenant_domain, partition_id, auth_token)
        # Condition was added so if needed, we can add a separate prompt for streaming.
        if stream:
            qa_system_prompt = qa_system_prompt_choreo_stream
        else:
            qa_system_prompt = qa_system_prompt_choreo
    else:
        llm = get_llm(auth_token)
        retriever = get_retriever(llm, tenant_domain, partition_id, auth_token, user_roles)
        qa_system_prompt = qa_system_prompt_apim

    qa_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", qa_system_prompt),
            ("human", "{question}"),
        ]
    )

    _inputs = RunnableParallel(
        standalone_question=RunnablePassthrough.assign(
            chat_history=lambda x: x["chat_history"]
        )
                            | contextualize_q_prompt
                            | llm
                            | StrOutputParser(),
    )

    # def cond_input(input: dict):
    #     if input.get("chat_history"):
    #         return _inputs
    #     else:
    #         return input["question"]

    _context = {
        "context": itemgetter("standalone_question") | retriever | format_docs,
        "question": lambda x: x["standalone_question"],
    }
    rag_chain = _inputs | _context | qa_prompt | llm

    return rag_chain, llm


async def in_thread(func, *args):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, partial(func, *args))


async def prepare_history(history: list):
    return [(chat["role"], chat["content"]) for chat in history]


async def generate_response(
        user_roles: str, tenant_domain: str, message: str, history: list, partitionID: str, auth_token: str
):
    results = await asyncio.gather(
        in_thread(prepare_rag_chain, tenant_domain, partitionID, False, auth_token, user_roles),
        prepare_history(history),
    )
    rag_chain, llm = results[0]
    chat_history = results[1]

    try:
        with get_openai_callback() as cb:
                chain_response_raw = await rag_chain.ainvoke({
                    "question": message,
                    "chat_history": chat_history},
                    # config={
                    #     'callbacks': [ConsoleCallbackHandler()]
                    #     }
                )
                # chain_response_raw.content may be a list of blocks, extract text
                if hasattr(chain_response_raw, "content") and isinstance(chain_response_raw.content, list):
                    text_content = "".join(
                        block.get("text", "") for block in chain_response_raw.content if block.get("type") == "text"
                    )
                elif hasattr(chain_response_raw, "content") and isinstance(chain_response_raw.content, str):
                    text_content = chain_response_raw.content
                else:
                    text_content = str(chain_response_raw)
                chain_response = parse_json(text_content, cb)
        return chain_response
    finally:
        # Close the LLM client session to prevent unclosed connection warnings
        if hasattr(llm, 'aclose'):
            await llm.aclose()


async def generate_choreo_response(messages: list, org_id: str, auth_token: str):
    history = []
    response = ChoreoResponse(content="", usage={})
    results = await asyncio.gather(
        in_thread(prepare_rag_chain, None, org_id, False, auth_token),
        prepare_history(history),
    )

    rag_chain, _ = results[0]
    chat_history = results[1]

    questions = ""
    for message in messages:
        questions = f'{questions} {message} ? '

    with get_openai_callback() as cb:
        assist_response = (rag_chain.invoke({
            "question": questions,
            "chat_history": chat_history},
            # config={
            #     'callbacks': [ConsoleCallbackHandler()]
            # }
        ))

    assist_response_json = parse_choreo_json(assist_response.content, cb)
    response.content = create_str_markdown(assist_response_json["response"])
    response.usage = assist_response_json["usage"]

    return response


async def generate_sse_response(
        tenant_domain: str, message: str, history: list, org_id: str
) -> AsyncGenerator[str, QuerySSEResponse]:
    results = await asyncio.gather(
        in_thread(prepare_rag_chain, tenant_domain, org_id, True),
        prepare_history(history),
    )
    rag_chain, _ = results[0]
    chat_history = results[1]

    try:
        stage = START_STREAM
        api_buffer = ""
        async for token in rag_chain.astream({"question": message, "chat_history": chat_history}):
            if stage == START_STREAM:
                if "{" not in token.content:
                    yield token.content
                    continue
                stage = FIND_LLM_RESPONSE

            stage, response = await process_sse_response(stage, token.content)

            if not response:
                continue

            if stage == SEND_LLM_RESPONSE or stage == END_LLM_RESPONSE:
                yield response
                if stage == END_LLM_RESPONSE:
                    stage = FIND_API
                continue

            if stage == BUFFER_API:
                api_buffer = api_buffer + response

            if stage == SEND_API:
                if api_buffer != "":
                    api_buffer = api_buffer + response
                    stage = FIND_API
                    yield api_buffer
                api_buffer = ""
                continue

    except Exception as e:  # TODO: Add proper exception handling
        yield QuerySSEResponse(type="error", value=str(e)).json()


async def process_sse_response(stage, token_content):
    if stage == FIND_LLM_RESPONSE:
        if token_content.startswith("\":"):
            return SEND_LLM_RESPONSE, None

    elif stage == SEND_LLM_RESPONSE:
        if "\"," in token_content:
            head, sep, tail = token_content.partition(',')
            return END_LLM_RESPONSE, head

    elif stage == FIND_API:
        if "{" in token_content:
            head, sep, tail = token_content.partition('{')
            return BUFFER_API, "\n" + sep + tail
        else:
            return FIND_API, None

    elif stage == BUFFER_API and "}" in token_content:
        head, sep, tail = token_content.partition('}')
        return SEND_API, head + sep

    return stage, token_content

def parse_json(json_resp, token_usage):
    try:
        json_object = json.loads(json_resp)
        # Handle the case where the LLM responds with the key name instead of apiName
        if "name" in json_object:
            json_object["apiName"] = json_object["name"]
            del json_object["name"]
        json_object["usage"] = {
            "prompt_tokens": token_usage.prompt_tokens,
            "completion_tokens": token_usage.completion_tokens,
            "total_tokens": token_usage.total_tokens
        }
    except ValueError as e:
        return {
            "response": json_resp,
            "apis": [],
            "usage": {
                "prompt_tokens": token_usage.prompt_tokens,
                "completion_tokens": token_usage.completion_tokens,
                "total_tokens": token_usage.total_tokens
            }
        }
    return json_object


def parse_choreo_json(json_resp, token_usage):
    try:
        json_object = json.loads(json_resp)
        # todo get the correct token counts
        if "usage" not in json_object:
            json_object["usage"] = {
                "prompt_tokens": token_usage.prompt_tokens,
                "completion_tokens": token_usage.completion_tokens,
                "total_tokens": token_usage.total_tokens
            }
    except ValueError as e:
        return {"response": json_resp,
                "usage": {
                    "prompt_tokens": token_usage.prompt_tokens,
                    "completion_tokens": token_usage.completion_tokens,
                    "total_tokens": token_usage.total_tokens
                }
                }
    return json_object


def create_str_markdown(response):
    return "\n" + response


@api.post("/marketplace-assistant")
async def marketplace_assistant(request: Query, keyID: str, x_jwt_assertion: str = Header(None)):
    response = await generate_response(user_roles=request.user_roles, tenant_domain=request.tenant_domain, message=request.query,
                                       history=request.history, partitionID=keyID, auth_token=x_jwt_assertion)
    return response


@api.post("/choreo-marketplace-assistant")
async def marketplace_assistant(request: ChoreoQuery, orgID: str, Authorization: str = Header()):
    response = await generate_choreo_response(messages=request.questions, org_id=orgID, auth_token=Authorization)

    return response


@api.post("/marketplace-assistant/streaming")
async def marketplace_assistant_sse(
        request: Query, orgID: str
) -> StreamingResponse:
    return StreamingResponse(
        generate_sse_response(tenant_domain=request.tenant_domain, message=request.query, history=request.history,
                              org_id=orgID),
        media_type="text/event-stream",
    )


@api.get("/health")
def health():
    """Check the api is running"""
    return {"status": "Running"}
