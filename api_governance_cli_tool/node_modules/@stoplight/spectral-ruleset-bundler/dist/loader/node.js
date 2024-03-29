"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bundleAndLoadRuleset = void 0;
const tslib_1 = require("tslib");
const module_1 = require("module");
const path = (0, tslib_1.__importStar)(require("@stoplight/path"));
const spectral_core_1 = require("@stoplight/spectral-core");
const bundle_1 = require("./common/bundle");
const node_1 = require("../presets/node");
const bundleAndLoadRuleset = async (rulesetFile, io, plugins = []) => {
    const ruleset = await (0, bundle_1.bundle)(rulesetFile, {
        target: 'node',
        format: 'commonjs',
        plugins: [...(0, node_1.node)(io), ...plugins],
    }, io);
    return new spectral_core_1.Ruleset(load(ruleset, rulesetFile), {
        severity: 'recommended',
        source: rulesetFile,
    });
};
exports.bundleAndLoadRuleset = bundleAndLoadRuleset;
function load(source, uri) {
    const actualUri = path.isURL(uri) ? uri.replace(/^https?:\//, '') : uri;
    const req = (0, module_1.createRequire)(actualUri);
    const m = {};
    const paths = [path.dirname(uri), __dirname];
    const _require = (id) => req(req.resolve(id, { paths }));
    Function('module, require', source)(m, _require);
    if (typeof m.exports !== 'object' || m.exports === null) {
        throw Error('No valid export found');
    }
    return m.exports;
}
//# sourceMappingURL=node.js.map