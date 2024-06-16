"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.composeAndValidate = void 0;
const compose_1 = require("./compose");
const validate_1 = require("./validate");
const normalize_1 = require("./normalize");
const utils_1 = require("./utils");
function composeAndValidate(serviceList) {
    const errors = validate_1.validateServicesBeforeNormalization(serviceList);
    const normalizedServiceList = serviceList.map(({ typeDefs, ...rest }) => ({
        typeDefs: normalize_1.normalizeTypeDefs(typeDefs),
        ...rest
    }));
    errors.push(...validate_1.validateServicesBeforeComposition(normalizedServiceList));
    const compositionResult = compose_1.composeServices(normalizedServiceList);
    if (utils_1.compositionHasErrors(compositionResult)) {
        errors.push(...compositionResult.errors);
    }
    errors.push(...validate_1.validateComposedSchema({
        schema: compositionResult.schema,
        serviceList,
    }));
    if (errors.length > 0) {
        return {
            schema: compositionResult.schema,
            errors,
        };
    }
    else {
        return compositionResult;
    }
}
exports.composeAndValidate = composeAndValidate;
//# sourceMappingURL=composeAndValidate.js.map