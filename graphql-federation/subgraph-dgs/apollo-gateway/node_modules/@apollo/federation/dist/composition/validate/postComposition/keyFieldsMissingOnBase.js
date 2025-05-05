"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.keyFieldsMissingOnBase = void 0;
const graphql_1 = require("graphql");
const utils_1 = require("../../utils");
const keyFieldsMissingOnBase = ({ schema, serviceList, }) => {
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
                        if (matchingField) {
                            const typeNode = utils_1.findTypeNodeInServiceList(typeName, serviceName, serviceList);
                            const selectionSetNode = !utils_1.isDirectiveDefinitionNode(typeNode) ?
                                utils_1.findSelectionSetOnNode(typeNode, 'key', utils_1.printFieldSet(selectionSet)) : undefined;
                            const fieldFederationMetadata = utils_1.getFederationMetadata(matchingField);
                            if (fieldFederationMetadata === null || fieldFederationMetadata === void 0 ? void 0 : fieldFederationMetadata.serviceName) {
                                errors.push(utils_1.errorWithCode('KEY_FIELDS_MISSING_ON_BASE', utils_1.logServiceAndType(serviceName, typeName) +
                                    `A @key selects ${name}, but ${typeName}.${name} was either created or overwritten by ${fieldFederationMetadata.serviceName}, not ${serviceName}`, selectionSetNode));
                            }
                        }
                    }
                }
            }
        }
    }
    return errors;
};
exports.keyFieldsMissingOnBase = keyFieldsMissingOnBase;
//# sourceMappingURL=keyFieldsMissingOnBase.js.map