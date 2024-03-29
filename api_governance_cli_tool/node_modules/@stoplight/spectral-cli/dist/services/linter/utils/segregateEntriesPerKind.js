"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.segregateEntriesPerKind = void 0;
function segregateEntriesPerKind(entries) {
    return entries.reduce((group, entry) => {
        if (typeof entry === 'string') {
            group[0].push(entry);
        }
        else {
            group[1].push(entry);
        }
        return group;
    }, [[], []]);
}
exports.segregateEntriesPerKind = segregateEntriesPerKind;
//# sourceMappingURL=segregateEntriesPerKind.js.map