"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResolver = void 0;
const path_1 = require("@stoplight/path");
const spectral_ref_resolver_1 = require("@stoplight/spectral-ref-resolver");
const lodash_1 = require("lodash");
const errors_1 = require("../../../errors");
const getResolver = (resolver, proxy) => {
    if (resolver !== void 0) {
        try {
            return require((0, path_1.isAbsolute)(resolver) ? resolver : (0, path_1.join)(process.cwd(), resolver));
        }
        catch (ex) {
            throw new errors_1.CLIError((0, lodash_1.isError)(ex) ? formatMessage(ex.message) : String(ex));
        }
    }
    if (typeof proxy === 'string') {
        const ProxyAgent = require('proxy-agent');
        return (0, spectral_ref_resolver_1.createHttpAndFileResolver)({ agent: new ProxyAgent(process.env.PROXY) });
    }
    return (0, spectral_ref_resolver_1.createHttpAndFileResolver)();
};
exports.getResolver = getResolver;
function formatMessage(message) {
    var _a, _b;
    return (_b = (_a = message.split(/\r?\n/)) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.replace(/\\/g, '/');
}
//# sourceMappingURL=getResolver.js.map