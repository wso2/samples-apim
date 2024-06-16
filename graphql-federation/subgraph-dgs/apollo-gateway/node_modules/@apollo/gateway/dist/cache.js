"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpRequestCache = void 0;
const apollo_server_env_1 = require("apollo-server-env");
const apollo_server_caching_1 = require("apollo-server-caching");
const MAX_SIZE = 5 * 1024 * 1024;
function cacheKey(request) {
    return `gateway:request-cache:${request.method}:${request.url}`;
}
class HttpRequestCache {
    constructor(cache = new apollo_server_caching_1.InMemoryLRUCache({
        maxSize: MAX_SIZE,
    })) {
        this.cache = cache;
    }
    async delete(request) {
        const key = cacheKey(request);
        const entry = await this.cache.get(key);
        await this.cache.delete(key);
        return Boolean(entry);
    }
    async put(request, response) {
        if (request.method === "HEAD" || response.status === 304) {
            return response;
        }
        const body = await response.text();
        this.cache.set(cacheKey(request), {
            body,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
        });
        return new apollo_server_env_1.Response(body, response);
    }
    async match(request) {
        return this.cache.get(cacheKey(request)).then(response => {
            if (response) {
                const { body, ...requestInit } = response;
                return new apollo_server_env_1.Response(body, requestInit);
            }
            return;
        });
    }
}
exports.HttpRequestCache = HttpRequestCache;
//# sourceMappingURL=cache.js.map