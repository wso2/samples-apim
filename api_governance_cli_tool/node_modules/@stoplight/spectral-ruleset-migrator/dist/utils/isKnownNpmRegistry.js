"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isKnownNpmRegistry = void 0;
const path_1 = require("@stoplight/path");
const KNOWN_PROVIDERS = ['unpkg.com', 'cdn.skypack.dev'];
function isKnownNpmRegistry(uri) {
    const { protocol, origin } = (0, path_1.parse)(uri);
    if (origin === null) {
        return false;
    }
    if (protocol !== 'http' && protocol !== 'https') {
        return false;
    }
    return KNOWN_PROVIDERS.includes(origin);
}
exports.isKnownNpmRegistry = isKnownNpmRegistry;
//# sourceMappingURL=isKnownNpmRegistry.js.map