"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executableDirectivesInAllServices = void 0;
const graphql_1 = require("graphql");
const utils_1 = require("../../utils");
const executableDirectivesInAllServices = ({ schema, serviceList, }) => {
    const errors = [];
    const customExecutableDirectives = schema
        .getDirectives()
        .filter(x => !utils_1.isApolloTypeSystemDirective(x) && !graphql_1.isSpecifiedDirective(x));
    customExecutableDirectives.forEach(directive => {
        var _a;
        const directiveFederationMetadata = utils_1.getFederationMetadata(directive);
        if (!directiveFederationMetadata)
            return;
        const allServiceNames = serviceList.map(({ name }) => name);
        const serviceNamesWithDirective = Object.keys(directiveFederationMetadata.directiveDefinitions);
        const serviceNamesWithoutDirective = allServiceNames.reduce((without, serviceName) => {
            if (!serviceNamesWithDirective.includes(serviceName)) {
                without.push(serviceName);
            }
            return without;
        }, []);
        if (serviceNamesWithoutDirective.length > 0) {
            errors.push(utils_1.errorWithCode('EXECUTABLE_DIRECTIVES_IN_ALL_SERVICES', utils_1.logDirective(directive.name) +
                `Custom directives must be implemented in every service. The following services do not implement the @${directive.name} directive: ${serviceNamesWithoutDirective.join(', ')}.`, (_a = directive.astNode) !== null && _a !== void 0 ? _a : undefined));
        }
    });
    return errors;
};
exports.executableDirectivesInAllServices = executableDirectivesInAllServices;
//# sourceMappingURL=executableDirectivesInAllServices.js.map