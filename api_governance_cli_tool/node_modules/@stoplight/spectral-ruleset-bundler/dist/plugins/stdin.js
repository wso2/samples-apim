"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stdin = void 0;
const stdin = (input, name = '<stdin>') => ({
    name: '@stoplight-spectral/stdin',
    resolveId: id => (id === name ? id : null),
    load: id => (id === name ? input : null),
});
exports.stdin = stdin;
//# sourceMappingURL=stdin.js.map