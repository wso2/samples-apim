"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSummary = exports.getSummaryForSource = void 0;
const types_1 = require("@stoplight/types");
const groupBySeverity_1 = require("./groupBySeverity");
const pluralize_1 = require("./pluralize");
const printSummary = ({ errors, warnings, infos, hints, }) => {
    const total = errors + warnings + infos + hints;
    if (total === 0) {
        return null;
    }
    return [
        total,
        (0, pluralize_1.pluralize)(' problem', total),
        ' (',
        errors,
        (0, pluralize_1.pluralize)(' error', errors),
        ', ',
        warnings,
        (0, pluralize_1.pluralize)(' warning', warnings),
        ', ',
        infos,
        (0, pluralize_1.pluralize)(' info', infos),
        ', ',
        hints,
        (0, pluralize_1.pluralize)(' hint', hints),
        ')',
    ].join('');
};
const getSummaryForSource = (results) => {
    const { [types_1.DiagnosticSeverity.Error]: { length: errors }, [types_1.DiagnosticSeverity.Warning]: { length: warnings }, [types_1.DiagnosticSeverity.Information]: { length: infos }, [types_1.DiagnosticSeverity.Hint]: { length: hints }, } = (0, groupBySeverity_1.groupBySeverity)(results);
    return printSummary({
        errors,
        warnings,
        infos,
        hints,
    });
};
exports.getSummaryForSource = getSummaryForSource;
const getSummary = (groupedResults) => {
    let errorCount = 0;
    let warningCount = 0;
    let infoCount = 0;
    let hintCount = 0;
    for (const results of Object.values(groupedResults)) {
        const { [types_1.DiagnosticSeverity.Error]: errors, [types_1.DiagnosticSeverity.Warning]: warnings, [types_1.DiagnosticSeverity.Information]: infos, [types_1.DiagnosticSeverity.Hint]: hints, } = (0, groupBySeverity_1.groupBySeverity)(results);
        errorCount += errors.length;
        warningCount += warnings.length;
        infoCount += infos.length;
        hintCount += hints.length;
    }
    return printSummary({
        errors: errorCount,
        warnings: warningCount,
        infos: infoCount,
        hints: hintCount,
    });
};
exports.getSummary = getSummary;
//# sourceMappingURL=getSummary.js.map