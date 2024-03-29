import { JsonPath, Segment } from '@stoplight/types';
declare type Hooks = {
    onEnter(ctx: Readonly<{
        value: object;
        path: JsonPath;
    }>): void;
    onLeave(ctx: Readonly<{
        value: object;
        path: JsonPath;
    }>): void;
    onProperty(ctx: Readonly<{
        parent: object;
        parentPath: JsonPath;
        property: Segment;
        propertyValue: unknown;
    }>): void;
};
export declare const traverse: (obj: unknown, hooks: Partial<Hooks> | ((ctx: Readonly<{
    parent: object;
    parentPath: Segment[];
    property: Segment;
    propertyValue: unknown;
}>) => void)) => void;
export {};
