"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runtime = void 0;
const skypack_1 = require("../plugins/skypack");
const virtualFs_1 = require("../plugins/virtualFs");
const url_1 = require("../plugins/url");
const builtins_1 = require("../plugins/builtins");
const runtime = io => [(0, builtins_1.builtins)(), (0, skypack_1.skypack)(), (0, url_1.url)(io), (0, virtualFs_1.virtualFs)(io)];
exports.runtime = runtime;
//# sourceMappingURL=runtime.js.map