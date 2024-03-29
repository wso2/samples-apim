"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.skypack = void 0;
const isPackageImport_1 = require("../utils/isPackageImport");
const path_1 = require("@stoplight/path");
const DATA_URIS = /^(?:data|node|file):/;
const skypack = (opts) => {
    return {
        name: '@stoplight-spectral/skypack',
        resolveId(id) {
            if (DATA_URIS.test(id) || (0, path_1.isURL)(id))
                return;
            const isIgnored = (opts === null || opts === void 0 ? void 0 : opts.ignoreList) !== void 0 &&
                opts.ignoreList.some(ignored => (typeof ignored === 'string' ? ignored === id : ignored.test(id)));
            if (!isIgnored && (0, isPackageImport_1.isPackageImport)(id)) {
                return `https://cdn.skypack.dev/${id}`;
            }
            return;
        },
    };
};
exports.skypack = skypack;
//# sourceMappingURL=skypack.js.map