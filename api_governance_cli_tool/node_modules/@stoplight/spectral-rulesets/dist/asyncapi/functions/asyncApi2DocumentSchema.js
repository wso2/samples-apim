"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareResults = void 0;
const spectral_core_1 = require("@stoplight/spectral-core");
const spectral_functions_1 = require("@stoplight/spectral-functions");
const spectral_formats_1 = require("@stoplight/spectral-formats");
const specs_1 = require("./utils/specs");
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
    for (let i = 0; i < errors.length; i++) {
        const error = errors[i];
        if (error.keyword === 'additionalProperties') {
            error.instancePath = `${error.instancePath}/${String(error.params['additionalProperty'])}`;
        }
        else if (error.keyword === 'required' && error.params.missingProperty === '$ref') {
            errors.splice(i, 1);
            i--;
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
const serializedSchemas = new Map();
function getSerializedSchema(version) {
    const schema = serializedSchemas.get(version);
    if (schema) {
        return schema;
    }
    const copied = (0, specs_1.getCopyOfSchema)(version);
    delete copied.definitions['http://json-schema.org/draft-07/schema'];
    delete copied.definitions['http://json-schema.org/draft-04/schema'];
    serializedSchemas.set(version, copied);
    return copied;
}
function getSchema(formats) {
    switch (true) {
        case formats.has(spectral_formats_1.aas2_6):
            return getSerializedSchema('2.6.0');
        case formats.has(spectral_formats_1.aas2_5):
            return getSerializedSchema('2.5.0');
        case formats.has(spectral_formats_1.aas2_4):
            return getSerializedSchema('2.4.0');
        case formats.has(spectral_formats_1.aas2_3):
            return getSerializedSchema('2.3.0');
        case formats.has(spectral_formats_1.aas2_2):
            return getSerializedSchema('2.2.0');
        case formats.has(spectral_formats_1.aas2_1):
            return getSerializedSchema('2.1.0');
        case formats.has(spectral_formats_1.aas2_0):
            return getSerializedSchema('2.0.0');
        default:
            return;
    }
}
exports.default = (0, spectral_core_1.createRulesetFunction)({
    input: null,
    options: null,
}, function asyncApi2DocumentSchema(targetVal, _, context) {
    var _a;
    const formats = (_a = context.document) === null || _a === void 0 ? void 0 : _a.formats;
    if (formats === null || formats === void 0)
        return;
    const schema = getSchema(formats);
    if (schema === void 0)
        return;
    const errors = (0, spectral_functions_1.schema)(targetVal, { allErrors: true, schema, prepareResults }, context);
    if (Array.isArray(errors)) {
        applyManualReplacements(errors);
    }
    return errors;
});
//# sourceMappingURL=asyncApi2DocumentSchema.js.map