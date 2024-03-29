"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commonjs = void 0;
const ast_types_1 = require("ast-types");
const ex = ast_types_1.builders.identifier('ex');
const _interopDefault = ast_types_1.builders.functionDeclaration(ast_types_1.builders.identifier('_interopDefault'), [ex], ast_types_1.builders.blockStatement([
    ast_types_1.builders.returnStatement(ast_types_1.builders.conditionalExpression(ast_types_1.builders.logicalExpression('&&', ast_types_1.builders.logicalExpression('&&', ex, ast_types_1.builders.binaryExpression('===', ast_types_1.builders.unaryExpression('typeof', ex), ast_types_1.builders.literal('object'))), ast_types_1.builders.binaryExpression('in', ast_types_1.builders.literal('default'), ex)), ast_types_1.builders.memberExpression(ex, ast_types_1.builders.literal('default'), true), ex)),
]));
exports.commonjs = {
    dependencies: new Set(),
    importDeclaration(identifiers, source) {
        return ast_types_1.builders.variableDeclaration('const', [
            ast_types_1.builders.variableDeclarator(ast_types_1.builders.objectPattern(identifiers.map(([imported, local]) => ast_types_1.builders.property.from({
                kind: 'init',
                key: imported,
                value: local,
                shorthand: local.name === imported.name,
            }))), ast_types_1.builders.callExpression(ast_types_1.builders.identifier('require'), [ast_types_1.builders.literal(source)])),
        ]);
    },
    importDefaultDeclaration(identifier, source) {
        this.dependencies.add(_interopDefault);
        return ast_types_1.builders.variableDeclaration('const', [
            ast_types_1.builders.variableDeclarator(identifier, ast_types_1.builders.callExpression(ast_types_1.builders.identifier('_interopDefault'), [
                ast_types_1.builders.callExpression(ast_types_1.builders.identifier('require'), [ast_types_1.builders.literal(source)]),
            ])),
        ]);
    },
    exportDefaultDeclaration(value) {
        return ast_types_1.builders.expressionStatement(ast_types_1.builders.assignmentExpression('=', ast_types_1.builders.memberExpression(ast_types_1.builders.identifier('module'), ast_types_1.builders.identifier('exports')), value));
    },
};
//# sourceMappingURL=commonjs.js.map