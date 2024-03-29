"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const module_1 = require("module");
exports.default = ((id, opts) => {
    try {
        const req = (0, module_1.createRequire)(process.cwd());
        return req.resolve(id, opts);
    }
    catch {
        return null;
    }
});
//# sourceMappingURL=requireResolve.js.map