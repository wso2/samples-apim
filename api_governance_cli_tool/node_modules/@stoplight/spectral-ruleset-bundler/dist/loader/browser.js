"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bundleAndLoadRuleset = void 0;
const spectral_core_1 = require("@stoplight/spectral-core");
const bundle_1 = require("./common/bundle");
const runtime_1 = require("../presets/runtime");
const bundleAndLoadRuleset = async (rulesetFile, io, plugins = []) => {
    const ruleset = await (0, bundle_1.bundle)(rulesetFile, {
        format: 'iife',
        target: 'runtime',
        plugins: [...(0, runtime_1.runtime)(io), ...plugins],
    }, io);
    return new spectral_core_1.Ruleset(Function(`return ${ruleset}`)(), {
        severity: 'recommended',
        source: rulesetFile,
    });
};
exports.bundleAndLoadRuleset = bundleAndLoadRuleset;
//# sourceMappingURL=browser.js.map