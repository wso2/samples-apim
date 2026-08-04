import logging

from pymilvus import DataType, MilvusClient, Collection, connections
import os
from utils import API, ChoreoAPI
import constants as const

collection_name = os.getenv(const.COLLECTION_NAME)
create_collection = os.getenv(const.CREATE_COLLECTION, True)

ORG_FILTER = '(org_id == "{org_id}")'


def upsert_vector_for_onprem(mc, embed, orgID, keyID, api: API, tenant, visibilityRoles):
    if create_collection:
        has = mc.has_collection(collection_name)
        if not has:
            schema = MilvusClient.create_schema(
                auto_id=False,
                enable_dynamic_field=False,
            )
            schema.add_field(field_name="id", datatype=DataType.VARCHAR, is_primary=True, max_length=100)
            schema.add_field(field_name="metadata", datatype=DataType.JSON, max_length=2000)
            schema.add_field(field_name="api_type", datatype=DataType.VARCHAR, max_length=100)
            schema.add_field(field_name="vector", datatype=DataType.FLOAT_VECTOR, dim=1536)
            schema.add_field(field_name="page_content", datatype=DataType.VARCHAR, max_length=10000)
            schema.add_field(field_name="org_id", datatype=DataType.VARCHAR, max_length=512)
            schema.add_field(field_name="key_id", datatype=DataType.VARCHAR, max_length=512, is_partition_key=True)
            schema.add_field(field_name="tenant_domain", datatype=DataType.VARCHAR, max_length=512)
            schema.add_field(field_name="visibility_roles", datatype=DataType.ARRAY, element_type=DataType.VARCHAR, max_length=100, max_capacity=100)

            index_params = mc.prepare_index_params()

            index_params.add_index(
                field_name="vector",
                index_type="AUTOINDEX",
                metric_type="L2"
            )
            mc.create_collection(
                collection_name=collection_name,
                metric_type="COSINE",
                schema=schema,
                index_params=index_params
            )
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
        "tenant_domain": tenant,
        "visibility_roles": visibilityRoles
    }
    response = mc.upsert(collection_name=collection_name, data=payload)
    return response


def delete_vector(mc, uuid, record_id):
    uuid = [record_id + id for id in uuid]
    response = mc.delete(
        collection_name=collection_name,
        ids=uuid
    )
    return response


def delete_vector_for_choreo(mc, uuid):
    count = query_document(uuid, mc)
    if count == 0:
        return "Document not found, document id: %s" % uuid
    response = mc.delete(
        collection_name=collection_name,
        ids=uuid
    )
    return response


def delete_org_wise_vectors_for_choreo(mc, org_id):
    api_count = get_vector_count_for_org(mc, org_id)
    logging.info("API count: %s for org_id - %s", api_count, org_id)
    response = mc.delete(collection_name=collection_name, filter=ORG_FILTER.format(org_id=org_id))
    logging.info("Deleted %s records for org_id - %s", response.get("delete_count"), org_id)
    return response


def upsert_bulk_vector_for_onprem(mc, payload):
    if create_collection:
        has = mc.has_collection(collection_name)
        if not has:
            schema = MilvusClient.create_schema(
                auto_id=False,
                enable_dynamic_field=False,
            )
            schema.add_field(field_name="id", datatype=DataType.VARCHAR, is_primary=True, max_length=100)
            schema.add_field(field_name="metadata", datatype=DataType.JSON, max_length=2000)
            schema.add_field(field_name="api_type", datatype=DataType.VARCHAR, max_length=100)
            schema.add_field(field_name="vector", datatype=DataType.FLOAT_VECTOR, dim=1536)
            schema.add_field(field_name="page_content", datatype=DataType.VARCHAR, max_length=10000)
            schema.add_field(field_name="org_id", datatype=DataType.VARCHAR, max_length=512)
            schema.add_field(field_name="key_id", datatype=DataType.VARCHAR, max_length=512, is_partition_key=True)
            schema.add_field(field_name="tenant_domain", datatype=DataType.VARCHAR, max_length=512)
            schema.add_field(field_name="visibility_roles", datatype=DataType.ARRAY, element_type=DataType.VARCHAR, max_length=100, max_capacity=100)

            index_params = mc.prepare_index_params()

            index_params.add_index(
                field_name="vector",
                index_type="AUTOINDEX",
                metric_type="L2"
            )
            mc.create_collection(
                collection_name=collection_name,
                metric_type="COSINE",
                schema=schema,
                index_params=index_params
            )

    response = mc.upsert(collection_name=collection_name, data=payload)
    return response

def delete_bulk_vector_for_onprem(mc, orgId, keyId, tenantDomain):
    response = mc.delete(
        collection_name=collection_name,
        filter=f"key_id == '{keyId}' && tenant_domain == '{tenantDomain}'"
    )
    return response

def delete_vectors_for_all_tenants_onprem(mc, orgId, keyId):
    response = mc.delete(
        collection_name=collection_name,
        filter=f"key_id == '{keyId}'"
    )
    return response

def upsert_vector_for_choreo(mc, embed, orgID, api: ChoreoAPI):
    if create_collection:
        has = mc.has_collection(collection_name)
        if not has:
            schema = MilvusClient.create_schema(
                auto_id=False,
                enable_dynamic_field=False,
            )
            schema.add_field(field_name="id", datatype=DataType.VARCHAR, is_primary=True, max_length=65000)
            schema.add_field(field_name="metadata", datatype=DataType.JSON, max_length=65000)
            schema.add_field(field_name="api_type", datatype=DataType.VARCHAR, max_length=65000)
            schema.add_field(field_name="api_name", datatype=DataType.VARCHAR, max_length=65000)
            schema.add_field(field_name="vector", datatype=DataType.FLOAT_VECTOR, dim=1536)
            schema.add_field(field_name="page_content", datatype=DataType.VARCHAR, max_length=65000)
            schema.add_field(field_name="org_id", datatype=DataType.VARCHAR, max_length=65000, is_partition_key=True)

            index_params = mc.prepare_index_params()

            index_params.add_index(
                field_name="vector",
                index_type="AUTOINDEX",
                metric_type="L2"
            )

            mc.create_collection(
                collection_name=collection_name,
                metric_type="COSINE",
                schema=schema,
                index_params=index_params
            )

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
        "org_id": orgID,
    }
    count = get_collection_raw_count(mc)
    document_exist = query_document(api.id, mc)
    if document_exist == 0:
        milvus_res = mc.insert(collection_name=collection_name, data=payload)
        logging.info("milvus_res (insert): %s", milvus_res)
        response = {"insert_count": milvus_res.get("insert_count")}
    else:
        milvus_res = mc.upsert(collection_name=collection_name, data=payload)
        logging.info("milvus_res (upsert): %s", milvus_res)
        response = {"upsert_count": milvus_res.get("upsert_count")}

    count_after = get_collection_raw_count(mc)

    logging.info("Count before: %s, Count after: %s", count, count_after)
    if document_exist == 0 and count_after == count:
        logging.error("Failed to upsert document with id: %s", api.id)
    return {"milvus_response": response, "milvus_count": count_after}


def upsert_bulk_vector_for_choreo(mc, payload):
    if create_collection:
        has = mc.has_collection(collection_name)
        if not has:
            schema = MilvusClient.create_schema(
                auto_id=False,
                enable_dynamic_field=False,
            )
            schema.add_field(field_name="id", datatype=DataType.VARCHAR, is_primary=True, max_length=65000)
            schema.add_field(field_name="metadata", datatype=DataType.JSON, max_length=65000)
            schema.add_field(field_name="api_type", datatype=DataType.VARCHAR, max_length=65000)
            schema.add_field(field_name="api_name", datatype=DataType.VARCHAR, max_length=65000)
            schema.add_field(field_name="vector", datatype=DataType.FLOAT_VECTOR, dim=1536)
            schema.add_field(field_name="page_content", datatype=DataType.VARCHAR, max_length=65000)
            schema.add_field(field_name="org_id", datatype=DataType.VARCHAR, max_length=65000, is_partition_key=True)

            index_params = mc.prepare_index_params()

            index_params.add_index(
                field_name="vector",
                index_type="AUTOINDEX",
                metric_type="L2"
            )

            mc.create_collection(
                collection_name=collection_name,
                metric_type="COSINE",
                schema=schema,
                index_params=index_params
            )

    collection = Collection(name=collection_name)

    count = get_collection_raw_count(mc)
    # milvus_res = mc.upsert(collection_name=collection_name, data=payload)
    milvus_res = collection.upsert(payload)
    collection.flush()
    count_after = get_collection_raw_count(mc)
    response = {"upsert_count": milvus_res.upsert_count}
    logging.info("Count before: %s, Count after: %s", count, count_after)
    logging.info("Milvus Response", response)
    if count >= count_after:
        logging.error("Failed to upsert documents")
        count_after = -1
    return {"milvus_response": response, "milvus_count": count_after}


def get_vector_count_for_org(mc, org_id):
    response = mc.query(
        collection_name=collection_name,
        filter=ORG_FILTER.format(org_id=org_id),
        output_fields=["count(*)"],
    )
    return response[0]["count(*)"]


def query_document(uuid, mc):
    response = mc.query(
        collection_name=collection_name,
        filter=f'(id == "{uuid}")',
        output_fields=["count(*)"],
    )
    return response[0]["count(*)"]


def get_collection_raw_count(mc):
    response = mc.query(
        collection_name=collection_name,
        output_fields=["count(*)"],
    )
    mc.get_collection_stats(collection_name=collection_name)
    return response[0]["count(*)"]


def get_vector_count_for_key(mc, key_id):
    response = mc.query(
        collection_name=collection_name,
        filter=f'(key_id == "{key_id}")',
        output_fields=["count(*)"],
    )
    return response[0]["count(*)"]
