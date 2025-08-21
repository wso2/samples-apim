"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.duplicateEnumOrScalar = void 0;
const graphql_1 = require("graphql");
const utils_1 = require("../../utils");
const duplicateEnumOrScalar = ({ name: serviceName, typeDefs, }) => {
    const errors = [];
    const enums = [];
    const scalars = [];
    graphql_1.visit(typeDefs, {
        EnumTypeDefinition(definition) {
            const name = definition.name.value;
            if (enums.includes(name)) {
                errors.push(utils_1.errorWithCode('DUPLICATE_ENUM_DEFINITION', utils_1.logServiceAndType(serviceName, name) +
                    `The enum, \`${name}\` was defined multiple times in this service. Remove one of the definitions for \`${name}\``, definition));
                return definition;
            }
            enums.push(name);
            return definition;
        },
        ScalarTypeDefinition(definition) {
            const name = definition.name.value;
            if (scalars.includes(name)) {
                errors.push(utils_1.errorWithCode('DUPLICATE_SCALAR_DEFINITION', utils_1.logServiceAndType(serviceName, name) +
                    `The scalar, \`${name}\` was defined multiple times in this service. Remove one of the definitions for \`${name}\``, definition));
                return definition;
            }
            scalars.push(name);
            return definition;
        },
    });
    return errors;
};
exports.duplicateEnumOrScalar = duplicateEnumOrScalar;
//# sourceMappingURL=duplicateEnumOrScalar.js.map