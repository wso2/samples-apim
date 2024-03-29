"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupBySeverity = void 0;
const types_1 = require("@stoplight/types");
const groupBySeverity = (results) => results.reduce((group, result) => {
    group[result.severity].push(result);
    return group;
}, {
    [types_1.DiagnosticSeverity.Error]: [],
    [types_1.DiagnosticSeverity.Warning]: [],
    [types_1.DiagnosticSeverity.Hint]: [],
    [types_1.DiagnosticSeverity.Information]: [],
});
exports.groupBySeverity = groupBySeverity;
//# sourceMappingURL=groupBySeverity.js.map