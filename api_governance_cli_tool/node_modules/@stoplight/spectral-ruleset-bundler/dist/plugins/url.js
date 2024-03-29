"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.url = void 0;
const path_1 = require("@stoplight/path");
const url = ({ fetch }) => ({
    name: '@stoplight-spectral/url',
    async resolveId(id, importer, opts) {
        const resolved = await this.resolve(id, importer, {
            ...opts,
            skipSelf: true,
        });
        if ((resolved === null || resolved === void 0 ? void 0 : resolved.external) === true) {
            return;
        }
        if ((0, path_1.isURL)(id)) {
            return id;
        }
        if (importer !== void 0 && (0, path_1.isURL)(importer)) {
            const url = new URL(importer);
            if ((0, path_1.isAbsolute)(id)) {
                url.pathname = id;
            }
            else {
                url.pathname = (0, path_1.join)((0, path_1.dirname)(url.pathname), id);
            }
            return String(url);
        }
        return;
    },
    async load(id) {
        if (!(0, path_1.isURL)(id))
            return;
        const res = await fetch(id);
        if (!res.ok) {
            throw Error(`Error fetching ${id}: ${res.statusText}`);
        }
        return res.text();
    },
});
exports.url = url;
//# sourceMappingURL=url.js.map