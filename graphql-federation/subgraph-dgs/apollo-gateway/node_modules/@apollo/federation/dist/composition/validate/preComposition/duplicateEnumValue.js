"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.duplicateEnumValue = void 0;
const graphql_1 = require("graphql");
const utils_1 = require("../../utils");
const duplicateEnumValue = ({ name: serviceName, typeDefs, }) => {
    const errors = [];
    const enums = {};
    graphql_1.visit(typeDefs, {
        EnumTypeDefinition(definition) {
            const name = definition.name.value;
            const enumValues = definition.values && definition.values.map(value => value.name.value);
            if (!enumValues)
                return definition;
            if (enums[name] && enums[name].length) {
                enumValues.map(valueName => {
                    if (enums[name].includes(valueName)) {
                        errors.push(utils_1.errorWithCode('DUPLICATE_ENUM_VALUE', utils_1.logServiceAndType(serviceName, name, valueName) +
                            `The enum, \`${name}\` has multiple definitions of the \`${valueName}\` value.`, definition));
                        return;
                    }
                    enums[name].push(valueName);
                });
            }
            else {
                enums[name] = enumValues;
            }
            return definition;
        },
        EnumTypeExtension(definition) {
            const name = definition.name.value;
            const enumValues = definition.values && definition.values.map(value => value.name.value);
            if (!enumValues)
                return definition;
            if (enums[name] && enums[name].length) {
                enumValues.map(valueName => {
                    var _a;
                    if (enums[name].includes(valueName)) {
                        errors.push(utils_1.errorWithCode('DUPLICATE_ENUM_VALUE', utils_1.logServiceAndType(serviceName, name, valueName) +
                            `The enum, \`${name}\` has multiple definitions of the \`${valueName}\` value.`, (_a = definition.values) === null || _a === void 0 ? void 0 : _a.find(enumValue => enumValue.name.value === valueName)));
                        return;
                    }
                    enums[name].push(valueName);
                });
            }
            else {
                enums[name] = enumValues;
            }
            return definition;
        },
    });
    return errors;
};
exports.duplicateEnumValue = duplicateEnumValue;
//# sourceMappingURL=duplicateEnumValue.js.map