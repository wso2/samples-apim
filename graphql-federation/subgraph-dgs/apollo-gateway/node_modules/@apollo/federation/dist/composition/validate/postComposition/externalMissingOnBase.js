"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.externalMissingOnBase = void 0;
const graphql_1 = require("graphql");
const utils_1 = require("../../utils");
const externalMissingOnBase = ({ schema }) => {
    const errors = [];
    const types = schema.getTypeMap();
    for (const [typeName, namedType] of Object.entries(types)) {
        if (!graphql_1.isObjectType(namedType))
            continue;
        const typeFederationMetadata = utils_1.getFederationMetadata(namedType);
        if (typeFederationMetadata === null || typeFederationMetadata === void 0 ? void 0 : typeFederationMetadata.externals) {
            for (const [serviceName, externalFieldsForService] of Object.entries(typeFederationMetadata.externals)) {
                for (const { field: externalField } of externalFieldsForService) {
                    const externalFieldName = externalField.name.value;
                    const allFields = namedType.getFields();
                    const matchingBaseField = allFields[externalFieldName];
                    if (!matchingBaseField) {
                        errors.push(utils_1.errorWithCode('EXTERNAL_MISSING_ON_BASE', utils_1.logServiceAndType(serviceName, typeName, externalFieldName) +
                            `marked @external but ${externalFieldName} is not defined on the base service of ${typeName} (${typeFederationMetadata.serviceName})`, utils_1.findDirectivesOnNode(externalField, 'external')));
                        continue;
                    }
                    const fieldFederationMetadata = utils_1.getFederationMetadata(matchingBaseField);
                    if (fieldFederationMetadata === null || fieldFederationMetadata === void 0 ? void 0 : fieldFederationMetadata.serviceName) {
                        errors.push(utils_1.errorWithCode('EXTERNAL_MISSING_ON_BASE', utils_1.logServiceAndType(serviceName, typeName, externalFieldName) +
                            `marked @external but ${externalFieldName} was defined in ${fieldFederationMetadata.serviceName}, not in the service that owns ${typeName} (${typeFederationMetadata.serviceName})`, utils_1.findDirectivesOnNode(externalField, 'external')));
                    }
                }
            }
        }
    }
    return errors;
};
exports.externalMissingOnBase = externalMissingOnBase;
//# sourceMappingURL=externalMissingOnBase.js.map