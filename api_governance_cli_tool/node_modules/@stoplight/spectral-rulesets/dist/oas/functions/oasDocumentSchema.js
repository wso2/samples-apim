"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareResults = void 0;
const tslib_1 = require("tslib");
const spectral_core_1 = require("@stoplight/spectral-core");
const spectral_functions_1 = require("@stoplight/spectral-functions");
const spectral_formats_1 = require("@stoplight/spectral-formats");
const schemaOas2_0 = (0, tslib_1.__importStar)(require("../schemas/2.0.json"));
const schemaOas3_0 = (0, tslib_1.__importStar)(require("../schemas/3.0.json"));
const schemaOas3_1 = (0, tslib_1.__importStar)(require("../schemas/3.1.json"));
const OAS_SCHEMAS = {
    '2.0': schemaOas2_0,
    '3.0': schemaOas3_0,
    '3.1': schemaOas3_1,
};
function shouldIgnoreError(error) {
    return (error.keyword === 'oneOf' ||
        (error.keyword === 'required' && error.params.missingProperty === '$ref'));
}
const ERROR_MAP = [
    {
        path: /^components\/securitySchemes\/[^/]+$/,
        message: 'Invalid security scheme',
    },
];
function prepareResults(errors) {
    for (const error of errors) {
        if (error.keyword === 'additionalProperties') {
            error.instancePath = `${error.instancePath}/${String(error.params['additionalProperty'])}`;
        }
    }
    for (let i = 0; i < errors.length; i++) {
        const error = errors[i];
        if (i + 1 < errors.length && errors[i + 1].instancePath === error.instancePath) {
            errors.splice(i + 1, 1);
            i--;
        }
        else if (i > 0 && shouldIgnoreError(error) && errors[i - 1].instancePath.startsWith(error.instancePath)) {
            errors.splice(i, 1);
            i--;
        }
    }
}
exports.prepareResults = prepareResults;
function applyManualReplacements(errors) {
    for (const error of errors) {
        if (error.path === void 0)
            continue;
        const joinedPath = error.path.join('/');
        for (const mappedError of ERROR_MAP) {
            if (mappedError.path.test(joinedPath)) {
                error.message = mappedError.message;
                break;
            }
        }
    }
}
exports.default = (0, spectral_core_1.createRulesetFunction)({
    input: null,
    options: null,
}, function oasDocumentSchema(targetVal, opts, context) {
    const formats = context.document.formats;
    if (formats === null || formats === void 0)
        return;
    const schema = formats.has(spectral_formats_1.oas2)
        ? OAS_SCHEMAS['2.0']
        : formats.has(spectral_formats_1.oas3_1)
            ? OAS_SCHEMAS['3.1']
            : OAS_SCHEMAS['3.0'];
    const errors = (0, spectral_functions_1.schema)(targetVal, { allErrors: true, schema, prepareResults }, context);
    if (Array.isArray(errors)) {
        applyManualReplacements(errors);
    }
    return errors;
});
//# sourceMappingURL=oasDocumentSchema.js.map