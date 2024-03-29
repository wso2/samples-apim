import type { Plugin } from 'rollup';
declare type Module = 'core' | 'formats' | 'functions' | 'parsers' | 'ref-resolver' | 'rulesets' | 'runtime';
declare type GlobalModules = Record<`@stoplight/spectral-${Module}`, string>;
declare type Overrides = Record<keyof GlobalModules, Record<string, unknown>>;
export declare const builtins: (overrides?: Partial<Overrides>) => Plugin;
export {};
