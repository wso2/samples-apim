"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requiresFieldsMissingOnBase = void 0;
const graphql_1 = require("graphql");
const utils_1 = require("../../utils");
const requiresFieldsMissingOnBase = ({ schema, serviceList, }) => {
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
            if (fieldFederationMetadata === null || fieldFederationMetadata === void 0 ? void 0 : fieldFederationMetadata.requires) {
                const selections = fieldFederationMetadata.requires;
                for (const selection of selections) {
                    const matchingFieldOnType = namedType.getFields()[selection.name.value];
                    const typeFederationMetadata = utils_1.getFederationMetadata(matchingFieldOnType);
                    if (typeFederationMetadata === null || typeFederationMetadata === void 0 ? void 0 : typeFederationMetadata.serviceName) {
                        const typeNode = utils_1.findTypeNodeInServiceList(typeName, serviceName, serviceList);
                        const fieldNode = typeNode &&
                            'fields' in typeNode ?
                            (_a = typeNode.fields) === null || _a === void 0 ? void 0 : _a.find(field => field.name.value === fieldName) : undefined;
                        const selectionSetNode = utils_1.findSelectionSetOnNode(fieldNode, 'requires', utils_1.printFieldSet(selections));
                        errors.push(utils_1.errorWithCode('REQUIRES_FIELDS_MISSING_ON_BASE', utils_1.logServiceAndType(serviceName, typeName, fieldName) +
                            `requires the field \`${selection.name.value}\` to be @external. @external fields must exist on the base type, not an extension.`, selectionSetNode));
                    }
                }
            }
        }
    }
    return errors;
};
exports.requiresFieldsMissingOnBase = requiresFieldsMissingOnBase;
//# sourceMappingURL=requiresFieldsMissingOnBase.js.map