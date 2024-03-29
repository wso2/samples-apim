"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.json = void 0;
const json = results => {
    const outputJson = results.map(result => {
        return {
            code: result.code,
            path: result.path,
            message: result.message,
            severity: result.severity,
            range: result.range,
            source: result.source,
        };
    });
    return JSON.stringify(outputJson, null, '\t');
};
exports.json = json;
//# sourceMappingURL=json.js.map