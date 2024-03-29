"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getColorForSeverity = void 0;
const types_1 = require("@stoplight/types");
const SEVERITY_COLORS = {
    [types_1.DiagnosticSeverity.Error]: 'red',
    [types_1.DiagnosticSeverity.Warning]: 'yellow',
    [types_1.DiagnosticSeverity.Information]: 'blue',
    [types_1.DiagnosticSeverity.Hint]: 'white',
};
function getColorForSeverity(severity) {
    return SEVERITY_COLORS[severity];
}
exports.getColorForSeverity = getColorForSeverity;
//# sourceMappingURL=getColorForSeverity.js.map