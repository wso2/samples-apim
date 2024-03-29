"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lint = void 0;
const tslib_1 = require("tslib");
const spectral_core_1 = require("@stoplight/spectral-core");
const spectral_runtime_1 = require("@stoplight/spectral-runtime");
const Parsers = (0, tslib_1.__importStar)(require("@stoplight/spectral-parsers"));
const utils_1 = require("./utils");
const getResolver_1 = require("./utils/getResolver");
const errors_1 = require("../../errors");
async function lint(documents, flags) {
    var _a;
    const spectral = new spectral_core_1.Spectral({
        resolver: (0, getResolver_1.getResolver)(flags.resolver, process.env.PROXY),
    });
    const ruleset = await (0, utils_1.getRuleset)(flags.ruleset);
    spectral.setRuleset(ruleset);
    if (flags.verbose === true) {
        const rules = Object.values(ruleset.rules);
        console.info(`Found ${rules.length} rules (${rules.filter(rule => rule.enabled).length} enabled)`);
    }
    const [globs, fileDescriptors] = (0, utils_1.segregateEntriesPerKind)(documents);
    const [targetUris, unmatchedPatterns] = await (0, utils_1.listFiles)(globs, !flags.failOnUnmatchedGlobs);
    const results = [];
    if (unmatchedPatterns.length > 0) {
        if (flags.failOnUnmatchedGlobs) {
            throw new errors_1.CLIError(`Unmatched glob patterns: \`${unmatchedPatterns.join(',')}\``);
        }
        for (const unmatchedPattern of unmatchedPatterns) {
            console.log(`Glob pattern \`${unmatchedPattern}\` did not match any files`);
        }
    }
    for (const targetUri of [...targetUris, ...fileDescriptors]) {
        if (flags.verbose === true) {
            console.info(`Linting ${targetUri}`);
        }
        const document = await createDocument(targetUri, { encoding: flags.encoding }, (_a = flags.stdinFilepath) !== null && _a !== void 0 ? _a : '<STDIN>');
        results.push(...(await spectral.run(document, {
            ignoreUnknownFormat: flags.ignoreUnknownFormat,
        })));
    }
    return results;
}
exports.lint = lint;
const createDocument = async (identifier, opts, source) => {
    if (typeof identifier === 'string') {
        return new spectral_core_1.Document(await (0, spectral_runtime_1.readParsable)(identifier, opts), Parsers.Yaml, identifier);
    }
    return new spectral_core_1.Document(await (0, utils_1.readFileDescriptor)(identifier, opts), Parsers.Yaml, source);
};
//# sourceMappingURL=linter.js.map