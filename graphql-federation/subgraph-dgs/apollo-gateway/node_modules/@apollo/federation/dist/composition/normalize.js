"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripCommonPrimitives = exports.replaceExtendedDefinitionsWithExtensions = exports.defaultRootOperationTypes = exports.normalizeTypeDefs = void 0;
const graphql_1 = require("graphql");
const utils_1 = require("./utils");
const directives_1 = __importDefault(require("../directives"));
function normalizeTypeDefs(typeDefs) {
    return stripCommonPrimitives(defaultRootOperationTypes(replaceExtendedDefinitionsWithExtensions(typeDefs)));
}
exports.normalizeTypeDefs = normalizeTypeDefs;
function defaultRootOperationTypes(typeDefs) {
    const defaultRootOperationNames = Object.values(utils_1.defaultRootOperationNameLookup);
    let rootOperationTypeMap = Object.create(null);
    let hasSchemaDefinitionOrExtension = false;
    graphql_1.visit(typeDefs, {
        OperationTypeDefinition(node) {
            hasSchemaDefinitionOrExtension = true;
            rootOperationTypeMap[node.type.name.value] =
                utils_1.defaultRootOperationNameLookup[node.operation];
        },
    });
    if (!hasSchemaDefinitionOrExtension) {
        rootOperationTypeMap = {
            Query: 'Query',
            Mutation: 'Mutation',
            Subscription: 'Subscription',
        };
    }
    let schemaWithoutConflictingDefaultDefinitions;
    if (!hasSchemaDefinitionOrExtension) {
        schemaWithoutConflictingDefaultDefinitions = typeDefs;
    }
    else {
        schemaWithoutConflictingDefaultDefinitions = graphql_1.visit(typeDefs, {
            ObjectTypeDefinition(node) {
                if (defaultRootOperationNames.includes(node.name.value) &&
                    !rootOperationTypeMap[node.name.value]) {
                    return null;
                }
                return;
            },
            ObjectTypeExtension(node) {
                if (defaultRootOperationNames.includes(node.name.value) &&
                    !rootOperationTypeMap[node.name.value]) {
                    return null;
                }
                return;
            },
            FieldDefinition(node) {
                if (node.type.kind === graphql_1.Kind.NAMED_TYPE &&
                    defaultRootOperationNames.includes(node.type.name.value)) {
                    return null;
                }
                if (node.type.kind === graphql_1.Kind.NON_NULL_TYPE &&
                    node.type.type.kind === graphql_1.Kind.NAMED_TYPE &&
                    defaultRootOperationNames.includes(node.type.type.name.value)) {
                    return null;
                }
                return;
            },
        });
    }
    const schemaWithDefaultRootTypes = graphql_1.visit(schemaWithoutConflictingDefaultDefinitions, {
        SchemaDefinition() {
            return null;
        },
        SchemaExtension() {
            return null;
        },
        ObjectTypeDefinition(node) {
            if (node.name.value in rootOperationTypeMap ||
                defaultRootOperationNames.includes(node.name.value)) {
                return {
                    ...node,
                    name: {
                        ...node.name,
                        value: rootOperationTypeMap[node.name.value] || node.name.value,
                    },
                    kind: graphql_1.Kind.OBJECT_TYPE_EXTENSION,
                };
            }
            return;
        },
        ObjectTypeExtension(node) {
            if (node.name.value in rootOperationTypeMap ||
                defaultRootOperationNames.includes(node.name.value)) {
                return {
                    ...node,
                    name: {
                        ...node.name,
                        value: rootOperationTypeMap[node.name.value] || node.name.value,
                    },
                };
            }
            return;
        },
        NamedType(node) {
            if (node.name.value in rootOperationTypeMap) {
                return {
                    ...node,
                    name: {
                        ...node.name,
                        value: rootOperationTypeMap[node.name.value],
                    },
                };
            }
            return;
        },
    });
    return schemaWithDefaultRootTypes;
}
exports.defaultRootOperationTypes = defaultRootOperationTypes;
function replaceExtendedDefinitionsWithExtensions(typeDefs) {
    const typeDefsWithExtendedTypesReplaced = graphql_1.visit(typeDefs, {
        ObjectTypeDefinition: visitor,
        InterfaceTypeDefinition: visitor,
    });
    function visitor(node) {
        const isExtensionDefinition = utils_1.findDirectivesOnNode(node, 'extends').length > 0;
        if (!isExtensionDefinition) {
            return node;
        }
        const filteredDirectives = node.directives &&
            node.directives.filter(directive => directive.name.value !== 'extends');
        return {
            ...node,
            ...(filteredDirectives && { directives: filteredDirectives }),
            kind: utils_1.defKindToExtKind[node.kind],
        };
    }
    return typeDefsWithExtendedTypesReplaced;
}
exports.replaceExtendedDefinitionsWithExtensions = replaceExtendedDefinitionsWithExtensions;
function stripCommonPrimitives(document) {
    const typeDefinitionVisitor = (node) => {
        var _a;
        if (node.name.value === utils_1.defaultRootOperationNameLookup.query) {
            const filteredFieldDefinitions = (_a = node.fields) === null || _a === void 0 ? void 0 : _a.filter((fieldDefinition) => !utils_1.reservedRootFields.includes(fieldDefinition.name.value));
            if (!filteredFieldDefinitions || filteredFieldDefinitions.length === 0) {
                return null;
            }
            return {
                ...node,
                fields: filteredFieldDefinitions,
            };
        }
        const isFederationType = node.name.value === '_Service';
        return isFederationType ? null : node;
    };
    return graphql_1.visit(document, {
        DirectiveDefinition(node) {
            const isCommonDirective = [
                ...directives_1.default,
                ...graphql_1.specifiedDirectives,
            ].some((directive) => directive.name === node.name.value);
            return isCommonDirective ? null : node;
        },
        ScalarTypeDefinition(node) {
            const isFederationScalar = ['_Any', '_FieldSet'].includes(node.name.value);
            return isFederationScalar ? null : node;
        },
        UnionTypeDefinition(node) {
            const isFederationUnion = node.name.value === "_Entity";
            return isFederationUnion ? null : node;
        },
        ObjectTypeDefinition: typeDefinitionVisitor,
        ObjectTypeExtension: typeDefinitionVisitor,
    });
}
exports.stripCommonPrimitives = stripCommonPrimitives;
//# sourceMappingURL=normalize.js.map