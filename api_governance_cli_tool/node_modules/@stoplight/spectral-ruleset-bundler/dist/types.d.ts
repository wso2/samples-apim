/// <reference lib="dom" />
export declare type Fetch = Window['fetch'] | typeof import('@stoplight/spectral-runtime').fetch;
export declare type IO = {
    fs: {
        promises: {
            readFile: typeof import('fs').promises.readFile;
        };
    };
    fetch: Fetch;
};
