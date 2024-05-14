import { GraphQLSchema, GraphQLNamedType } from 'graphql';
import { ServiceDefinition } from '../composition';
declare type Options = {
    commentDescriptions?: boolean;
};
interface PrintingContext {
    graphNameToEnumValueName?: Record<string, string>;
}
export declare function printSupergraphSdl(schema: GraphQLSchema, serviceList: ServiceDefinition[], options?: Options): string;
export declare function printIntrospectionSchema(schema: GraphQLSchema, options?: Options): string;
export declare function printType(type: GraphQLNamedType, context: PrintingContext, options?: Options): string;
export declare function printBlockString(value: string, indentation?: string, preferMultipleLines?: boolean): string;
export {};
//# sourceMappingURL=printSupergraphSdl.d.ts.map