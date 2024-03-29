"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupBySource = void 0;
const groupBySource = (results) => {
    return results.reduce((grouped, result) => {
        var _a;
        if (result.source !== void 0) {
            (grouped[result.source] = (_a = grouped[result.source]) !== null && _a !== void 0 ? _a : []).push(result);
        }
        return grouped;
    }, {});
};
exports.groupBySource = groupBySource;
//# sourceMappingURL=groupBySource.js.map