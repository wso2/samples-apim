import { StringValueNode, NameNode, DocumentNode, DirectiveNode, GraphQLNamedType, GraphQLError, GraphQLSchema, GraphQLObjectType, GraphQLField, SelectionNode, TypeDefinitionNode, TypeExtensionNode, ASTNode, DirectiveDefinitionNode, GraphQLDirective, OperationTypeNode } from 'graphql';
import { ExternalFieldDefinition, DefaultRootOperationTypeName, Maybe, FederationType, FederationDirective, FederationField, ServiceDefinition } from './types';
import { ASTNodeWithDirectives } from '../directives';
export declare function isStringValueNode(node: any): node is StringValueNode;
export declare function isDirectiveDefinitionNode(node: any): node is DirectiveDefinitionNode;
export declare function mapFieldNamesToServiceName<Node extends {
    name: NameNode;
}>(fields: ReadonlyArray<Node>, serviceName: string): any;
export declare function findDirectivesOnNode(node: Maybe<ASTNodeWithDirectives>, directiveName: string): DirectiveNode[];
export declare function printFieldSet(selections: readonly SelectionNode[]): string;
export declare function findSelectionSetOnNode(node: Maybe<ASTNodeWithDirectives>, directiveName: string, printedSelectionSet: string): import("graphql").ValueNode | undefined;
export declare function stripExternalFieldsFromTypeDefs(typeDefs: DocumentNode, serviceName: string): {
    typeDefsWithoutExternalFields: DocumentNode;
    strippedFields: ExternalFieldDefinition[];
};
export declare function stripDescriptions(astNode: ASTNode): any;
export declare function stripTypeSystemDirectivesFromTypeDefs(typeDefs: DocumentNode): DocumentNode;
export declare function parseSelections(source: string): ReadonlyArray<SelectionNode>;
export declare function hasMatchingFieldInDirectives({ directives, fieldNameToMatch, namedType, }: {
    directives: DirectiveNode[];
    fieldNameToMatch: String;
    namedType: GraphQLNamedType;
}): boolean;
export declare const logServiceAndType: (serviceName: string, typeName: string, fieldName?: string | undefined) => string;
export declare function logDirective(directiveName: string): string;
export declare function errorWithCode(code: string, message: string, nodes?: ReadonlyArray<ASTNode> | ASTNode | undefined): GraphQLError;
export declare function findTypesContainingFieldWithReturnType(schema: GraphQLSchema, node: GraphQLField<any, any>): GraphQLObjectType[];
export declare function findFieldsThatReturnType({ schema, typeToFind, }: {
    schema: GraphQLSchema;
    typeToFind: GraphQLNamedType;
}): GraphQLField<any, any>[];
export declare function selectionIncludesField({ selections, selectionSetType, typeToFind, fieldToFind, }: {
    selections: readonly SelectionNode[];
    selectionSetType: GraphQLObjectType;
    typeToFind: GraphQLObjectType;
    fieldToFind: string;
}): boolean;
export declare function isTypeNodeAnEntity(node: TypeDefinitionNode | TypeExtensionNode): boolean;
export declare function diffTypeNodes(firstNode: TypeDefinitionNode | TypeExtensionNode | DirectiveDefinitionNode, secondNode: TypeDefinitionNode | TypeExtensionNode | DirectiveDefinitionNode): {
    name: string[];
    kind: ("ScalarTypeDefinition" | "ObjectTypeDefinition" | "InterfaceTypeDefinition" | "UnionTypeDefinition" | "EnumTypeDefinition" | "InputObjectTypeDefinition" | "DirectiveDefinition" | "ScalarTypeExtension" | "ObjectTypeExtension" | "InterfaceTypeExtension" | "UnionTypeExtension" | "EnumTypeExtension" | "InputObjectTypeExtension")[];
    fields: {
        [fieldName: string]: string[];
    };
    inputValues: {
        [inputName: string]: string[];
    };
    unionTypes: {
        [typeName: string]: boolean;
    };
    locations: string[];
    args: {
        [argumentName: string]: string[];
    };
};
export declare function typeNodesAreEquivalent(firstNode: TypeDefinitionNode | TypeExtensionNode | DirectiveDefinitionNode, secondNode: TypeDefinitionNode | TypeExtensionNode | DirectiveDefinitionNode): boolean;
export declare function findTypeNodeInServiceList(typeName: string, serviceName: string, serviceList: ServiceDefinition[]): import("graphql").DefinitionNode | undefined;
export declare const defKindToExtKind: {
    [kind: string]: string;
};
export declare const executableDirectiveLocations: string[];
export declare function isApolloTypeSystemDirective(directive: GraphQLDirective): boolean;
export declare function isFederationDirective(directive: GraphQLDirective): boolean;
export declare const reservedRootFields: string[];
export declare const defaultRootOperationNameLookup: {
    [node in OperationTypeNode]: DefaultRootOperationTypeName;
};
export declare type CompositionResult = CompositionFailure | CompositionSuccess;
export interface CompositionFailure {
    schema: GraphQLSchema;
    errors: GraphQLError[];
    supergraphSdl?: undefined;
}
export interface CompositionSuccess {
    schema: GraphQLSchema;
    supergraphSdl: string;
    errors?: undefined;
}
export declare function compositionHasErrors(compositionResult: CompositionResult): compositionResult is CompositionFailure;
export declare function assertCompositionSuccess(compositionResult: CompositionResult, message?: string): asserts compositionResult is CompositionSuccess;
export declare function assertCompositionFailure(compositionResult: CompositionResult, message?: string): asserts compositionResult is CompositionFailure;
export declare function getFederationMetadata(obj: GraphQLNamedType): FederationType | undefined;
export declare function getFederationMetadata(obj: GraphQLField<any, any>): FederationField | undefined;
export declare function getFederationMetadata(obj: GraphQLDirective): FederationDirective | undefined;
//# sourceMappingURL=utils.d.ts.map