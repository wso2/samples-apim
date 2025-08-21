"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.keysMatchBaseService = void 0;
const graphql_1 = require("graphql");
const utils_1 = require("../../utils");
const keysMatchBaseService = function ({ schema, serviceList, }) {
    const errors = [];
    const types = schema.getTypeMap();
    for (const [parentTypeName, parentType] of Object.entries(types)) {
        if (!graphql_1.isObjectType(parentType))
            continue;
        const typeFederationMetadata = utils_1.getFederationMetadata(parentType);
        if (typeFederationMetadata) {
            const { serviceName, keys } = typeFederationMetadata;
            if (serviceName && keys) {
                if (!keys[serviceName]) {
                    errors.push(utils_1.errorWithCode('KEY_MISSING_ON_BASE', utils_1.logServiceAndType(serviceName, parentTypeName) +
                        `appears to be an entity but no @key directives are specified on the originating type.`, utils_1.findTypeNodeInServiceList(parentTypeName, serviceName, serviceList)));
                    continue;
                }
                const availableKeys = (keys[serviceName] || []).map(utils_1.printFieldSet);
                Object.entries(keys)
                    .filter(([service]) => service !== serviceName)
                    .forEach(([extendingService, keyFields = []]) => {
                    const extendingServiceTypeNode = utils_1.findTypeNodeInServiceList(parentTypeName, extendingService, serviceList);
                    if (keyFields.length > 1) {
                        errors.push(utils_1.errorWithCode('MULTIPLE_KEYS_ON_EXTENSION', utils_1.logServiceAndType(extendingService, parentTypeName) +
                            `is extended from service ${serviceName} but specifies multiple @key directives. Extensions may only specify one @key.`, extendingServiceTypeNode));
                        return;
                    }
                    const extensionKey = utils_1.printFieldSet(keyFields[0]);
                    const selectionSetNode = !utils_1.isDirectiveDefinitionNode(extendingServiceTypeNode) ?
                        utils_1.findSelectionSetOnNode(extendingServiceTypeNode, 'key', extensionKey) : undefined;
                    if (!availableKeys.includes(extensionKey)) {
                        errors.push(utils_1.errorWithCode('KEY_NOT_SPECIFIED', utils_1.logServiceAndType(extendingService, parentTypeName) +
                            `extends from ${serviceName} but specifies an invalid @key directive. Valid @key directives are specified by the originating type. Available @key directives for this type are:\n` +
                            `\t${availableKeys
                                .map((fieldSet) => `@key(fields: "${fieldSet}")`)
                                .join('\n\t')}`, selectionSetNode));
                        return;
                    }
                });
            }
        }
    }
    return errors;
};
exports.keysMatchBaseService = keysMatchBaseService;
//# sourceMappingURL=keysMatchBaseService.js.map