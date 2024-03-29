"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ordered_object_literal_1 = require("@stoplight/ordered-object-literal");
const types_1 = require("@stoplight/types");
const yaml_ast_parser_1 = require("@stoplight/yaml-ast-parser");
const buildJsonPath_1 = require("./buildJsonPath");
const dereferenceAnchor_1 = require("./dereferenceAnchor");
const lineForPosition_1 = require("./lineForPosition");
const types_2 = require("./types");
const utils_1 = require("./utils");
exports.parseWithPointers = (value, options) => {
    const lineMap = computeLineMap(value);
    const ast = yaml_ast_parser_1.load(value, Object.assign({}, options, { ignoreDuplicateKeys: true }));
    const parsed = {
        ast,
        lineMap,
        data: undefined,
        diagnostics: [],
        metadata: options,
    };
    if (!ast)
        return parsed;
    parsed.data = exports.walkAST(ast, options, lineMap, parsed.diagnostics);
    if (ast.errors) {
        parsed.diagnostics.push(...transformErrors(ast.errors, lineMap));
    }
    if (parsed.diagnostics.length > 0) {
        parsed.diagnostics.sort((itemA, itemB) => itemA.range.start.line - itemB.range.start.line);
    }
    if (Array.isArray(parsed.ast.errors)) {
        parsed.ast.errors.length = 0;
    }
    return parsed;
};
exports.walkAST = (node, options, lineMap, diagnostics) => {
    if (node) {
        switch (node.kind) {
            case types_2.Kind.MAP: {
                const preserveKeyOrder = options !== void 0 && options.preserveKeyOrder === true;
                const container = createMapContainer(preserveKeyOrder);
                const seenKeys = [];
                const handleMergeKeys = options !== void 0 && options.mergeKeys === true;
                const yamlMode = options !== void 0 && options.json === false;
                const handleDuplicates = options !== void 0 && options.ignoreDuplicateKeys === false;
                for (const mapping of node.mappings) {
                    if (!validateMappingKey(mapping, lineMap, diagnostics, yamlMode))
                        continue;
                    const key = String(getScalarValue(mapping.key));
                    if ((yamlMode || handleDuplicates) && (!handleMergeKeys || key !== "<<")) {
                        if (seenKeys.includes(key)) {
                            if (yamlMode) {
                                throw new Error('Duplicate YAML mapping key encountered');
                            }
                            if (handleDuplicates) {
                                diagnostics.push(createYAMLException(mapping.key, lineMap, 'duplicate key'));
                            }
                        }
                        else {
                            seenKeys.push(key);
                        }
                    }
                    if (handleMergeKeys && key === "<<") {
                        const reduced = reduceMergeKeys(exports.walkAST(mapping.value, options, lineMap, diagnostics), preserveKeyOrder);
                        Object.assign(container, reduced);
                    }
                    else {
                        container[key] = exports.walkAST(mapping.value, options, lineMap, diagnostics);
                        if (preserveKeyOrder) {
                            pushKey(container, key);
                        }
                    }
                }
                return container;
            }
            case types_2.Kind.SEQ:
                return node.items.map(item => exports.walkAST(item, options, lineMap, diagnostics));
            case types_2.Kind.SCALAR: {
                const bigInt = options !== void 0 && options.bigInt === true;
                const value = getScalarValue(node);
                return !bigInt && typeof value === 'bigint' ? Number(value) : value;
            }
            case types_2.Kind.ANCHOR_REF: {
                if (utils_1.isObject(node.value)) {
                    node.value = dereferenceAnchor_1.dereferenceAnchor(node.value, node.referencesAnchor);
                }
                return exports.walkAST(node.value, options, lineMap, diagnostics);
            }
            default:
                return null;
        }
    }
    return node;
};
function getScalarValue(node) {
    switch (yaml_ast_parser_1.determineScalarType(node)) {
        case types_2.ScalarType.null:
            return null;
        case types_2.ScalarType.string:
            return String(node.value);
        case types_2.ScalarType.bool:
            return yaml_ast_parser_1.parseYamlBoolean(node.value);
        case types_2.ScalarType.int:
            return yaml_ast_parser_1.parseYamlBigInteger(node.value);
        case types_2.ScalarType.float:
            return yaml_ast_parser_1.parseYamlFloat(node.value);
    }
}
const computeLineMap = (input) => {
    const lineMap = [];
    let i = 0;
    for (; i < input.length; i++) {
        if (input[i] === '\n') {
            lineMap.push(i + 1);
        }
    }
    lineMap.push(i + 1);
    return lineMap;
};
function getLineLength(lineMap, line) {
    if (line === 0) {
        return Math.max(0, lineMap[0] - 1);
    }
    return Math.max(0, lineMap[line] - lineMap[line - 1] - 1);
}
const transformErrors = (errors, lineMap) => {
    const validations = [];
    let possiblyUnexpectedFlow = -1;
    let i = 0;
    for (const error of errors) {
        const validation = {
            code: error.name,
            message: error.reason,
            severity: error.isWarning ? types_1.DiagnosticSeverity.Warning : types_1.DiagnosticSeverity.Error,
            range: {
                start: {
                    line: error.mark.line,
                    character: error.mark.column,
                },
                end: {
                    line: error.mark.line,
                    character: error.mark.toLineEnd ? getLineLength(lineMap, error.mark.line) : error.mark.column,
                },
            },
        };
        const isBrokenFlow = error.reason === 'missed comma between flow collection entries';
        if (isBrokenFlow) {
            possiblyUnexpectedFlow = possiblyUnexpectedFlow === -1 ? i : possiblyUnexpectedFlow;
        }
        else if (possiblyUnexpectedFlow !== -1) {
            validations[possiblyUnexpectedFlow].range.end = validation.range.end;
            validations[possiblyUnexpectedFlow].message = 'invalid mixed usage of block and flow styles';
            validations.length = possiblyUnexpectedFlow + 1;
            i = validations.length;
            possiblyUnexpectedFlow = -1;
        }
        validations.push(validation);
        i++;
    }
    return validations;
};
const reduceMergeKeys = (items, preserveKeyOrder) => {
    if (Array.isArray(items)) {
        const reduced = items.reduceRight(preserveKeyOrder
            ? (merged, item) => {
                const keys = Object.keys(item);
                Object.assign(merged, item);
                for (let i = keys.length - 1; i >= 0; i--) {
                    unshiftKey(merged, keys[i]);
                }
                return merged;
            }
            : (merged, item) => Object.assign(merged, item), createMapContainer(preserveKeyOrder));
        return reduced;
    }
    return typeof items !== 'object' || items === null ? null : Object(items);
};
function createMapContainer(preserveKeyOrder) {
    return preserveKeyOrder ? ordered_object_literal_1.default({}) : {};
}
function deleteKey(container, key) {
    if (!(key in container))
        return;
    const order = ordered_object_literal_1.getOrder(container);
    const index = order.indexOf(key);
    if (index !== -1) {
        order.splice(index, 1);
    }
}
function unshiftKey(container, key) {
    deleteKey(container, key);
    ordered_object_literal_1.getOrder(container).unshift(key);
}
function pushKey(container, key) {
    deleteKey(container, key);
    ordered_object_literal_1.getOrder(container).push(key);
}
function validateMappingKey(mapping, lineMap, diagnostics, yamlMode) {
    if (mapping.key.kind !== types_2.Kind.SCALAR) {
        if (!yamlMode) {
            diagnostics.push(createYAMLIncompatibilityException(mapping.key, lineMap, 'mapping key must be a string scalar', yamlMode));
        }
        return false;
    }
    if (!yamlMode) {
        const type = typeof getScalarValue(mapping.key);
        if (type !== 'string') {
            diagnostics.push(createYAMLIncompatibilityException(mapping.key, lineMap, `mapping key must be a string scalar rather than ${mapping.key.valueObject === null ? 'null' : type}`, yamlMode));
        }
    }
    return true;
}
function createYAMLIncompatibilityException(node, lineMap, message, yamlMode) {
    const exception = createYAMLException(node, lineMap, message);
    exception.code = 'YAMLIncompatibleValue';
    exception.severity = yamlMode ? types_1.DiagnosticSeverity.Hint : types_1.DiagnosticSeverity.Warning;
    return exception;
}
function createYAMLException(node, lineMap, message) {
    const startLine = lineForPosition_1.lineForPosition(node.startPosition, lineMap);
    const endLine = lineForPosition_1.lineForPosition(node.endPosition, lineMap);
    return {
        code: 'YAMLException',
        message,
        severity: types_1.DiagnosticSeverity.Error,
        path: buildJsonPath_1.buildJsonPath(node),
        range: {
            start: {
                line: startLine,
                character: startLine === 0 ? node.startPosition : node.startPosition - lineMap[startLine - 1],
            },
            end: {
                line: endLine,
                character: endLine === 0 ? node.endPosition : node.endPosition - lineMap[endLine - 1],
            },
        },
    };
}
//# sourceMappingURL=parseWithPointers.js.map