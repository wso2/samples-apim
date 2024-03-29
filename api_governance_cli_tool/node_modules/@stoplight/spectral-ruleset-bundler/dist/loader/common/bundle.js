"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bundle = void 0;
const tslib_1 = require("tslib");
const spectral_ruleset_migrator_1 = require("@stoplight/spectral-ruleset-migrator");
const path = (0, tslib_1.__importStar)(require("@stoplight/path"));
const pony_cause_1 = require("pony-cause");
const stdin_1 = require("../../plugins/stdin");
const utils_1 = require("./utils");
const index_1 = require("../../index");
async function bundle(rulesetFile, bundleOptions, { fs }) {
    try {
        if ((0, utils_1.isBasicRuleset)(rulesetFile)) {
            const migratedRuleset = await (0, spectral_ruleset_migrator_1.migrateRuleset)(rulesetFile, {
                format: 'esm',
                fs,
            });
            rulesetFile = path.join(path.dirname(rulesetFile), '.spectral.js');
            return await (0, index_1.bundleRuleset)(rulesetFile, {
                ...bundleOptions,
                plugins: [(0, stdin_1.stdin)(migratedRuleset, rulesetFile), ...bundleOptions.plugins],
            });
        }
        else {
            return await (0, index_1.bundleRuleset)(rulesetFile, bundleOptions);
        }
    }
    catch (e) {
        if (!(0, utils_1.isErrorWithCode)(e) || e.code !== 'UNRESOLVED_ENTRY') {
            throw e;
        }
        throw new pony_cause_1.ErrorWithCause(`Could not read ruleset at ${rulesetFile}.`, { cause: e });
    }
}
exports.bundle = bundle;
//# sourceMappingURL=bundle.js.map