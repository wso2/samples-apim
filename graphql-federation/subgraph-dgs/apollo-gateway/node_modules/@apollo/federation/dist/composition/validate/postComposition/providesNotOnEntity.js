"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.providesNotOnEntity = void 0;
const graphql_1 = require("graphql");
const utils_1 = require("../../utils");
const providesNotOnEntity = ({ schema, serviceList }) => {
    var _a, _b;
    const errors = [];
    const types = schema.getTypeMap();
    for (const [typeName, namedType] of Object.entries(types)) {
        if (!graphql_1.isObjectType(namedType))
            continue;
        for (const [fieldName, field] of Object.entries(namedType.getFields())) {
            const fieldFederationMetadata = utils_1.getFederationMetadata(field);
            const serviceName = fieldFederationMetadata === null || fieldFederationMetadata === void 0 ? void 0 : fieldFederationMetadata.serviceName;
            if (!serviceName &&
                (fieldFederationMetadata === null || fieldFederationMetadata === void 0 ? void 0 : fieldFederationMetadata.provides) &&
                !(fieldFederationMetadata === null || fieldFederationMetadata === void 0 ? void 0 : fieldFederationMetadata.belongsToValueType))
                throw Error('Internal Consistency Error: field with provides information does not have service name.');
            if (!serviceName)
                continue;
            const getBaseType = (type) => graphql_1.isListType(type) || graphql_1.isNonNullType(type)
                ? getBaseType(type.ofType)
                : type;
            const baseType = getBaseType(field.type);
            if (fieldFederationMetadata === null || fieldFederationMetadata === void 0 ? void 0 : fieldFederationMetadata.provides) {
                const typeNode = utils_1.findTypeNodeInServiceList(typeName, serviceName, serviceList);
                const fieldNode = typeNode && 'fields' in typeNode ?
                    (_a = typeNode.fields) === null || _a === void 0 ? void 0 : _a.find(field => field.name.value === fieldName) : undefined;
                const providesDirectiveNode = utils_1.findDirectivesOnNode(fieldNode, 'provides');
                if (!graphql_1.isObjectType(baseType)) {
                    errors.push(utils_1.errorWithCode('PROVIDES_NOT_ON_ENTITY', utils_1.logServiceAndType(serviceName, typeName, fieldName) +
                        `uses the @provides directive but \`${typeName}.${fieldName}\` returns \`${field.type}\`, which is not an Object or List type. @provides can only be used on Object types with at least one @key, or Lists of such Objects.`, providesDirectiveNode));
                    continue;
                }
                const fieldType = types[baseType.name];
                const selectedFieldIsEntity = (_b = utils_1.getFederationMetadata(fieldType)) === null || _b === void 0 ? void 0 : _b.keys;
                if (!selectedFieldIsEntity) {
                    errors.push(utils_1.errorWithCode('PROVIDES_NOT_ON_ENTITY', utils_1.logServiceAndType(serviceName, typeName, fieldName) +
                        `uses the @provides directive but \`${typeName}.${fieldName}\` does not return a type that has a @key. Try adding a @key to the \`${baseType}\` type.`, providesDirectiveNode));
                }
            }
        }
    }
    return errors;
};
exports.providesNotOnEntity = providesNotOnEntity;
//# sourceMappingURL=providesNotOnEntity.js.map