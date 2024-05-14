"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requiresFieldsMissingExternal = void 0;
const graphql_1 = require("graphql");
const utils_1 = require("../../utils");
const requiresFieldsMissingExternal = ({ schema, serviceList, }) => {
    var _a, _b;
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
                const typeFederationMetadata = utils_1.getFederationMetadata(namedType);
                const externalFieldsOnTypeForService = (_a = typeFederationMetadata === null || typeFederationMetadata === void 0 ? void 0 : typeFederationMetadata.externals) === null || _a === void 0 ? void 0 : _a[serviceName];
                const selections = fieldFederationMetadata === null || fieldFederationMetadata === void 0 ? void 0 : fieldFederationMetadata.requires;
                for (const selection of selections) {
                    const foundMatchingExternal = externalFieldsOnTypeForService
                        ? externalFieldsOnTypeForService.some(ext => ext.field.name.value === selection.name.value)
                        : undefined;
                    if (!foundMatchingExternal) {
                        const typeNode = utils_1.findTypeNodeInServiceList(typeName, serviceName, serviceList);
                        const fieldNode = typeNode &&
                            'fields' in typeNode ?
                            (_b = typeNode.fields) === null || _b === void 0 ? void 0 : _b.find(field => field.name.value === fieldName) : undefined;
                        const selectionSetNode = utils_1.findSelectionSetOnNode(fieldNode, 'requires', utils_1.printFieldSet(selections));
                        errors.push(utils_1.errorWithCode('REQUIRES_FIELDS_MISSING_EXTERNAL', utils_1.logServiceAndType(serviceName, typeName, fieldName) +
                            `requires the field \`${selection.name.value}\` to be marked as @external.`, selectionSetNode));
                    }
                }
            }
        }
    }
    return errors;
};
exports.requiresFieldsMissingExternal = requiresFieldsMissingExternal;
//# sourceMappingURL=requiresFieldsMissingExternal.js.map