"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.providesFieldsMissingExternal = void 0;
const graphql_1 = require("graphql");
const utils_1 = require("../../utils");
const providesFieldsMissingExternal = ({ schema, serviceList, }) => {
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
            const fieldType = field.type;
            if (!graphql_1.isObjectType(fieldType))
                continue;
            const fieldTypeFederationMetadata = utils_1.getFederationMetadata(fieldType);
            const externalFieldsOnTypeForService = (_a = fieldTypeFederationMetadata === null || fieldTypeFederationMetadata === void 0 ? void 0 : fieldTypeFederationMetadata.externals) === null || _a === void 0 ? void 0 : _a[serviceName];
            if (fieldFederationMetadata === null || fieldFederationMetadata === void 0 ? void 0 : fieldFederationMetadata.provides) {
                const selections = fieldFederationMetadata.provides;
                for (const selection of selections) {
                    const foundMatchingExternal = externalFieldsOnTypeForService
                        ? externalFieldsOnTypeForService.some(ext => ext.field.name.value === selection.name.value)
                        : undefined;
                    if (!foundMatchingExternal) {
                        const typeNode = utils_1.findTypeNodeInServiceList(typeName, serviceName, serviceList);
                        errors.push(utils_1.errorWithCode('PROVIDES_FIELDS_MISSING_EXTERNAL', utils_1.logServiceAndType(serviceName, typeName, fieldName) +
                            `provides the field \`${selection.name.value}\` and requires ${fieldType}.${selection.name.value} to be marked as @external.`, typeNode && 'fields' in typeNode ?
                            (_b = typeNode === null || typeNode === void 0 ? void 0 : typeNode.fields) === null || _b === void 0 ? void 0 : _b.find(field => field.name.value === selection.name.value) : undefined));
                    }
                }
            }
        }
    }
    return errors;
};
exports.providesFieldsMissingExternal = providesFieldsMissingExternal;
//# sourceMappingURL=providesFieldsMissingExternal.js.map