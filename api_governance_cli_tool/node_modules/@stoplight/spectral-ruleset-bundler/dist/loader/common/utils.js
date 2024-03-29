"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isErrorWithCode = exports.isBasicRuleset = void 0;
const tslib_1 = require("tslib");
const path = (0, tslib_1.__importStar)(require("@stoplight/path"));
function isBasicRuleset(filepath) {
    return /\.(json|ya?ml)$/.test(path.extname(filepath));
}
exports.isBasicRuleset = isBasicRuleset;
function isErrorWithCode(error) {
    return error instanceof Error && 'code' in error && typeof error.code === 'string';
}
exports.isErrorWithCode = isErrorWithCode;
//# sourceMappingURL=utils.js.map