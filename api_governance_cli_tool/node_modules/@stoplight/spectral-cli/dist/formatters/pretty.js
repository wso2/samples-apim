"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pretty = void 0;
const tslib_1 = require("tslib");
const spectral_runtime_1 = require("@stoplight/spectral-runtime");
const chalk_1 = (0, tslib_1.__importDefault)(require("chalk"));
const utils_1 = require("./utils");
function formatRange(range) {
    if (range === void 0)
        return '';
    return ` ${range.start.line + 1}:${range.start.character + 1}`;
}
const pretty = results => {
    const cliui = require('cliui');
    let output = '\n';
    const DEFAULT_TOTAL_WIDTH = process.stdout.columns;
    const COLUMNS = [10, 13, 25, 20, 20];
    const variableColumns = DEFAULT_TOTAL_WIDTH - COLUMNS.reduce((a, b) => a + b);
    COLUMNS[2] = Math.floor(variableColumns / 3);
    COLUMNS[3] = Math.ceil((variableColumns / 3) * 2);
    const PAD_TOP0_LEFT2 = [0, 0, 0, 2];
    const PAD_TOP1_LEFT0 = [1, 0, 0, 0];
    const ui = cliui({ width: DEFAULT_TOTAL_WIDTH, wrap: true });
    const groupedResults = (0, utils_1.groupBySource)(results);
    const summaryColor = (0, utils_1.getColorForSeverity)((0, utils_1.getHighestSeverity)(results));
    const summaryText = (0, utils_1.getSummary)(groupedResults);
    const uniqueIssues = [];
    Object.keys(groupedResults).forEach(i => {
        const pathResults = groupedResults[i];
        ui.div({ text: 'File:   ' + i, padding: PAD_TOP1_LEFT0 });
        pathResults.forEach(result => {
            if (!uniqueIssues.includes(result.code)) {
                uniqueIssues.push(result.code);
            }
            const color = (0, utils_1.getColorForSeverity)(result.severity);
            ui.div({ text: chalk_1.default[color](formatRange(result.range)), width: COLUMNS[0] }, {
                text: chalk_1.default[color].inverse((0, utils_1.getSeverityName)(result.severity).toUpperCase()),
                padding: PAD_TOP0_LEFT2,
                width: COLUMNS[1],
            }, { text: chalk_1.default[color].bold(result.code), padding: PAD_TOP0_LEFT2, width: COLUMNS[2] }, { text: chalk_1.default.gray(result.message), padding: PAD_TOP0_LEFT2, width: COLUMNS[3] }, { text: chalk_1.default.cyan((0, spectral_runtime_1.printPath)(result.path, spectral_runtime_1.PrintStyle.Dot)), padding: PAD_TOP0_LEFT2 });
            ui.div();
        });
    });
    ui.div();
    output += ui.toString();
    output += chalk_1.default[summaryColor].bold(`${uniqueIssues.length} Unique Issue(s)\n`);
    output += chalk_1.default[summaryColor].bold(`\u2716${summaryText !== null ? ` ${summaryText}` : ''}\n`);
    return output;
};
exports.pretty = pretty;
//# sourceMappingURL=pretty.js.map