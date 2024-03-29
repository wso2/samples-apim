"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHighestSeverity = void 0;
const types_1 = require("@stoplight/types");
const getHighestSeverity = (results) => results.length === 0 ? types_1.DiagnosticSeverity.Hint : Math.min(...results.map(({ severity }) => severity));
exports.getHighestSeverity = getHighestSeverity;
//# sourceMappingURL=getHighestSeverity.js.map