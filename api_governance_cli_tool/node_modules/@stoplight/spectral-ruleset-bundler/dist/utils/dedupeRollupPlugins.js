"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dedupeRollupPlugins = void 0;
function dedupeRollupPlugins(plugins) {
    const map = new Map();
    for (const plugin of plugins) {
        map.set(plugin.name, plugin);
    }
    return Array.from(map.values());
}
exports.dedupeRollupPlugins = dedupeRollupPlugins;
//# sourceMappingURL=dedupeRollupPlugins.js.map