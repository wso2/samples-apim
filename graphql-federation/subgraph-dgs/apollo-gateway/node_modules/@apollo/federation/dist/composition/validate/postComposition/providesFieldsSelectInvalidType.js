"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.providesFieldsSelectInvalidType = void 0;
const graphql_1 = require("graphql");
const utils_1 = require("../../utils");
const providesFieldsSelectInvalidType = ({ schema, serviceList, }) => {
    var _a;
    const errors = [];
    const types = schema.getTypeMap();
    for (const [typeName, namedType] of Object.entries(types)) {
        if (!graphql_1.isObjectType(namedType))
            continue;
        for (const [fieldName, field] of Object.entries(namedType.getFields())) {
            const fieldFederationMetadata = utils_1.getFederationMetadata(field);
            const serviceName = fieldFederationMetadata === null || fieldFederationMetadata === void 0 ? void 0 : fieldFederationMetadata.serviceName;
            if (!serviceName)
                continue;
            const fieldType = field.type;
            if (!graphql_1.isObjectType(fieldType))
                continue;
            const allFields = fieldType.getFields();
            if (fieldFederationMetadata === null || fieldFederationMetadata === void 0 ? void 0 : fieldFederationMetadata.provides) {
                const selections = fieldFederationMetadata.provides;
                for (const selection of selections) {
                    const name = selection.name.value;
                    const matchingField = allFields[name];
                    const typeNode = utils_1.findTypeNodeInServiceList(typeName, serviceName, serviceList);
                    const fieldNode = typeNode && 'fields' in typeNode ?
                        (_a = typeNode.fields) === null || _a === void 0 ? void 0 : _a.find(field => field.name.value === fieldName) : undefined;
                    const selectionSetNode = utils_1.findSelectionSetOnNode(fieldNode, 'provides', utils_1.printFieldSet(selections));
                    if (!matchingField) {
                        errors.push(utils_1.errorWithCode('PROVIDES_FIELDS_SELECT_INVALID_TYPE', utils_1.logServiceAndType(serviceName, typeName, fieldName) +
                            `A @provides selects ${name}, but ${fieldType.name}.${name} could not be found`, selectionSetNode));
                        continue;
                    }
                    if (graphql_1.isListType(matchingField.type) ||
                        (graphql_1.isNonNullType(matchingField.type) &&
                            graphql_1.isListType(graphql_1.getNullableType(matchingField.type)))) {
                        errors.push(utils_1.errorWithCode('PROVIDES_FIELDS_SELECT_INVALID_TYPE', utils_1.logServiceAndType(serviceName, typeName, fieldName) +
                            `A @provides selects ${fieldType.name}.${name}, which is a list type. A field cannot @provide lists.`, selectionSetNode));
                    }
                    if (graphql_1.isInterfaceType(matchingField.type) ||
                        (graphql_1.isNonNullType(matchingField.type) &&
                            graphql_1.isInterfaceType(graphql_1.getNullableType(matchingField.type)))) {
                        errors.push(utils_1.errorWithCode('PROVIDES_FIELDS_SELECT_INVALID_TYPE', utils_1.logServiceAndType(serviceName, typeName, fieldName) +
                            `A @provides selects ${fieldType.name}.${name}, which is an interface type. A field cannot @provide interfaces.`, selectionSetNode));
                    }
                    if (graphql_1.isUnionType(matchingField.type) ||
                        (graphql_1.isNonNullType(matchingField.type) &&
                            graphql_1.isUnionType(graphql_1.getNullableType(matchingField.type)))) {
                        errors.push(utils_1.errorWithCode('PROVIDES_FIELDS_SELECT_INVALID_TYPE', utils_1.logServiceAndType(serviceName, typeName, fieldName) +
                            `A @provides selects ${fieldType.name}.${name}, which is a union type. A field cannot @provide union types.`, selectionSetNode));
                    }
                }
            }
        }
    }
    return errors;
};
exports.providesFieldsSelectInvalidType = providesFieldsSelectInvalidType;
//# sourceMappingURL=providesFieldsSelectInvalidType.js.map