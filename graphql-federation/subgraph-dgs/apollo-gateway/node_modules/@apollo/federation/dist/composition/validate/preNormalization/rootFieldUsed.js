"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rootFieldUsed = void 0;
const graphql_1 = require("graphql");
const utils_1 = require("../../utils");
const rootFieldUsed = ({ name: serviceName, typeDefs, }) => {
    const errors = [];
    const defaultRootOperationNames = Object.values(utils_1.defaultRootOperationNameLookup);
    const disallowedTypeNames = {};
    let hasSchemaDefinitionOrExtension = false;
    graphql_1.visit(typeDefs, {
        OperationTypeDefinition(node) {
            hasSchemaDefinitionOrExtension = true;
            if (!defaultRootOperationNames.includes(node.type.name
                .value)) {
                disallowedTypeNames[utils_1.defaultRootOperationNameLookup[node.operation]] = true;
            }
        },
    });
    if (hasSchemaDefinitionOrExtension) {
        graphql_1.visit(typeDefs, {
            ObjectTypeDefinition: visitType,
            ObjectTypeExtension: visitType,
        });
        function visitType(node) {
            if (disallowedTypeNames[node.name.value]) {
                const rootOperationName = node.name.value;
                errors.push(utils_1.errorWithCode(`ROOT_${rootOperationName.toUpperCase()}_USED`, utils_1.logServiceAndType(serviceName, rootOperationName) +
                    `Found invalid use of default root operation name \`${rootOperationName}\`. \`${rootOperationName}\` is disallowed when \`Schema.${rootOperationName.toLowerCase()}\` is set to a type other than \`${rootOperationName}\`.`, node));
            }
        }
    }
    return errors;
};
exports.rootFieldUsed = rootFieldUsed;
//# sourceMappingURL=rootFieldUsed.js.map