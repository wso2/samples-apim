"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = void 0;
const tslib_1 = require("tslib");
const ast_types_1 = require("ast-types");
const path = (0, tslib_1.__importStar)(require("@stoplight/path"));
const validation_1 = require("../validation");
const index_1 = require("../index");
const isBasicRuleset_1 = require("../utils/isBasicRuleset");
const REPLACEMENTS = {
    'spectral:oas': 'oas',
    'spectral:asyncapi': 'asyncapi',
};
async function processExtend(ctx, name) {
    if (name in REPLACEMENTS) {
        return ctx.tree.addImport(REPLACEMENTS[name], '@stoplight/spectral-rulesets');
    }
    const filepath = ctx.tree.resolveModule(name, ctx, 'ruleset');
    if (!(await (0, isBasicRuleset_1.isBasicRuleset)(filepath, ctx.opts.fetch))) {
        return ctx.tree.addImport(`${path.basename(filepath, true)}_${path.extname(filepath)}`, filepath, true);
    }
    return await (0, index_1.process)(await ctx.read(filepath, ctx.opts.fs, ctx.opts.fetch), {
        ...ctx,
        filepath,
        tree: ctx.tree.fork(),
    });
}
const transformer = function (hooks) {
    hooks.add([
        /^(\/overrides\/\d+)?\/extends$/,
        async (input, ctx) => {
            const _extends = input;
            if (typeof _extends === 'string') {
                return processExtend(ctx, _extends);
            }
            (0, validation_1.assertArray)(_extends);
            const extendedRulesets = [];
            for (const ruleset of _extends) {
                if (typeof ruleset === 'string') {
                    extendedRulesets.push(await processExtend(ctx, ruleset));
                }
                else {
                    extendedRulesets.push(ast_types_1.builders.arrayExpression([await processExtend(ctx, ruleset[0]), ast_types_1.builders.literal(ruleset[1])]));
                }
            }
            return ast_types_1.builders.arrayExpression(extendedRulesets);
        },
    ]);
};
exports.default = transformer;
//# sourceMappingURL=extends.js.map