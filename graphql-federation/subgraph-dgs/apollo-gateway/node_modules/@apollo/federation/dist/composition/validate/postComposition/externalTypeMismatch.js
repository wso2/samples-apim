"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.externalTypeMismatch = void 0;
const graphql_1 = require("graphql");
const utils_1 = require("../../utils");
const externalTypeMismatch = ({ schema }) => {
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
                    const externalFieldType = graphql_1.typeFromAST(schema, externalField.type);
                    if (!externalFieldType) {
                        errors.push(utils_1.errorWithCode('EXTERNAL_TYPE_MISMATCH', utils_1.logServiceAndType(serviceName, typeName, externalFieldName) +
                            `the type of the @external field does not exist in the resulting composed schema`, externalField.type));
                    }
                    else if (matchingBaseField &&
                        !graphql_1.isEqualType(matchingBaseField.type, externalFieldType)) {
                        errors.push(utils_1.errorWithCode('EXTERNAL_TYPE_MISMATCH', utils_1.logServiceAndType(serviceName, typeName, externalFieldName) +
                            `Type \`${externalFieldType}\` does not match the type of the original field in ${typeFederationMetadata.serviceName} (\`${matchingBaseField.type}\`)`, externalField.type));
                    }
                }
            }
        }
    }
    return errors;
};
exports.externalTypeMismatch = externalTypeMismatch;
//# sourceMappingURL=externalTypeMismatch.js.map