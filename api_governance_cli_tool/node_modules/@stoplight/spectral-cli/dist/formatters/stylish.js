"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stylish = void 0;
const tslib_1 = require("tslib");
const chalk_1 = (0, tslib_1.__importDefault)(require("chalk"));
const stripAnsi = require("strip-ansi");
const text_table_1 = (0, tslib_1.__importDefault)(require("text-table"));
const spectral_runtime_1 = require("@stoplight/spectral-runtime");
const utils_1 = require("./utils");
function formatRange(range) {
    if (range === void 0)
        return '';
    return ` ${range.start.line + 1}:${range.start.character + 1}`;
}
function getMessageType(severity) {
    const color = (0, utils_1.getColorForSeverity)(severity);
    const name = (0, utils_1.getSeverityName)(severity);
    return chalk_1.default[color](name);
}
const stylish = results => {
    let output = '\n';
    const groupedResults = (0, utils_1.groupBySource)(results);
    const summaryColor = (0, utils_1.getColorForSeverity)((0, utils_1.getHighestSeverity)(results));
    const summaryText = (0, utils_1.getSummary)(groupedResults);
    Object.keys(groupedResults).map(path => {
        const pathResults = groupedResults[path];
        output += `${chalk_1.default.underline(path)}\n`;
        const pathTableData = pathResults.map((result) => {
            var _a;
            return [
                formatRange(result.range),
                getMessageType(result.severity),
                (_a = result.code) !== null && _a !== void 0 ? _a : '',
                result.message,
                (0, spectral_runtime_1.printPath)(result.path, spectral_runtime_1.PrintStyle.Dot),
            ];
        });
        output += `${(0, text_table_1.default)(pathTableData, {
            align: ['c', 'r', 'l'],
            stringLength(str) {
                return stripAnsi(str).length;
            },
        })
            .split('\n')
            .map((el) => el.replace(/(\d+)\s+(\d+)/u, (m, p1, p2) => chalk_1.default.dim(`${p1}:${p2}`)))
            .join('\n')}\n\n`;
    });
    if (summaryText === null) {
        return '';
    }
    output += chalk_1.default[summaryColor].bold(`\u2716 ${summaryText}\n`);
    return output;
};
exports.stylish = stylish;
//# sourceMappingURL=stylish.js.map