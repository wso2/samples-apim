"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.externalUnused = void 0;
const graphql_1 = require("graphql");
const utils_1 = require("../../utils");
const externalUnused = ({ schema }) => {
    const errors = [];
    const types = schema.getTypeMap();
    for (const [parentTypeName, parentType] of Object.entries(types)) {
        if (!graphql_1.isObjectType(parentType))
            continue;
        const typeFederationMetadata = utils_1.getFederationMetadata(parentType);
        if (typeFederationMetadata) {
            const { serviceName, keys } = typeFederationMetadata;
            if (serviceName && keys && !keys[serviceName])
                continue;
        }
        if (typeFederationMetadata === null || typeFederationMetadata === void 0 ? void 0 : typeFederationMetadata.externals) {
            for (const [serviceName, externalFieldsForService] of Object.entries(typeFederationMetadata.externals)) {
                for (const { field: externalField } of externalFieldsForService) {
                    const externalFieldName = externalField.name.value;
                    const hasMatchingKeyOnType = Boolean(utils_1.hasMatchingFieldInDirectives({
                        directives: utils_1.findDirectivesOnNode(parentType.astNode, 'key'),
                        fieldNameToMatch: externalFieldName,
                        namedType: parentType,
                    }));
                    if (hasMatchingKeyOnType)
                        continue;
                    const hasMatchingProvidesOnAnotherType = utils_1.findFieldsThatReturnType({
                        schema,
                        typeToFind: parentType,
                    }).some(field => utils_1.findDirectivesOnNode(field.astNode, 'provides').some(directive => {
                        if (!directive.arguments)
                            return false;
                        const selections = utils_1.isStringValueNode(directive.arguments[0].value) &&
                            utils_1.parseSelections(directive.arguments[0].value.value);
                        return (selections &&
                            selections.some(selection => selection.kind === graphql_1.Kind.FIELD &&
                                selection.name.value === externalFieldName));
                    }));
                    if (hasMatchingProvidesOnAnotherType)
                        continue;
                    const hasMatchingRequiresOnAnotherType = Object.values(schema.getTypeMap()).some(namedType => {
                        if (!graphql_1.isObjectType(namedType))
                            return false;
                        return Object.values(namedType.getFields()).some(field => utils_1.findDirectivesOnNode(field.astNode, 'requires').some(directive => {
                            if (!directive.arguments)
                                return false;
                            const selections = utils_1.isStringValueNode(directive.arguments[0].value) &&
                                utils_1.parseSelections(directive.arguments[0].value.value);
                            if (!selections)
                                return false;
                            return utils_1.selectionIncludesField({
                                selections,
                                selectionSetType: namedType,
                                typeToFind: parentType,
                                fieldToFind: externalFieldName,
                            });
                        }));
                    });
                    if (hasMatchingRequiresOnAnotherType)
                        continue;
                    const hasMatchingRequiresOnType = Object.values(parentType.getFields()).some(maybeRequiresField => {
                        var _a;
                        const fieldOwner = (_a = utils_1.getFederationMetadata(maybeRequiresField)) === null || _a === void 0 ? void 0 : _a.serviceName;
                        if (fieldOwner !== serviceName)
                            return false;
                        const requiresDirectives = utils_1.findDirectivesOnNode(maybeRequiresField.astNode, 'requires');
                        return utils_1.hasMatchingFieldInDirectives({
                            directives: requiresDirectives,
                            fieldNameToMatch: externalFieldName,
                            namedType: parentType,
                        });
                    });
                    if (hasMatchingRequiresOnType)
                        continue;
                    const fieldsOnInterfacesImplementedByParentType = new Set();
                    for (const _interface of parentType.getInterfaces()) {
                        for (const fieldName in _interface.getFields()) {
                            fieldsOnInterfacesImplementedByParentType.add(fieldName);
                        }
                    }
                    if (fieldsOnInterfacesImplementedByParentType.has(externalFieldName)) {
                        continue;
                    }
                    errors.push(utils_1.errorWithCode('EXTERNAL_UNUSED', utils_1.logServiceAndType(serviceName, parentTypeName, externalFieldName) +
                        `is marked as @external but is not used by a @requires, @key, or @provides directive.`, utils_1.findDirectivesOnNode(externalField, 'external')));
                }
            }
        }
    }
    return errors;
};
exports.externalUnused = externalUnused;
//# sourceMappingURL=externalUnused.js.map