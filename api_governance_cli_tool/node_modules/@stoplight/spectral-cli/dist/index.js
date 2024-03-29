#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const yargs = (0, tslib_1.__importStar)(require("yargs"));
const spectral_runtime_1 = require("@stoplight/spectral-runtime");
const lint_1 = (0, tslib_1.__importDefault)(require("./commands/lint"));
if (typeof process.env.PROXY === 'string') {
    const ProxyAgent = require('proxy-agent');
    spectral_runtime_1.DEFAULT_REQUEST_OPTIONS.agent = new ProxyAgent(process.env.PROXY);
}
exports.default = yargs
    .scriptName('spectral')
    .parserConfiguration({
    'camel-case-expansion': true,
})
    .version()
    .help(true)
    .strictCommands()
    .strictOptions()
    .showHelpOnFail(true)
    .wrap(yargs.terminalWidth())
    .command(lint_1.default)
    .demandCommand(1, '').argv;
//# sourceMappingURL=index.js.map