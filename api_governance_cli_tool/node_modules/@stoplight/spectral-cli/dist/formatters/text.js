"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.text = void 0;
const utils_1 = require("./utils");
function renderResults(results) {
    return results
        .filter((result) => typeof result.source === 'string')
        .map(result => {
        const line = result.range.start.line + 1;
        const character = result.range.start.character + 1;
        const severity = (0, utils_1.getSeverityName)(result.severity);
        return `${result.source}:${line}:${character} ${severity} ${result.code} "${result.message}"`;
    })
        .join('\n');
}
function renderGroupedResults(groupedResults) {
    return Object.keys(groupedResults)
        .map(source => renderResults(groupedResults[source]))
        .join('\n');
}
const text = results => {
    const groupedResults = (0, utils_1.groupBySource)(results);
    return renderGroupedResults(groupedResults);
};
exports.text = text;
//# sourceMappingURL=text.js.map