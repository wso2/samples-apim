"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = void 0;
const ast_types_1 = require("ast-types");
const validation_1 = require("../validation");
const ALIASES = {
    'json-schema-2019-09': 'json-schema-draft-2019-09',
    'json-schema-2020-12': 'json-schema-draft-2020-12',
};
const FORMATS = [
    'oas2',
    'oas3',
    'oas3.0',
    'oas3.1',
    'asyncapi2',
    'json-schema',
    'json-schema-loose',
    'json-schema-draft4',
    'json-schema-draft6',
    'json-schema-draft7',
    'json-schema-draft-2019-09',
    'json-schema-2019-09',
    'json-schema-draft-2020-12',
    'json-schema-2020-12',
];
function safeFormat(format) {
    return format
        .replace(/\.|([0-9])-(?=[0-9])/g, '$1_')
        .replace(/-([0-9a-z])/g, (match, char) => String(char).toUpperCase());
}
const REPLACEMENTS = Object.fromEntries(FORMATS.map(format => { var _a; return [format, safeFormat((_a = ALIASES[format]) !== null && _a !== void 0 ? _a : format)]; }));
function transform(input, ctx) {
    (0, validation_1.assertArray)(input);
    return ast_types_1.builders.arrayExpression(Array.from(new Set(input.map(format => {
        var _a;
        (0, validation_1.assertString)(format);
        return ctx.tree.addImport((_a = REPLACEMENTS[format]) !== null && _a !== void 0 ? _a : safeFormat(format), '@stoplight/spectral-formats');
    }))));
}
const transformer = function (hooks) {
    hooks.add([/^\/aliases\/[^/]+\/targets\/\d+\/formats$/, transform]);
    hooks.add([/^(\/overrides\/\d+)?\/formats$/, transform]);
    hooks.add([/^(\/overrides\/\d+)?\/rules\/[^/]+\/formats$/, transform]);
};
exports.default = transformer;
//# sourceMappingURL=formats.js.map