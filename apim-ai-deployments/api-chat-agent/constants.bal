// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 Inc. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein is strictly forbidden, unless permitted by WSO2 in accordance with
// the WSO2 Commercial License available at http://wso2.com/licenses.
// For specific language governing the permissions and limitations under
// this license, please see the license as well as any agreement you’ve
// entered into with WSO2 governing the purchase of this software and any

const SERVICE_PORT = 9090;
const SERVICE_MAX_HEADER_SIZE = 15000;

const MAX_ITERATIONS = 15;
const MAX_TOKEN_COUNT = 4096;

const REDIS_CONN_TIMEOUT = 2000;
const INVALID_AUTH_HTTP_CODE = 401;

const REDIS_TESTCASE_KEY_EXPIRATION_TIME = 1000;
const REDIS_OPENAPI_KEY_EXPIRATION_TIME = 5000;

const TESTCASE_NAMESPACE = "TESTCASE";
const API_SPEC_NAMESPACE = "API_SPEC";
const PATH_KEY = "path";
const PARAMETER_KEY = "parameters";
const REQUEST_BODY_KEY = "requestBody";

const INVOKE_ALL_RESOURCES_COMMAND = "Invoke all resources";

const APICHAT_RETRY_COUNT = 2;
const CACHE_RETRY_COUNT = 2;
