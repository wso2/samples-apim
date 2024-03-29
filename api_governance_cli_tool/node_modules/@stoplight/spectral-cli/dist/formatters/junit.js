"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.junit = void 0;
const path_1 = require("@stoplight/path");
const lodash_1 = require("lodash");
const spectral_runtime_1 = require("@stoplight/spectral-runtime");
const utils_1 = require("./utils");
function prepareForCdata(text) {
    return text.replace(']]>', ']]]]><![CDATA[>');
}
const junit = (results, { failSeverity }) => {
    var _a;
    let output = '';
    output += '<?xml version="1.0" encoding="utf-8"?>\n';
    output += '<testsuites>\n';
    const groupedResults = (0, utils_1.groupBySource)(results);
    for (const [source, validationResults] of Object.entries(groupedResults)) {
        const classname = source.replace(new RegExp(`${(0, lodash_1.escapeRegExp)((0, path_1.extname)(source))}$`), '');
        if (validationResults.length > 0) {
            const filteredValidationResults = validationResults.filter(result => result.severity <= failSeverity);
            output += `<testsuite package="org.spectral" time="0" tests="${filteredValidationResults.length}" errors="0" failures="${filteredValidationResults.length}" name="${source}">\n`;
            for (const result of filteredValidationResults) {
                const path = (0, spectral_runtime_1.printPath)(result.path, spectral_runtime_1.PrintStyle.EscapedPointer);
                output += `<testcase time="0" name="org.spectral.${(_a = result.code) !== null && _a !== void 0 ? _a : 'unknown'}${path.length > 0 ? `(${(0, utils_1.xmlEscape)(path)})` : ''}" classname="${classname}">`;
                output += `<failure message="${(0, utils_1.xmlEscape)(result.message)}">`;
                output += '<![CDATA[';
                output += `line ${result.range.start.line + 1}, col ${result.range.start.character + 1}, `;
                output += `${prepareForCdata(result.message)} (${result.code}) `;
                output += `at path ${prepareForCdata(path)}`;
                output += ']]>';
                output += `</failure>`;
                output += '</testcase>\n';
            }
            output += '</testsuite>\n';
        }
        else {
            output += `<testsuite package="org.spectral" time="0" tests="1" errors="0" name="${source}">\n`;
            output += `<testcase time="0" name="${source}" classname="${classname}" />\n`;
            output += '</testsuite>\n';
        }
    }
    output += '</testsuites>\n';
    return output;
};
exports.junit = junit;
//# sourceMappingURL=junit.js.map