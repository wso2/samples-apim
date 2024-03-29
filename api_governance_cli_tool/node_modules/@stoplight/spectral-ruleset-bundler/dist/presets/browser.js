"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.browser = void 0;
const skypack_1 = require("../plugins/skypack");
const virtualFs_1 = require("../plugins/virtualFs");
const browser = io => [(0, skypack_1.skypack)(), (0, virtualFs_1.virtualFs)(io)];
exports.browser = browser;
//# sourceMappingURL=browser.js.map