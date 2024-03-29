"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSeverityName = void 0;
const types_1 = require("@stoplight/types");
const SEVERITY_NAMES = {
    [types_1.DiagnosticSeverity.Error]: 'error',
    [types_1.DiagnosticSeverity.Warning]: 'warning',
    [types_1.DiagnosticSeverity.Information]: 'information',
    [types_1.DiagnosticSeverity.Hint]: 'hint',
};
function getSeverityName(severity) {
    return SEVERITY_NAMES[severity];
}
exports.getSeverityName = getSeverityName;
//# sourceMappingURL=getSeverityName.js.map