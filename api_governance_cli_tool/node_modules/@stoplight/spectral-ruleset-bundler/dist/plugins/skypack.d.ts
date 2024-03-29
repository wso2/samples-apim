import type { Plugin } from 'rollup';
export declare const skypack: (opts?: {
    ignoreList?: (string | RegExp)[] | undefined;
} | undefined) => Plugin;
