"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Yaml = exports.parseYaml = void 0;
const yaml_1 = require("@stoplight/yaml");
const parseYaml = (input) => (0, yaml_1.parseWithPointers)(input, {
    ignoreDuplicateKeys: false,
    mergeKeys: true,
    preserveKeyOrder: true,
});
exports.parseYaml = parseYaml;
exports.Yaml = {
    parse: exports.parseYaml,
    getLocationForJsonPath: yaml_1.getLocationForJsonPath,
    trapAccess: yaml_1.trapAccess,
};
//# sourceMappingURL=yaml.js.map