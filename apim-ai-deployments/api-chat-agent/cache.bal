// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 Inc. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein is strictly forbidden, unless permitted by WSO2 in accordance with
// the WSO2 Commercial License available at http://wso2.com/licenses.
// For specific language governing the permissions and limitations under
// this license, please see the license as well as any agreement you’ve
// entered into with WSO2 governing the purchase of this software and any
import ballerina/crypto;
import ballerina/log;
import ballerinax/redis;

final redis:Client redis = check new ({
    host: redisHost,
    password: readKey(redisPassword),
    options: {
        connectionPooling: true,
        ssl: true,
        connectionTimeout: REDIS_CONN_TIMEOUT
    }
});

isolated function retrieveCachedApiSpec(string trackingId, string apiSpecHash) returns CacheSchema|error? {
    string? cachedSpec;
    retry<RetryManager> (CACHE_RETRY_COUNT) {
        cachedSpec = check redis->get(string `${API_SPEC_NAMESPACE}:${apiSpecHash}`);
    }
    if cachedSpec is () {
        return;
    }
    return check cachedSpec.fromJsonStringWithType();
}

isolated function updateApiSpecCache(string trackingId, string apiSpecHash, CacheSchema apiSpec) {
    retry<RetryManager> (CACHE_RETRY_COUNT) {
        _ = check redis->setEx(string `${API_SPEC_NAMESPACE}:${apiSpecHash}`, apiSpec.toJsonString(), REDIS_OPENAPI_KEY_EXPIRATION_TIME);
    } on fail error e {
        log:printError("Error while caching the enriched specification: ", 'error = e, id = trackingId);

    }
}

isolated function retrieveCachedTestCase(string testCaseId) returns CacheRecord|error {
    string? cachedString;
    retry<RetryManager> (CACHE_RETRY_COUNT) {
        cachedString = check redis->get(string `${TESTCASE_NAMESPACE}:${testCaseId}`);
    }
    if cachedString is () { // cached entry is not found
        return error("Test case is not found. Invalid or expired test case id.");
    }
    return check cachedString.fromJsonStringWithType();
}

isolated function clearTestCaseCache(string testCaseId) {
    retry<RetryManager> (CACHE_RETRY_COUNT) {
        _ = check redis->del([string `${TESTCASE_NAMESPACE}:${testCaseId}`]);
    } on fail error e {
        log:printWarn("Cleaning the cache failed for the test case", e, id = testCaseId);
    }
}

isolated function updateTestCaseCache(string testCaseId, CacheRecord value) {
    retry<RetryManager> (CACHE_RETRY_COUNT) {
        _ = check redis->setEx(string `${TESTCASE_NAMESPACE}:${testCaseId}`, value.toJsonString(), REDIS_TESTCASE_KEY_EXPIRATION_TIME);
    } on fail error e {
        log:printError("Error while caching the test case: ", 'error = e, id = testCaseId);
    }
}

isolated function getHashedString(string input) returns string {
    return crypto:hashSha256(input.toBytes()).toBase16();
}
