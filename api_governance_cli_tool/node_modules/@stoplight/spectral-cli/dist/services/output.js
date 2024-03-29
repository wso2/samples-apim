"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeOutput = exports.formatOutput = void 0;
const tslib_1 = require("tslib");
const process = (0, tslib_1.__importStar)(require("process"));
const fs_1 = require("fs");
const formatters_1 = require("../formatters");
const formatters = {
    json: formatters_1.json,
    stylish: formatters_1.stylish,
    pretty: formatters_1.pretty,
    junit: formatters_1.junit,
    html: formatters_1.html,
    text: formatters_1.text,
    teamcity: formatters_1.teamcity,
};
function formatOutput(results, format, formatOptions) {
    return formatters[format](results, formatOptions);
}
exports.formatOutput = formatOutput;
async function writeOutput(outputStr, outputFile) {
    if (outputFile !== '<stdout>') {
        await fs_1.promises.writeFile(outputFile, outputStr);
    }
    else {
        process.stdout.write(outputStr);
    }
}
exports.writeOutput = writeOutput;
//# sourceMappingURL=output.js.map