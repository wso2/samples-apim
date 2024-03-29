"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listFiles = void 0;
const tslib_1 = require("tslib");
const path_1 = require("@stoplight/path");
const fast_glob_1 = (0, tslib_1.__importDefault)(require("fast-glob"));
const GLOB_OPTIONS = {
    absolute: true,
    dot: true,
};
async function match(pattern) {
    return (await (0, fast_glob_1.default)(pattern, GLOB_OPTIONS)).map(path_1.normalize);
}
const compareString = (a, b) => a.localeCompare(b);
async function listFiles(patterns, ignoreUnmatchedGlobs) {
    const { files, urls } = patterns.reduce((group, pattern) => {
        if (!/^https?:\/\//.test(pattern)) {
            group.files.push(pattern.replace(/\\/g, '/'));
        }
        else {
            group.urls.push(pattern);
        }
        return group;
    }, {
        files: [],
        urls: [],
    });
    const filesFound = [];
    const fileSearchWithoutResult = [];
    if (ignoreUnmatchedGlobs) {
        filesFound.push(...(await match(files)));
    }
    else {
        await Promise.all(files.map(async (pattern) => {
            const resultFg = await match(pattern);
            if (resultFg.length === 0) {
                fileSearchWithoutResult.push(pattern);
            }
            filesFound.push(...resultFg);
        }));
    }
    return [[...urls, ...filesFound].sort(compareString), fileSearchWithoutResult];
}
exports.listFiles = listFiles;
//# sourceMappingURL=listFiles.js.map