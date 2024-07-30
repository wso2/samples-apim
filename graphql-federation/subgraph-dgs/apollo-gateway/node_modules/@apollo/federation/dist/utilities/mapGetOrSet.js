"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapGetOrSet = void 0;
function mapGetOrSet(map, key, valueToSet) {
    if (!map.has(key)) {
        map.set(key, valueToSet);
    }
    return map.get(key);
}
exports.mapGetOrSet = mapGetOrSet;
//# sourceMappingURL=mapGetOrSet.js.map