"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const spectral_core_1 = require("@stoplight/spectral-core");
const spectral_runtime_1 = require("@stoplight/spectral-runtime");
const optionSchemas_1 = require("./optionSchemas");
exports.default = (0, spectral_core_1.createRulesetFunction)({
    input: {
        type: 'object',
    },
    options: optionSchemas_1.optionSchemas.xor,
}, function xor(targetVal, { properties }) {
    if (properties.length !== 2)
        return;
    const results = [];
    const intersection = Object.keys(targetVal).filter(value => -1 !== properties.indexOf(value));
    if (intersection.length !== 1) {
        results.push({
            message: `${(0, spectral_runtime_1.printValue)(properties[0])} and ${(0, spectral_runtime_1.printValue)(properties[1])} must not be both defined or both undefined`,
        });
    }
    return results;
});
//# sourceMappingURL=xor.js.map