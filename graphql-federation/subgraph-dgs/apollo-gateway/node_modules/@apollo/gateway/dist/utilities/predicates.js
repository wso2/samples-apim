"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isObject = void 0;
function isObject(value) {
    return (value !== undefined &&
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value));
}
exports.isObject = isObject;
//# sourceMappingURL=predicates.js.map