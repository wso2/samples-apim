"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = void 0;
const transformer = function (hooks) {
    hooks.add([
        /^$/,
        (_ruleset) => {
            var _a;
            const ruleset = _ruleset;
            const { except } = ruleset;
            if (except === void 0)
                return;
            delete ruleset.except;
            const overrides = ((_a = ruleset.overrides) !== null && _a !== void 0 ? _a : (ruleset.overrides = []));
            overrides.push(...Object.keys(except).map(pattern => ({
                files: [pattern.startsWith('#') ? `**${pattern}` : pattern],
                rules: except[pattern].reduce((rules, rule) => {
                    rules[rule] = 'off';
                    return rules;
                }, {}),
            })));
        },
    ]);
};
exports.default = transformer;
//# sourceMappingURL=except.js.map