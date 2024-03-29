"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertArray = exports.assertString = exports.assertRuleset = void 0;
const tslib_1 = require("tslib");
const ajv_1 = (0, tslib_1.__importDefault)(require("ajv"));
const schema_1 = (0, tslib_1.__importDefault)(require("./schema"));
const ajv = new ajv_1.default({
    strict: true,
    strictTuples: false,
});
ajv.addSchema(schema_1.default);
function assertRuleset(maybeRuleset) {
    if (!ajv.validate(schema_1.default, maybeRuleset)) {
        throw new Error('Invalid ruleset provided');
    }
}
exports.assertRuleset = assertRuleset;
function assertString(maybeString) {
    if (typeof maybeString !== 'string') {
        throw new TypeError(`${String(maybeString)} is not a string`);
    }
}
exports.assertString = assertString;
function assertArray(maybeArray) {
    if (!Array.isArray(maybeArray)) {
        throw new TypeError(`${String(maybeArray)} is not an array`);
    }
}
exports.assertArray = assertArray;
//# sourceMappingURL=index.js.map