"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.html = void 0;
const tslib_1 = require("tslib");
const path = (0, tslib_1.__importStar)(require("@stoplight/path"));
const eol = (0, tslib_1.__importStar)(require("eol"));
const fs = (0, tslib_1.__importStar)(require("fs"));
const lodash_1 = require("lodash");
const utils_1 = require("../utils");
const pageTemplate = (0, lodash_1.template)(eol.lf(fs.readFileSync(path.join(__dirname, 'html-template-page.html'), 'utf8')));
const messageTemplate = (0, lodash_1.template)(eol.lf(fs.readFileSync(path.join(__dirname, 'html-template-message.html'), 'utf8')));
const resultTemplate = (0, lodash_1.template)(eol.lf(fs.readFileSync(path.join(__dirname, 'html-template-result.html'), 'utf8')));
function renderMessages(messages, parentIndex) {
    return messages
        .map(message => {
        const line = message.range.start.line + 1;
        const character = message.range.start.character + 1;
        return messageTemplate({
            parentIndex,
            line,
            character,
            severity: (0, utils_1.getSeverityName)(message.severity),
            message: message.message,
            code: message.code,
        });
    })
        .join('\n');
}
function renderResults(groupedResults) {
    return Object.keys(groupedResults)
        .map((source, index) => resultTemplate({
        index,
        color: groupedResults[source].length === 0
            ? 'success'
            : (0, utils_1.getSeverityName)((0, utils_1.getHighestSeverity)(groupedResults[source])),
        filePath: source,
        summary: (0, utils_1.getSummaryForSource)(groupedResults[source]),
    }) + renderMessages(groupedResults[source], index))
        .join('\n');
}
const html = results => {
    const color = results.length === 0 ? 'success' : (0, utils_1.getSeverityName)((0, utils_1.getHighestSeverity)(results));
    const groupedResults = (0, utils_1.groupBySource)(results);
    return pageTemplate({
        date: new Date(),
        color,
        summary: (0, utils_1.getSummary)(groupedResults),
        results: renderResults(groupedResults),
    });
};
exports.html = html;
//# sourceMappingURL=index.js.map