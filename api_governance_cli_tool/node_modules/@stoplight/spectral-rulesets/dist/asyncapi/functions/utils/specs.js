"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCopyOfSchema = exports.latestVersion = void 0;
const tslib_1 = require("tslib");
const specs_1 = (0, tslib_1.__importDefault)(require("@asyncapi/specs"));
const versions = Object.keys(specs_1.default);
exports.latestVersion = versions[versions.length - 1];
function getCopyOfSchema(version) {
    return JSON.parse(JSON.stringify(specs_1.default[version]));
}
exports.getCopyOfSchema = getCopyOfSchema;
//# sourceMappingURL=specs.js.map