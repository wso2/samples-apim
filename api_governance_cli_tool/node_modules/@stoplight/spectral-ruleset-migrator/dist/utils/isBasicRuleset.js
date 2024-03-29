"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBasicRuleset = void 0;
const spectral_runtime_1 = require("@stoplight/spectral-runtime");
const path_1 = require("@stoplight/path");
function stripSearchFromUrl(url) {
    try {
        const { href, search } = new URL(url);
        return href.slice(0, href.length - search.length);
    }
    catch {
        return url;
    }
}
const CONTENT_TYPE_REGEXP = /^(?:application|text)\/(?:yaml|json)(?:;|$)/i;
const EXT_REGEXP = /\.(json|ya?ml)$/i;
async function isBasicRuleset(uri, fetch = spectral_runtime_1.fetch) {
    const ext = (0, path_1.extname)((0, path_1.isURL)(uri) ? stripSearchFromUrl(uri) : uri);
    if (EXT_REGEXP.test(ext)) {
        return true;
    }
    if (!(0, path_1.isURL)(uri)) {
        return false;
    }
    try {
        const contentType = (await fetch(uri)).headers.get('Content-Type');
        return contentType !== null && CONTENT_TYPE_REGEXP.test(contentType);
    }
    catch {
        return false;
    }
}
exports.isBasicRuleset = isBasicRuleset;
//# sourceMappingURL=isBasicRuleset.js.map