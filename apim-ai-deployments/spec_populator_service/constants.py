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

APIM = "apim"
CHOREO = "choreo"

# environment variable names
SOURCE_PLATFORM = "SOURCE_PLATFORM"
MILVERSE_API_KEY = "MILVERSE_API_KEY"
MILVERSE_URL = "MILVERSE_URL"
EXCLUDED_ORG_LIST = "EXCLUDED_ORG_LIST"
COLLECTION_NAME = "COLLECTION_NAME"
CREATE_COLLECTION = "CREATE_COLLECTION"

# API types
APIPRODUCT = "APIPRODUCT"
REST = "REST"
HTTP = "HTTP"
SOAP = "SOAP"
SOAPTOREST = "SOAPTOREST"
GRAPHQL = "GRAPHQL"
ASYNC = "ASYNC"
WS = "WS"
WEBSUB = "WEBSUB"
SSE = "SSE"
WEBHOOK = "WEBHOOK"

# API information fields
API_NAME = "api_name"
API_TYPE = "api_type"
API_VERSION = "version"
API_UUID = "api_uuid"
API_SPEC = "api_spec"
APIM_DESCRIPTION = "apim_description"

ORG_ID = "org_id"
UUID = "uuid"
DESCRIPTION = "description"

MESSAGE = "message"

# This list is added to exclude the info level http logs from FastAPI
EXCLUDED_ENDPOINTS = ["/add_vector/{uuid}", "/add_bulk_vector_choreo", "/remove_vector/{uuid}", "/bulk_add_vector",
                      "/api_count", "/bulk_remove_vector", "/health"]
