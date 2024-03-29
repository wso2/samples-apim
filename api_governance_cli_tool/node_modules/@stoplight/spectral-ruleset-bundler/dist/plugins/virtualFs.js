"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.virtualFs = void 0;
const path_1 = require("@stoplight/path");
const virtualFs = ({ fs }) => {
    const recognized = new Set();
    return {
        name: '@stoplight-spectral/virtual-fs',
        resolveId(source, importer) {
            const { protocol } = (0, path_1.parse)(source);
            if (protocol === 'http' || protocol === 'https') {
                return null;
            }
            if (protocol !== 'file' && !/^[./]/.test(source)) {
                return null;
            }
            let resolvedSource = source;
            if ((0, path_1.isAbsolute)(source)) {
                resolvedSource = (0, path_1.normalize)(source);
            }
            else if (importer !== void 0) {
                resolvedSource = (0, path_1.join)((0, path_1.dirname)(importer), source);
            }
            recognized.add(resolvedSource);
            return resolvedSource;
        },
        load(id) {
            if (!(0, path_1.isURL)(id) && recognized.has(id)) {
                return fs.promises.readFile(id, 'utf8');
            }
            return;
        },
    };
};
exports.virtualFs = virtualFs;
//# sourceMappingURL=virtualFs.js.map