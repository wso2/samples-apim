"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoreDirective = void 0;
const graphql_1 = require("graphql");
exports.CoreDirective = new graphql_1.GraphQLDirective({
    name: 'core',
    locations: [graphql_1.DirectiveLocation.SCHEMA],
    args: {
        feature: {
            type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString),
        },
    },
    isRepeatable: true,
});
//# sourceMappingURL=coreSpec.js.map