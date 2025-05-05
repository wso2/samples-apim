import { GraphQLSchema, GraphQLNamedType } from 'graphql';
declare type Options = {
    commentDescriptions?: boolean;
};
export declare function printSchema(schema: GraphQLSchema, options?: Options): string;
export declare function printIntrospectionSchema(schema: GraphQLSchema, options?: Options): string;
export declare function printType(type: GraphQLNamedType, options?: Options): string;
export declare function printBlockString(value: string, indentation?: string, preferMultipleLines?: boolean): string;
export {};
//# sourceMappingURL=printFederatedSchema.d.ts.map