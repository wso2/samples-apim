"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.process = exports.migrateRuleset = exports.isBasicRuleset = void 0;
const tslib_1 = require("tslib");
const json_1 = require("@stoplight/json");
const yaml_1 = require("@stoplight/yaml");
const spectral_runtime_1 = require("@stoplight/spectral-runtime");
const path_1 = require("@stoplight/path");
const transformers_1 = (0, tslib_1.__importDefault)(require("./transformers"));
const tree_1 = require("./tree");
const ast_types_1 = require("ast-types");
const validation_1 = require("./validation");
var isBasicRuleset_1 = require("./utils/isBasicRuleset");
Object.defineProperty(exports, "isBasicRuleset", { enumerable: true, get: function () { return isBasicRuleset_1.isBasicRuleset; } });
async function read(filepath, fs, fetch) {
    const input = (0, path_1.isURL)(filepath) ? await (await fetch(filepath)).text() : await fs.promises.readFile(filepath, 'utf8');
    const { data: ruleset } = (0, path_1.extname)(filepath) === '.json'
        ? (0, json_1.parseWithPointers)(input)
        : (0, yaml_1.parseWithPointers)(input, {
            mergeKeys: true,
        });
    (0, validation_1.assertRuleset)(ruleset);
    return ruleset;
}
async function migrateRuleset(filepath, opts) {
    const { fs, fetch = spectral_runtime_1.fetch, format, npmRegistry } = opts;
    const cwd = (0, path_1.dirname)(filepath);
    const tree = new tree_1.Tree({
        format,
        npmRegistry,
        scope: new tree_1.Scope(),
    });
    const ruleset = await read(filepath, fs, fetch);
    const hooks = new Set();
    const ctx = {
        cwd,
        filepath,
        tree,
        opts: {
            fetch,
            ...opts,
        },
        npmRegistry: npmRegistry !== null && npmRegistry !== void 0 ? npmRegistry : null,
        hooks,
        read,
    };
    for (const transformer of transformers_1.default) {
        transformer(ctx.hooks);
    }
    tree.ruleset = await process(ruleset, ctx);
    return tree.toString();
}
exports.migrateRuleset = migrateRuleset;
async function _process(input, ctx, path) {
    var _a;
    for (const [pattern, fn] of ctx.hooks) {
        if (pattern.test(path)) {
            const output = await fn(input, ctx);
            if (output !== void 0) {
                return output;
            }
        }
    }
    if (Array.isArray(input)) {
        return ast_types_1.builders.arrayExpression((await Promise.all(input.map(async (item, i) => await _process(item, ctx, `${path}/${String(i)}`)))).filter(Boolean));
    }
    else if (typeof input === 'number' || typeof input === 'boolean' || typeof input === 'string') {
        return ast_types_1.builders.literal(input);
    }
    else if (typeof input !== 'object') {
        throw new Error(`Cannot dump ${(_a = (0, json_1.safeStringify)(input)) !== null && _a !== void 0 ? _a : '<unknown value>'}`);
    }
    if (input === null) {
        return ast_types_1.builders.literal(null);
    }
    return ast_types_1.builders.objectExpression((await Promise.all(Object.entries(input).map(async ([key, value]) => {
        const propertyValue = await _process(value, ctx, `${path}/${key}`);
        if (propertyValue !== null) {
            return ast_types_1.builders.property('init', ast_types_1.builders.identifier(JSON.stringify(key)), propertyValue);
        }
        return null;
    }))).filter(Boolean));
}
async function process(input, ctx) {
    return (await _process(input, ctx, ''));
}
exports.process = process;
//# sourceMappingURL=index.js.map