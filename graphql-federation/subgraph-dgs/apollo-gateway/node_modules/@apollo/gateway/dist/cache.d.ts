import { CacheManager } from 'make-fetch-happen';
import { Request, Response, Headers } from 'apollo-server-env';
import { InMemoryLRUCache } from 'apollo-server-caching';
interface CachedRequest {
    body: string;
    status: number;
    statusText: string;
    headers: Headers;
}
export declare class HttpRequestCache implements CacheManager {
    cache: InMemoryLRUCache<CachedRequest>;
    constructor(cache?: InMemoryLRUCache<CachedRequest>);
    delete(request: Request): Promise<boolean>;
    put(request: Request, response: Response): Promise<Response>;
    match(request: Request): Promise<Response | undefined>;
}
export {};
//# sourceMappingURL=cache.d.ts.map