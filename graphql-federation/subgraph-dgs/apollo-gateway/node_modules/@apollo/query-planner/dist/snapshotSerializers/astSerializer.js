"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.remapInlineFragmentNodes = void 0;
const graphql_1 = require("graphql");
exports.default = {
    test(value) {
        return value && typeof value.kind === 'string';
    },
    serialize(value, config, indentation, _depth, _refs, _printer) {
        const lines = graphql_1.print(remapInlineFragmentNodes(value)).trim().split('\n');
        if (lines.length === 0) {
            return '';
        }
        else if (lines.length === 1) {
            return lines[0];
        }
        return lines.map(line => {
            const indentationLength = getIndentationLength(line);
            const dedentedLine = line.slice(indentationLength);
            const indentationDepth = indentationLength / 2;
            return indentation + config.indent.repeat(indentationDepth) + dedentedLine;
        }).join(config.spacingOuter);
    },
};
function getIndentationLength(line) {
    const result = /^( {2})+/.exec(line);
    return result === null ? 0 : result[0].length;
}
;
function remapInlineFragmentNodes(node) {
    return graphql_1.visit(node, {
        InlineFragment: (fragmentNode) => {
            if (fragmentNode.selectionSet)
                return fragmentNode;
            return {
                kind: graphql_1.Kind.INLINE_FRAGMENT,
                typeCondition: fragmentNode.typeCondition
                    ? {
                        kind: graphql_1.Kind.NAMED_TYPE,
                        name: {
                            kind: graphql_1.Kind.NAME,
                            value: fragmentNode.typeCondition,
                        },
                    }
                    : undefined,
                selectionSet: {
                    kind: graphql_1.Kind.SELECTION_SET,
                    selections: remapSelections(fragmentNode.selections),
                },
            };
        },
    });
}
exports.remapInlineFragmentNodes = remapInlineFragmentNodes;
function remapSelections(selections) {
    return selections.map((selection) => {
        switch (selection.kind) {
            case graphql_1.Kind.FIELD:
                return {
                    kind: graphql_1.Kind.FIELD,
                    name: {
                        kind: graphql_1.Kind.NAME,
                        value: selection.name,
                    },
                    selectionSet: {
                        kind: graphql_1.Kind.SELECTION_SET,
                        selections: remapSelections(selection.selections || []),
                    },
                };
            case graphql_1.Kind.INLINE_FRAGMENT:
                return {
                    kind: graphql_1.Kind.INLINE_FRAGMENT,
                    selectionSet: {
                        kind: graphql_1.Kind.SELECTION_SET,
                        selections: remapSelections(selection.selections || []),
                    },
                    typeCondition: selection.typeCondition
                        ? {
                            kind: graphql_1.Kind.NAMED_TYPE,
                            name: {
                                kind: graphql_1.Kind.NAME,
                                value: selection.typeCondition,
                            },
                        }
                        : undefined,
                };
        }
    });
}
//# sourceMappingURL=astSerializer.js.map