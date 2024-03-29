"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = void 0;
const tslib_1 = require("tslib");
const path = (0, tslib_1.__importStar)(require("@stoplight/path"));
const validation_1 = require("../validation");
const transformer = function (hooks) {
    hooks.add([
        /^$/,
        (_ruleset, ctx) => {
            const ruleset = _ruleset;
            const { functionsDir, functions } = ruleset;
            if (Array.isArray(functions) && functions.length > 0) {
                for (const fn of functions) {
                    (0, validation_1.assertString)(fn);
                    const resolved = ctx.tree.resolveModule(path.join('./', typeof functionsDir === 'string' ? functionsDir : 'functions', `./${fn}.js`), ctx, 'function');
                    const fnName = path.basename(resolved, true);
                    const identifier = ctx.tree.addImport(fnName, resolved, true);
                    ctx.tree.scope.store(`function-${fnName}`, identifier.name);
                }
            }
        },
    ]);
    hooks.add([
        /^\/functions$/,
        (value) => {
            (0, validation_1.assertArray)(value);
            return null;
        },
    ]);
    hooks.add([
        /^\/functionsDir$/,
        (value) => {
            (0, validation_1.assertString)(value);
            return null;
        },
    ]);
};
exports.default = transformer;
//# sourceMappingURL=functions.js.map