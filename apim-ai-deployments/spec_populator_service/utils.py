import os
from langchain_openai import AzureOpenAIEmbeddings
import yaml
from dataclasses import dataclass
import re
from typing import List, Tuple, Union, Dict

azure_type = "azure"
azure_endpoint = os.getenv("AZURE_ENDPOINT")
api_key = os.getenv("AZURE_OPENAI_API_KEY")
azure_deployment = os.getenv("AZURE_DEPLOYMENT")


def get_emb_model():
    model_name = 'text-embedding-ada-002'

    embed = AzureOpenAIEmbeddings(
        model=model_name,
        azure_deployment=azure_deployment,
        api_key=api_key,
        azure_endpoint=azure_endpoint,
        openai_api_type=azure_type,
    )

    return embed


@dataclass
class API:
    id: str
    version: str
    type: str
    name: str
    spec: dict


@dataclass
class ChoreoAPI:
    id: str
    version: str
    type: str
    name: str
    spec: dict
    api_uuid: str

# because it might be needed in the future
@dataclass
class ReducedOpenAPISpec:
    title: str
    description: str
    # servers: List[dict]
    endpoints: List[Tuple[str, Union[str, None], dict]]


@dataclass
class ReducedGrapQLSDL:
    queries: str
    mutations: str
    subscriptions: str


class ReducedAsyncAPISpec:
    def __init__(self, title: str, description: str, channels: List[Tuple[str, str]]):
        self.title = title
        self.description = description
        self.channels = channels


async def reduce_asyncapi_spec(spec: Dict) -> ReducedAsyncAPISpec:
    """Simplify the AsyncAPI spec."""
    # Extract title and description
    title = spec.get("info", {}).get("title", "")
    description = spec.get("info", {}).get("description", "")

    # Extract channels with their descriptions
    channels = [
        (channel_name, channel.get("description", ""))
        for channel_name, channel in spec.get("channels", {}).items()
    ]

    return ReducedAsyncAPISpec(
        title=title,
        description=description,
        channels=channels
    )


async def reduce_openapi_spec(spec: dict) -> ReducedOpenAPISpec:
    """Simplify the spec. Aim is to have a smaller target for retrieval and more importantly, a smaller results from retrieval."""
    # 1. Consider only get, post, patch, delete endpoints.
    endpoints = [
        (f"{operation_name.upper()} {route}",
         docs.get("description") if docs.get("description") != None else docs.get("summary"), docs)
        for route, operation in spec["paths"].items()
        for operation_name, docs in operation.items()
        if operation_name in ["get", "post", "patch", "delete", "put"]
    ]
    endpoints = [f"{endpoint[0]} {endpoint[1].split('.')[0] if endpoint[1] is not None else ''}" for endpoint in
                 endpoints]
    return ReducedOpenAPISpec(
        title=spec["info"].get("title", ""),
        description=spec["info"].get("description", ""),
        # servers=spec.get("servers"),
        #         licence=spec["info"].get("licence", "").get("name", ""),
        endpoints=endpoints,
    )


async def reduce_graphql_schema(schema_text):
    # Remove white spaces
    schema_text = re.sub(r'\s+', ' ', schema_text)

    # Extract queries, mutations, and subscriptions
    queries = re.findall(r'type Query {([^}]*)', schema_text)
    mutations = re.findall(r'type Mutation {([^}]*)', schema_text)
    subscriptions = re.findall(r'type Subscription {([^}]*)', schema_text)

    final_schema = {}
    if queries:
        final_schema["Queries"] = queries[0]
    if mutations:
        final_schema["Mutations"] = mutations[0]
    if subscriptions:
        final_schema["Subscriptions"] = subscriptions[0]
    return final_schema


async def pre_process_openapi(api_spec):
    api_spec_dict = yaml.safe_load(api_spec)

    api_spec = await reduce_openapi_spec(api_spec_dict)
    record = api_spec.__dict__

    return record


async def pre_process_graphql_sdl(sdl_schema):
    schema = await reduce_graphql_schema(sdl_schema)
    return schema


async def pre_process_asyncapi_def(async_spec):
    api_spec_dict = yaml.safe_load(async_spec)

    api_spec = await reduce_asyncapi_spec(api_spec_dict)
    record = api_spec.__dict__

    return record
