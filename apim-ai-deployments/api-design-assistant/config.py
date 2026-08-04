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
import redis.asyncio as redis
import os
from dotenv import load_dotenv
from langchain_openai import AzureChatOpenAI
from cachetools import cached, TTLCache
import requests
import jwt

load_dotenv()

# openai proxy related env variables
USE_PROXY = os.getenv("USE_PROXY", "false").lower() == "true"
AZURE_ENDPOINT = os.getenv("AZURE_ENDPOINT")
CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET") 
TOKEN_ENDPOINT_URL = os.getenv("TOKEN_ENDPOINT_URL")
AZURE_PROXY_ENDPOINT = os.getenv("AZURE_PROXY_ENDPOINT")
AZURE_CHAT_VERSION = os.getenv("AZURE_CHAT_VERSION", "2025-04-01-preview")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
AZURE_CHAT_DEPLOYMENT = os.getenv("AZURE_CHAT_DEPLOYMENT")
PROXY_HEALTH_CHECK_CACHE_TTL = int(os.getenv('PROXY_HEALTH_CHECK_CACHE_TTL', '900'))
TOKEN_CACHE_SIZE = int(os.getenv("TOKEN_CACHE_SIZE", "50"))
TOKEN_CACHE_TTL = int(os.getenv("TOKEN_CACHE_TTL", "870"))

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
        if validate_endpoint(AZURE_PROXY_ENDPOINT + "/openai/responses?api-version=2025-04-01-preview"):
            return AzureChatOpenAI(
                azure_endpoint=AZURE_PROXY_ENDPOINT,
                azure_deployment=AZURE_CHAT_DEPLOYMENT,
                api_key=api_key,
                api_version="2025-04-01-preview",
                output_version="responses/v1"
            )
        else:
            print(f"Warning: Proxy endpoint {AZURE_PROXY_ENDPOINT} is not reachable, falling back to direct connection.")

    return AzureChatOpenAI(
        azure_endpoint=AZURE_ENDPOINT,
        azure_deployment=AZURE_CHAT_DEPLOYMENT,
        api_key=OPENAI_API_KEY,
        api_version=AZURE_CHAT_VERSION,
        output_version="responses/v1"
    )

r = redis.Redis(
    host=os.getenv("REDIS_HOST"), port=int(os.getenv("REDIS_PORT")),
    password=os.getenv("REDIS_PASSWORD"),
    db=int(os.getenv("REDIS_DB")),
    ssl=True
)
