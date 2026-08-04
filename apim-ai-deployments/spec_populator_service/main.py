import logging

from fastapi import FastAPI, HTTPException
from typing import Dict, Any, Optional
import asyncio
from functools import partial
import os
from log_filters import EndpointFilter

from pymilvus import MilvusClient

from milvus import upsert_vector_for_onprem, upsert_vector_for_choreo, delete_vector, \
    upsert_bulk_vector_for_onprem, get_vector_count_for_org, get_vector_count_for_key, delete_bulk_vector_for_onprem, delete_vectors_for_all_tenants_onprem, delete_vector_for_choreo, \
    upsert_bulk_vector_for_choreo, delete_org_wise_vectors_for_choreo
from utils import get_emb_model, pre_process_openapi, pre_process_graphql_sdl, \
    pre_process_asyncapi_def, API, ChoreoAPI

import constants as const

embed = get_emb_model()
source = os.getenv(const.SOURCE_PLATFORM, const.APIM)
api_key = os.getenv(const.MILVERSE_API_KEY)
url = os.getenv(const.MILVERSE_URL)

excluded_org_list = os.getenv(const.EXCLUDED_ORG_LIST, "").split(",")

app = FastAPI()

# Setting log levels
log_level = os.getenv('LOG_LEVEL', logging.INFO)
logging.basicConfig(level=log_level)
for logger_name in logging.root.manager.loggerDict:
    logging.getLogger(logger_name).setLevel(log_level)

logging.getLogger("uvicorn.access").addFilter(EndpointFilter(const.EXCLUDED_ENDPOINTS))


async def get_pre_processed_spec(api_details):
    api_type = api_details[const.API_TYPE]
    if api_type == const.APIPRODUCT:
        api_type = const.HTTP
        record = await pre_process_openapi(api_details[const.API_SPEC])
    elif api_type == const.REST or api_type == const.HTTP or api_type == const.SOAP or api_type == const.SOAPTOREST:
        record = await pre_process_openapi(api_details[const.API_SPEC])
    elif api_type == const.GRAPHQL:
        record = await pre_process_graphql_sdl(api_details["sdl_schema"])
    elif api_type == const.ASYNC or api_type == const.WS or api_type == const.WEBSUB or api_type == const.SSE or api_type == const.WEBHOOK:
        record = await pre_process_asyncapi_def(api_details["async_spec"])

    record[const.APIM_DESCRIPTION] = api_details[const.DESCRIPTION]
    api = API(
        id=api_details[const.UUID],
        # The actual version is used instead of what is in the Spec,
        # since we know this is the truth, and the spec version can be outdated
        version=api_details[const.API_VERSION],
        type=api_type,
        name=api_details[const.API_NAME],
        spec=record
    )
    return api


async def get_pre_processed_choreo_spec(api_details):
    api_type = api_details[const.API_TYPE]
    if api_type == const.REST:
        record = await pre_process_openapi(api_details[const.API_SPEC])
    else:
        logging.info(f'Cannot process {api_type} APIs')
        return

    record[const.APIM_DESCRIPTION] = api_details[const.DESCRIPTION]
    api = ChoreoAPI(
        id=api_details['uuid'],
        # The actual version is used instead of what is in the Spec,
        # since we know this is the truth, and the spec version can be outdated
        version=api_details[const.API_VERSION],
        type=api_details[const.API_TYPE],
        name=api_details[const.API_NAME],
        spec=record,
        api_uuid=api_details[const.API_UUID]
    )

    return api


@app.post("/add_vector/{uuid}")
async def add_vector(uuid: str, req: Dict[str, Any], orgID: str, keyID: Optional[str] = None):
    mc = MilvusClient(uri=url, token=api_key)
    try:
        # TODO: Handle 400 error if request info not sufficient (eg: no KeyID)
        if source == const.APIM:
            api = await get_pre_processed_spec(req)

            loop = asyncio.get_event_loop()

            if "visibility_roles" in req:
                response = await loop.run_in_executor(None, partial(upsert_vector_for_onprem, mc, embed, orgID, keyID, api,
                                                                    req["tenant_domain"],req["visibility_roles"].split(",")))
            else:
                response = await loop.run_in_executor(None, partial(upsert_vector_for_onprem, mc, embed, orgID, keyID, api,
                                                                req["tenant_domain"]), [''])

        elif source == const.CHOREO:
            if orgID in excluded_org_list:
                logging.info("Organization has opted out of AI features, org-id: " + orgID)
                return {const.MESSAGE: "Organization has opted out of AI features, org-id: " + orgID}

            # TODO: Implement for APIs other that REST
            api_type = req[const.API_TYPE]
            if api_type == const.REST:
                record = await pre_process_openapi(req[const.API_SPEC])
            else:
                message = f'Cannot process {api_type} APIs'
                logging.info(message)
                return {const.MESSAGE: message}

            record[const.APIM_DESCRIPTION] = req[const.DESCRIPTION]
            api = ChoreoAPI(
                id=uuid,
                # The actual version is used instead of what is in the Spec,
                # since we know this is the truth, and the spec version can be outdated
                version=req[const.API_VERSION],
                type=req[const.API_TYPE],
                name=req[const.API_NAME],
                spec=record,
                api_uuid=req[const.API_UUID]
            )
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, partial(upsert_vector_for_choreo, mc, embed, orgID, api))

        return {const.MESSAGE: response}
    except Exception as e:
        logging.error(f"An error occurred while adding a vector: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        mc.close()


@app.post("/add_bulk_vector_choreo")
async def add_bulk_vector_choreo(request: Dict[str, Any]):
    api_details_list = request["apis"]

    api_list = []

    for api_details in api_details_list:
        try:
            api = await get_pre_processed_choreo_spec(api_details)
            embedding_response = embed.embed_query(str(api.__dict__))
            payload = {
                "page_content": str(api.spec),
                "metadata": {
                    "id": api.id,
                    "api_name": api.name,
                    "api_version": api.version,
                    "api_type": api.type,
                    "api_uuid": api.api_uuid
                },
                "id": api.id,
                "api_name": api.name,
                "vector": embedding_response,
                "api_type": api.type,
                "org_id": api_details[const.ORG_ID],
            }

            api_list.append(payload)
        except Exception as e:
            logging.error(f"Error processing API: {api_details['uuid']}")
            logging.error(e)
            continue
    mc = MilvusClient(uri=url, token=api_key)
    try:
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, partial(upsert_bulk_vector_for_choreo, mc, api_list))
        return {const.MESSAGE: response}
    except Exception as e:
        logging.error(f"An error occurred while adding bulk of vectors to choreo: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        mc.close()


@app.delete("/remove_vector/{uuid}")
async def remove_vector(uuid: str, keyID: Optional[str] = None, orgID: Optional[str] = None):
    mc = MilvusClient(uri=url, token=api_key)
    try:
        loop = asyncio.get_event_loop()
        if source == const.APIM:
            response = await loop.run_in_executor(None, partial(delete_vector, mc, [uuid], keyID))
        elif source == const.CHOREO:
            response = await loop.run_in_executor(None, partial(delete_vector_for_choreo, mc, uuid))

        return {const.MESSAGE: response}
    except Exception as e:
        logging.error(f"An error occurred while removing a vector: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        mc.close()


@app.post("/bulk_add_vector")
async def bulk_add_vector(req: Dict[str, Any], orgID: str, keyID: str):
    api_details_list = req["apis"]

    api_list = []

    if source == const.APIM:

        for api_details in api_details_list:
            api = await get_pre_processed_spec(api_details)

            embedding_response = embed.embed_query(str(api.__dict__))
            payload = {
                "page_content": str(api.spec),
                "metadata": {
                    "id": api.id,
                    "api_name": api.name,
                    "api_version": api.version,
                    "api_type": api.type
                },
                "id": keyID + api.id,
                "vector": embedding_response,
                "api_type": api.type,
                "org_id": orgID,
                "key_id": keyID,
                "tenant_domain": api_details["tenant_domain"],
                "visibility_roles": '' 
            }
            
            if "visibility_roles" in api_details:
                payload["visibility_roles"] = api_details["visibility_roles"].split(",")

            api_list.append(payload)

        mc = MilvusClient(uri=url, token=api_key)
        try:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, partial(upsert_bulk_vector_for_onprem, mc, api_list))
            return {const.MESSAGE: response}
        except Exception as e:
            logging.error(f"An error occurred while adding bulk of vectors: {e}")
            raise HTTPException(status_code=500, detail=str(e))
        finally:
            mc.close()


@app.get("/api_count")
async def get_api_count(orgID: str):
    mc = MilvusClient(uri=url, token=api_key)
    try:
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, partial(get_vector_count_for_org, mc, orgID))
        logging.info(f"API count for org {orgID}: {response}")
        return {"count": response}
    except Exception as e:
        logging.error(f"An error occurred while getting api count: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        mc.close()


@app.delete("/bulk_remove_vector")
async def bulk_remove_vector(orgID: str, keyID: Optional[str] = None, tenantDomain: Optional[str] = None):
    mc = MilvusClient(uri=url, token=api_key)
    try:
        loop = asyncio.get_event_loop()
        if source == const.APIM:
            response = await loop.run_in_executor(None, partial(delete_bulk_vector_for_onprem, mc, orgID, keyID,
                                                                tenantDomain))
        elif source == const.CHOREO:
            response = await loop.run_in_executor(None, partial(delete_org_wise_vectors_for_choreo, mc, orgID))
        return {const.MESSAGE: response}
    except Exception as e:
        logging.error(f"An error occurred while removing bulk of vectors: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        mc.close()

@app.delete("/bulk_remove_all_tenant")
async def bulk_remove_all_tenant(orgID: str, keyID: Optional[str] = None):
    mc = MilvusClient(uri=url, token=api_key)
    try:
        loop = asyncio.get_event_loop()
        if source == const.APIM:
            response = await loop.run_in_executor(None, partial(delete_vectors_for_all_tenants_onprem, mc, orgID, keyID))
        elif source == const.CHOREO:
            response = await loop.run_in_executor(None, partial(delete_org_wise_vectors_for_choreo, mc, orgID))
        return {const.MESSAGE: response}
    except Exception as e:
        logging.error(f"An error occurred while removing bulk of vectors: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        mc.close()

@app.get("/health")
def health():
    """Check the api is running"""
    return {"status": "Running"}


# New endpoint to fetch count by keyID
@app.get("/api_count_by_key")
async def get_api_count_by_key(keyID: str):
    mc = MilvusClient(uri=url, token=api_key)
    try:
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, partial(get_vector_count_for_key, mc, keyID))
        logging.info(f"API count for keyID {keyID}: {response}")
        return {"count": response}
    except Exception as e:
        logging.error(f"An error occurred while getting api count by key: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        mc.close()
