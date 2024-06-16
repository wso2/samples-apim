"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.keyFieldsSelectInvalidType = void 0;
const graphql_1 = require("graphql");
const utils_1 = require("../../utils");
const keyFieldsSelectInvalidType = ({ schema, serviceList, }) => {
    const errors = [];
    const types = schema.getTypeMap();
    for (const [typeName, namedType] of Object.entries(types)) {
        if (!graphql_1.isObjectType(namedType))
            continue;
        const typeFederationMetadata = utils_1.getFederationMetadata(namedType);
        if (typeFederationMetadata === null || typeFederationMetadata === void 0 ? void 0 : typeFederationMetadata.keys) {
            const allFieldsInType = namedType.getFields();
            for (const [serviceName, selectionSets = []] of Object.entries(typeFederationMetadata.keys)) {
                for (const selectionSet of selectionSets) {
                    for (const field of selectionSet) {
                        const name = field.name.value;
                        const matchingField = allFieldsInType[name];
                        const typeNode = utils_1.findTypeNodeInServiceList(typeName, serviceName, serviceList);
                        const selectionSetNode = !utils_1.isDirectiveDefinitionNode(typeNode) ?
                            utils_1.findSelectionSetOnNode(typeNode, 'key', utils_1.printFieldSet(selectionSet)) : undefined;
                        if (!matchingField) {
                            errors.push(utils_1.errorWithCode('KEY_FIELDS_SELECT_INVALID_TYPE', utils_1.logServiceAndType(serviceName, typeName) +
                                `A @key selects ${name}, but ${typeName}.${name} could not be found`, selectionSetNode));
                        }
                        if (matchingField) {
                            if (graphql_1.isInterfaceType(matchingField.type) ||
                                (graphql_1.isNonNullType(matchingField.type) &&
                                    graphql_1.isInterfaceType(graphql_1.getNullableType(matchingField.type)))) {
                                errors.push(utils_1.errorWithCode('KEY_FIELDS_SELECT_INVALID_TYPE', utils_1.logServiceAndType(serviceName, typeName) +
                                    `A @key selects ${typeName}.${name}, which is an interface type. Keys cannot select interfaces.`, selectionSetNode));
                            }
                            if (graphql_1.isUnionType(matchingField.type) ||
                                (graphql_1.isNonNullType(matchingField.type) &&
                                    graphql_1.isUnionType(graphql_1.getNullableType(matchingField.type)))) {
                                errors.push(utils_1.errorWithCode('KEY_FIELDS_SELECT_INVALID_TYPE', utils_1.logServiceAndType(serviceName, typeName) +
                                    `A @key selects ${typeName}.${name}, which is a union type. Keys cannot select union types.`, selectionSetNode));
                            }
                        }
                    }
                }
            }
        }
    }
    return errors;
};
exports.keyFieldsSelectInvalidType = keyFieldsSelectInvalidType;
//# sourceMappingURL=keyFieldsSelectInvalidType.js.map