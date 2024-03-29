import specs from '@asyncapi/specs';
export declare type AsyncAPISpecVersion = keyof typeof specs;
export declare const latestVersion: string;
export declare function getCopyOfSchema(version: AsyncAPISpecVersion): Record<string, unknown>;
