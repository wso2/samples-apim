"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.builtins = void 0;
const tslib_1 = require("tslib");
const core = (0, tslib_1.__importStar)(require("@stoplight/spectral-core"));
const formats = (0, tslib_1.__importStar)(require("@stoplight/spectral-formats"));
const functions = (0, tslib_1.__importStar)(require("@stoplight/spectral-functions"));
const parsers = (0, tslib_1.__importStar)(require("@stoplight/spectral-parsers"));
const refResolver = (0, tslib_1.__importStar)(require("@stoplight/spectral-ref-resolver"));
const rulesets = (0, tslib_1.__importStar)(require("@stoplight/spectral-rulesets"));
const runtime = (0, tslib_1.__importStar)(require("@stoplight/spectral-runtime"));
const NAME = '@stoplight-spectral/builtins';
function registerModule(instanceId, id, members, overrides) {
    var _a, _b;
    var _c;
    const actualOverrides = overrides[id];
    const instances = ((_a = globalThis[_c = Symbol.for(NAME)]) !== null && _a !== void 0 ? _a : (globalThis[_c] = {}));
    const root = ((_b = instances[instanceId]) !== null && _b !== void 0 ? _b : (instances[instanceId] = {}));
    root[id] = actualOverrides ? { ...members, ...actualOverrides } : members;
    const m = `globalThis[Symbol.for('${NAME}')]['${instanceId}']['${id}']`;
    let code = '';
    for (const member of Object.keys(members)) {
        code += `export const ${member} = ${m}['${member}'];\n`;
    }
    return [id, code];
}
const builtins = (overrides = {}) => {
    const instanceId = Math.round(Math.random() * 1000000);
    const modules = Object.fromEntries([
        registerModule(instanceId, '@stoplight/spectral-core', core, overrides),
        registerModule(instanceId, '@stoplight/spectral-formats', formats, overrides),
        registerModule(instanceId, '@stoplight/spectral-functions', functions, overrides),
        registerModule(instanceId, '@stoplight/spectral-parsers', parsers, overrides),
        registerModule(instanceId, '@stoplight/spectral-ref-resolver', refResolver, overrides),
        registerModule(instanceId, '@stoplight/spectral-rulesets', rulesets, overrides),
        registerModule(instanceId, '@stoplight/spectral-runtime', runtime, overrides),
    ]);
    return {
        name: NAME,
        options(rawOptions) {
            const external = rawOptions.external;
            if (typeof external === 'function') {
                return {
                    ...rawOptions,
                    external: (((id, importer, isResolved) => !(id in modules) && external(id, importer, isResolved))),
                };
            }
            return rawOptions;
        },
        resolveId(id) {
            if (id in modules) {
                return id;
            }
            return null;
        },
        load(id) {
            if (id in modules) {
                return modules[id];
            }
            return;
        },
    };
};
exports.builtins = builtins;
//# sourceMappingURL=builtins.js.map