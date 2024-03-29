"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.teamcity = void 0;
const utils_1 = require("./utils");
function escapeString(str) {
    if (str === void 0) {
        return '';
    }
    return String(str)
        .replace(/\|/g, '||')
        .replace(/'/g, "|'")
        .replace(/\n/g, '|n')
        .replace(/\r/g, '|r')
        .replace(/\u0085/g, '|x')
        .replace(/\u2028/g, '|l')
        .replace(/\u2029/g, '|p')
        .replace(/\[/g, '|[')
        .replace(/\]/g, '|]');
}
function inspectionType(result) {
    const code = escapeString(result.code);
    const severity = (0, utils_1.getSeverityName)(result.severity);
    const message = escapeString(result.message);
    return `##teamcity[inspectionType category='openapi' id='${code}' name='${code}' description='${severity} -- ${message}']`;
}
function inspection(result) {
    const code = escapeString(result.code);
    const severity = (0, utils_1.getSeverityName)(result.severity);
    const message = escapeString(result.message);
    const line = result.range.start.line + 1;
    return `##teamcity[inspection typeId='${code}' file='${result.source}' line='${line}' message='${severity} -- ${message}']`;
}
function renderResults(results) {
    return results
        .filter((result) => typeof result.source === 'string')
        .map(result => `${inspectionType(result)}\n${inspection(result)}`)
        .join('\n');
}
function renderGroupedResults(groupedResults) {
    return Object.keys(groupedResults)
        .map(source => renderResults(groupedResults[source]))
        .join('\n');
}
const teamcity = results => {
    const groupedResults = (0, utils_1.groupBySource)(results);
    return renderGroupedResults(groupedResults);
};
exports.teamcity = teamcity;
//# sourceMappingURL=teamcity.js.map