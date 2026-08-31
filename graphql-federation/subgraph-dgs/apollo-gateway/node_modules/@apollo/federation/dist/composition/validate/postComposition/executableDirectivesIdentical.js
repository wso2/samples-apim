"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executableDirectivesIdentical = void 0;
const graphql_1 = require("graphql");
const utils_1 = require("../../utils");
const executableDirectivesIdentical = ({ schema, }) => {
    const errors = [];
    const customDirectives = schema
        .getDirectives()
        .filter(x => !utils_1.isApolloTypeSystemDirective(x) && !graphql_1.isSpecifiedDirective(x));
    customDirectives.forEach(directive => {
        const directiveFederationMetadata = utils_1.getFederationMetadata(directive);
        if (!directiveFederationMetadata)
            return;
        const definitions = Object.entries(directiveFederationMetadata.directiveDefinitions);
        const shouldError = definitions.some(([, definition], index) => {
            if (index === 0)
                return;
            const [, previousDefinition] = definitions[index - 1];
            return !utils_1.typeNodesAreEquivalent(definition, previousDefinition);
        });
        if (shouldError) {
            const directiveDefinitionNodes = definitions.map(([_, directiveDefinitionNode]) => directiveDefinitionNode);
            errors.push(utils_1.errorWithCode('EXECUTABLE_DIRECTIVES_IDENTICAL', utils_1.logDirective(directive.name) +
                `custom directives must be defined identically across all services. See below for a list of current implementations:\n${definitions
                    .map(([serviceName, definition]) => {
                    return `\t${serviceName}: ${graphql_1.print(definition)}`;
                })
                    .join('\n')}`, directiveDefinitionNodes));
        }
    });
    return errors;
};
exports.executableDirectivesIdentical = executableDirectivesIdentical;
//# sourceMappingURL=executableDirectivesIdentical.js.map