"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const yaml_ast_parser_1 = require("@stoplight/yaml-ast-parser");
const parseWithPointers_1 = require("./parseWithPointers");
exports.parse = (value) => parseWithPointers_1.walkAST(yaml_ast_parser_1.load(value), void 0, [], []);
//# sourceMappingURL=parse.js.map