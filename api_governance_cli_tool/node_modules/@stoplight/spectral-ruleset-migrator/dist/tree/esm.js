"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.esm = void 0;
const ast_types_1 = require("ast-types");
exports.esm = {
    dependencies: new Set(),
    importDeclaration(identifiers, source) {
        return ast_types_1.builders.importDeclaration(identifiers.map(([imported, local]) => ast_types_1.builders.importSpecifier(imported, local)), ast_types_1.builders.literal(source));
    },
    importDefaultDeclaration(identifier, source) {
        return ast_types_1.builders.importDeclaration([ast_types_1.builders.importDefaultSpecifier(identifier)], ast_types_1.builders.literal(source));
    },
    exportDefaultDeclaration(value) {
        return ast_types_1.builders.exportDefaultDeclaration(value);
    },
};
//# sourceMappingURL=esm.js.map