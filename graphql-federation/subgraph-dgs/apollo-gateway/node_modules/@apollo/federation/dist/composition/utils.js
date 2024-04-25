"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFederationMetadata = exports.assertCompositionFailure = exports.assertCompositionSuccess = exports.compositionHasErrors = exports.defaultRootOperationNameLookup = exports.reservedRootFields = exports.isFederationDirective = exports.isApolloTypeSystemDirective = exports.executableDirectiveLocations = exports.defKindToExtKind = exports.findTypeNodeInServiceList = exports.typeNodesAreEquivalent = exports.diffTypeNodes = exports.isTypeNodeAnEntity = exports.selectionIncludesField = exports.findFieldsThatReturnType = exports.findTypesContainingFieldWithReturnType = exports.errorWithCode = exports.logDirective = exports.logServiceAndType = exports.hasMatchingFieldInDirectives = exports.parseSelections = exports.stripTypeSystemDirectivesFromTypeDefs = exports.stripDescriptions = exports.stripExternalFieldsFromTypeDefs = exports.findSelectionSetOnNode = exports.printFieldSet = exports.findDirectivesOnNode = exports.mapFieldNamesToServiceName = exports.isDirectiveDefinitionNode = exports.isStringValueNode = void 0;
const graphql_1 = require("graphql");
const directives_1 = __importStar(require("../directives"));
const utilities_1 = require("../utilities");
function isStringValueNode(node) {
    return node.kind === graphql_1.Kind.STRING;
}
exports.isStringValueNode = isStringValueNode;
function isDirectiveDefinitionNode(node) {
    return node.kind === graphql_1.Kind.DIRECTIVE_DEFINITION;
}
exports.isDirectiveDefinitionNode = isDirectiveDefinitionNode;
function mapFieldNamesToServiceName(fields, serviceName) {
    return fields.reduce((prev, next) => {
        prev[next.name.value] = serviceName;
        return prev;
    }, Object.create(null));
}
exports.mapFieldNamesToServiceName = mapFieldNamesToServiceName;
function findDirectivesOnNode(node, directiveName) {
    var _a, _b;
    return ((_b = (_a = node === null || node === void 0 ? void 0 : node.directives) === null || _a === void 0 ? void 0 : _a.filter((directive) => directive.name.value === directiveName)) !== null && _b !== void 0 ? _b : []);
}
exports.findDirectivesOnNode = findDirectivesOnNode;
function printFieldSet(selections) {
    return selections
        .map((selection) => graphql_1.stripIgnoredCharacters(graphql_1.print(selection)))
        .join(' ');
}
exports.printFieldSet = printFieldSet;
function findSelectionSetOnNode(node, directiveName, printedSelectionSet) {
    var _a, _b, _c, _d;
    return (_d = (_c = (_b = (_a = node === null || node === void 0 ? void 0 : node.directives) === null || _a === void 0 ? void 0 : _a.find(directive => {
        var _a;
        return directive.name.value === directiveName && ((_a = directive.arguments) === null || _a === void 0 ? void 0 : _a.some(argument => isStringValueNode(argument.value) &&
            argument.value.value === printedSelectionSet));
    })) === null || _b === void 0 ? void 0 : _b.arguments) === null || _c === void 0 ? void 0 : _c.find(argument => argument.name.value === 'fields')) === null || _d === void 0 ? void 0 : _d.value;
}
exports.findSelectionSetOnNode = findSelectionSetOnNode;
function stripExternalFieldsFromTypeDefs(typeDefs, serviceName) {
    const strippedFields = [];
    const typeDefsWithoutExternalFields = graphql_1.visit(typeDefs, {
        ObjectTypeExtension: removeExternalFieldsFromExtensionVisitor(strippedFields, serviceName),
        InterfaceTypeExtension: removeExternalFieldsFromExtensionVisitor(strippedFields, serviceName),
    });
    return { typeDefsWithoutExternalFields, strippedFields };
}
exports.stripExternalFieldsFromTypeDefs = stripExternalFieldsFromTypeDefs;
function stripDescriptions(astNode) {
    return graphql_1.visit(astNode, {
        enter(node) {
            return 'description' in node ? { ...node, description: undefined } : node;
        },
    });
}
exports.stripDescriptions = stripDescriptions;
function stripTypeSystemDirectivesFromTypeDefs(typeDefs) {
    const typeDefsWithoutTypeSystemDirectives = graphql_1.visit(typeDefs, {
        Directive(node) {
            if (node.name.value === 'deprecated' || node.name.value === 'specifiedBy')
                return;
            const isApolloTypeSystemDirective = directives_1.default.some(({ name }) => name === node.name.value);
            return isApolloTypeSystemDirective ? undefined : null;
        },
    });
    return typeDefsWithoutTypeSystemDirectives;
}
exports.stripTypeSystemDirectivesFromTypeDefs = stripTypeSystemDirectivesFromTypeDefs;
function removeExternalFieldsFromExtensionVisitor(collector, serviceName) {
    return (node) => {
        let fields = node.fields;
        if (fields) {
            fields = fields.filter(field => {
                const externalDirectives = findDirectivesOnNode(field, 'external');
                if (externalDirectives.length > 0) {
                    collector.push({
                        field,
                        parentTypeName: node.name.value,
                        serviceName,
                    });
                    return false;
                }
                return true;
            });
        }
        return {
            ...node,
            fields,
        };
    };
}
function parseSelections(source) {
    const parsed = graphql_1.parse(`{${source}}`);
    utilities_1.assert(parsed.definitions.length === 1, `Unexpected } found in FieldSet`);
    return parsed.definitions[0].selectionSet
        .selections;
}
exports.parseSelections = parseSelections;
function hasMatchingFieldInDirectives({ directives, fieldNameToMatch, namedType, }) {
    return Boolean(namedType.astNode &&
        directives
            .map(keyDirective => keyDirective.arguments &&
            isStringValueNode(keyDirective.arguments[0].value)
            ? {
                typeName: namedType.astNode.name.value,
                keyArgument: keyDirective.arguments[0].value.value,
            }
            : null)
            .filter(utilities_1.isNotNullOrUndefined)
            .flatMap(selection => parseSelections(selection.keyArgument))
            .some(field => field.kind === graphql_1.Kind.FIELD && field.name.value === fieldNameToMatch));
}
exports.hasMatchingFieldInDirectives = hasMatchingFieldInDirectives;
const logServiceAndType = (serviceName, typeName, fieldName) => `[${serviceName}] ${typeName}${fieldName ? `.${fieldName} -> ` : ' -> '}`;
exports.logServiceAndType = logServiceAndType;
function logDirective(directiveName) {
    return `[@${directiveName}] -> `;
}
exports.logDirective = logDirective;
function errorWithCode(code, message, nodes) {
    return new graphql_1.GraphQLError(message, nodes, undefined, undefined, undefined, undefined, {
        code,
    });
}
exports.errorWithCode = errorWithCode;
function findTypesContainingFieldWithReturnType(schema, node) {
    const returnType = graphql_1.getNamedType(node.type);
    if (!graphql_1.isObjectType(returnType))
        return [];
    const containingTypes = [];
    const types = schema.getTypeMap();
    for (const selectionSetType of Object.values(types)) {
        if (!graphql_1.isObjectType(selectionSetType))
            continue;
        const allFields = selectionSetType.getFields();
        Object.values(allFields).forEach(field => {
            const fieldReturnType = graphql_1.getNamedType(field.type);
            if (fieldReturnType === returnType) {
                containingTypes.push(fieldReturnType);
            }
        });
    }
    return containingTypes;
}
exports.findTypesContainingFieldWithReturnType = findTypesContainingFieldWithReturnType;
function findFieldsThatReturnType({ schema, typeToFind, }) {
    if (!graphql_1.isObjectType(typeToFind))
        return [];
    const fieldsThatReturnType = [];
    const types = schema.getTypeMap();
    for (const selectionSetType of Object.values(types)) {
        if (!graphql_1.isObjectType(selectionSetType))
            continue;
        const fieldsOnNamedType = selectionSetType.getFields();
        Object.values(fieldsOnNamedType).forEach(field => {
            const fieldReturnType = graphql_1.getNamedType(field.type);
            if (fieldReturnType === typeToFind) {
                fieldsThatReturnType.push(field);
            }
        });
    }
    return fieldsThatReturnType;
}
exports.findFieldsThatReturnType = findFieldsThatReturnType;
function selectionIncludesField({ selections, selectionSetType, typeToFind, fieldToFind, }) {
    for (const selection of selections) {
        const selectionName = selection.name.value;
        if (selectionName === fieldToFind &&
            graphql_1.isEqualType(selectionSetType, typeToFind))
            return true;
        const typeIncludesField = selectionName &&
            Object.keys(selectionSetType.getFields()).includes(selectionName);
        if (!selectionName || !typeIncludesField)
            continue;
        const returnType = graphql_1.getNamedType(selectionSetType.getFields()[selectionName].type);
        if (!returnType || !graphql_1.isObjectType(returnType))
            continue;
        const subselections = selection.selectionSet && selection.selectionSet.selections;
        if (subselections) {
            const selectionDoesIncludeField = selectionIncludesField({
                selectionSetType: returnType,
                selections: subselections,
                typeToFind,
                fieldToFind,
            });
            if (selectionDoesIncludeField)
                return true;
        }
    }
    return false;
}
exports.selectionIncludesField = selectionIncludesField;
function isTypeNodeAnEntity(node) {
    let isEntity = false;
    graphql_1.visit(node, {
        Directive(directive) {
            if (directive.name.value === 'key') {
                isEntity = true;
                return graphql_1.BREAK;
            }
        },
    });
    return isEntity;
}
exports.isTypeNodeAnEntity = isTypeNodeAnEntity;
function diffTypeNodes(firstNode, secondNode) {
    const fieldsDiff = Object.create(null);
    const inputValuesDiff = Object.create(null);
    const unionTypesDiff = Object.create(null);
    const locationsDiff = new Set();
    const argumentsDiff = Object.create(null);
    const document = {
        kind: graphql_1.Kind.DOCUMENT,
        definitions: [firstNode, secondNode],
    };
    function fieldVisitor(node) {
        const fieldName = node.name.value;
        const type = graphql_1.print(node.type);
        if (!fieldsDiff[fieldName]) {
            fieldsDiff[fieldName] = [type];
            return;
        }
        const fieldTypes = fieldsDiff[fieldName];
        if (fieldTypes[0] === type) {
            delete fieldsDiff[fieldName];
        }
        else {
            fieldTypes.push(type);
        }
    }
    function inputValueVisitor(node) {
        const fieldName = node.name.value;
        const type = graphql_1.print(node.type);
        if (!inputValuesDiff[fieldName]) {
            inputValuesDiff[fieldName] = [type];
            return;
        }
        const inputValueTypes = inputValuesDiff[fieldName];
        if (inputValueTypes[0] === type) {
            delete inputValuesDiff[fieldName];
        }
        else {
            inputValueTypes.push(type);
        }
    }
    graphql_1.visit(document, {
        FieldDefinition: fieldVisitor,
        InputValueDefinition: inputValueVisitor,
        UnionTypeDefinition(node) {
            if (!node.types)
                return graphql_1.BREAK;
            for (const namedTypeNode of node.types) {
                const name = namedTypeNode.name.value;
                if (unionTypesDiff[name]) {
                    delete unionTypesDiff[name];
                }
                else {
                    unionTypesDiff[name] = true;
                }
            }
        },
        DirectiveDefinition(node) {
            node.locations.forEach(location => {
                const locationName = location.value;
                if (locationsDiff.has(locationName)) {
                    locationsDiff.delete(locationName);
                }
                else {
                    locationsDiff.add(locationName);
                }
            });
            if (!node.arguments)
                return;
            node.arguments.forEach(argument => {
                const argumentName = argument.name.value;
                const printedType = graphql_1.print(argument.type);
                if (argumentsDiff[argumentName]) {
                    if (printedType === argumentsDiff[argumentName][0]) {
                        delete argumentsDiff[argumentName];
                    }
                    else {
                        argumentsDiff[argumentName].push(printedType);
                    }
                }
                else {
                    argumentsDiff[argumentName] = [printedType];
                }
            });
        },
    });
    const typeNameDiff = firstNode.name.value === secondNode.name.value
        ? []
        : [firstNode.name.value, secondNode.name.value];
    const kindDiff = firstNode.kind === secondNode.kind ? [] : [firstNode.kind, secondNode.kind];
    return {
        name: typeNameDiff,
        kind: kindDiff,
        fields: fieldsDiff,
        inputValues: inputValuesDiff,
        unionTypes: unionTypesDiff,
        locations: Array.from(locationsDiff),
        args: argumentsDiff,
    };
}
exports.diffTypeNodes = diffTypeNodes;
function typeNodesAreEquivalent(firstNode, secondNode) {
    const { name, kind, fields, inputValues, unionTypes, locations, args } = diffTypeNodes(firstNode, secondNode);
    return (name.length === 0 &&
        kind.length === 0 &&
        Object.keys(fields).length === 0 &&
        Object.keys(inputValues).length === 0 &&
        Object.keys(unionTypes).length === 0 &&
        locations.length === 0 &&
        Object.keys(args).length === 0);
}
exports.typeNodesAreEquivalent = typeNodesAreEquivalent;
function findTypeNodeInServiceList(typeName, serviceName, serviceList) {
    var _a;
    return (_a = serviceList.find(service => service.name === serviceName)) === null || _a === void 0 ? void 0 : _a.typeDefs.definitions.find(definition => {
        var _a;
        return 'name' in definition
            && ((_a = definition.name) === null || _a === void 0 ? void 0 : _a.value) === typeName;
    });
}
exports.findTypeNodeInServiceList = findTypeNodeInServiceList;
exports.defKindToExtKind = {
    [graphql_1.Kind.SCALAR_TYPE_DEFINITION]: graphql_1.Kind.SCALAR_TYPE_EXTENSION,
    [graphql_1.Kind.OBJECT_TYPE_DEFINITION]: graphql_1.Kind.OBJECT_TYPE_EXTENSION,
    [graphql_1.Kind.INTERFACE_TYPE_DEFINITION]: graphql_1.Kind.INTERFACE_TYPE_EXTENSION,
    [graphql_1.Kind.UNION_TYPE_DEFINITION]: graphql_1.Kind.UNION_TYPE_EXTENSION,
    [graphql_1.Kind.ENUM_TYPE_DEFINITION]: graphql_1.Kind.ENUM_TYPE_EXTENSION,
    [graphql_1.Kind.INPUT_OBJECT_TYPE_DEFINITION]: graphql_1.Kind.INPUT_OBJECT_TYPE_EXTENSION,
};
exports.executableDirectiveLocations = [
    'QUERY',
    'MUTATION',
    'SUBSCRIPTION',
    'FIELD',
    'FRAGMENT_DEFINITION',
    'FRAGMENT_SPREAD',
    'INLINE_FRAGMENT',
    'VARIABLE_DEFINITION',
];
function isApolloTypeSystemDirective(directive) {
    return directives_1.default.some(({ name }) => name === directive.name);
}
exports.isApolloTypeSystemDirective = isApolloTypeSystemDirective;
function isFederationDirective(directive) {
    return directives_1.federationDirectives.some(({ name }) => name === directive.name);
}
exports.isFederationDirective = isFederationDirective;
exports.reservedRootFields = ['_service', '_entities'];
exports.defaultRootOperationNameLookup = {
    query: 'Query',
    mutation: 'Mutation',
    subscription: 'Subscription',
};
function compositionHasErrors(compositionResult) {
    return 'errors' in compositionResult && !!compositionResult.errors;
}
exports.compositionHasErrors = compositionHasErrors;
function assertCompositionSuccess(compositionResult, message) {
    if (compositionHasErrors(compositionResult)) {
        throw new Error(message || 'Unexpected test failure');
    }
}
exports.assertCompositionSuccess = assertCompositionSuccess;
function assertCompositionFailure(compositionResult, message) {
    if (!compositionHasErrors(compositionResult)) {
        throw new Error(message || 'Unexpected test failure');
    }
}
exports.assertCompositionFailure = assertCompositionFailure;
function getFederationMetadata(obj) {
    var _a, _b, _c;
    if (typeof obj === "undefined")
        return undefined;
    else if (graphql_1.isNamedType(obj))
        return (_a = obj.extensions) === null || _a === void 0 ? void 0 : _a.federation;
    else if (graphql_1.isDirective(obj))
        return (_b = obj.extensions) === null || _b === void 0 ? void 0 : _b.federation;
    else
        return (_c = obj.extensions) === null || _c === void 0 ? void 0 : _c.federation;
}
exports.getFederationMetadata = getFederationMetadata;
//# sourceMappingURL=utils.js.map