"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJoinDefinitions = void 0;
const graphql_1 = require("graphql");
const mapGetOrSet_1 = require("./utilities/mapGetOrSet");
const FieldSetScalar = new graphql_1.GraphQLScalarType({
    name: 'join__FieldSet',
});
const JoinGraphDirective = new graphql_1.GraphQLDirective({
    name: "join__graph",
    locations: [graphql_1.DirectiveLocation.ENUM_VALUE],
    args: {
        name: {
            type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString),
        },
        url: {
            type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString),
        },
    }
});
function getJoinGraphEnum(serviceList) {
    const sortedServiceList = serviceList
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name));
    function sanitizeGraphQLName(name) {
        const alphaNumericUnderscoreOnly = name.replace(/[\W]/g, '_');
        const noNumericFirstChar = alphaNumericUnderscoreOnly.match(/^\d/)
            ? '_' + alphaNumericUnderscoreOnly
            : alphaNumericUnderscoreOnly;
        const noUnderscoreNumericEnding = noNumericFirstChar.match(/_\d+$/)
            ? noNumericFirstChar + '_'
            : noNumericFirstChar;
        const toUpper = noUnderscoreNumericEnding.toLocaleUpperCase();
        return toUpper;
    }
    const sanitizedNameToServiceDefinitions = new Map();
    for (const service of sortedServiceList) {
        const { name } = service;
        const sanitized = sanitizeGraphQLName(name);
        mapGetOrSet_1.mapGetOrSet(sanitizedNameToServiceDefinitions, sanitized, []).push(service);
    }
    const enumValueNameToServiceDefinition = Object.create(null);
    for (const [sanitizedName, services] of sanitizedNameToServiceDefinitions) {
        if (services.length === 1) {
            enumValueNameToServiceDefinition[sanitizedName] = services[0];
        }
        else {
            for (const [index, service] of services.entries()) {
                enumValueNameToServiceDefinition[`${sanitizedName}_${index + 1}`] = service;
            }
        }
    }
    const entries = Object.entries(enumValueNameToServiceDefinition);
    return {
        graphNameToEnumValueName: Object.fromEntries(entries.map(([enumValueName, service]) => [service.name, enumValueName])),
        JoinGraphEnum: new graphql_1.GraphQLEnumType({
            name: 'join__Graph',
            values: Object.fromEntries(entries.map(([enumValueName, service]) => [
                enumValueName,
                { value: service },
            ])),
        }),
    };
}
function getJoinFieldDirective(JoinGraphEnum) {
    return new graphql_1.GraphQLDirective({
        name: 'join__field',
        locations: [graphql_1.DirectiveLocation.FIELD_DEFINITION],
        args: {
            graph: {
                type: JoinGraphEnum,
            },
            requires: {
                type: FieldSetScalar,
            },
            provides: {
                type: FieldSetScalar,
            },
        },
    });
}
function getJoinOwnerDirective(JoinGraphEnum) {
    return new graphql_1.GraphQLDirective({
        name: 'join__owner',
        locations: [graphql_1.DirectiveLocation.OBJECT, graphql_1.DirectiveLocation.INTERFACE],
        args: {
            graph: {
                type: new graphql_1.GraphQLNonNull(JoinGraphEnum),
            },
        },
    });
}
function getJoinDefinitions(serviceList) {
    const { graphNameToEnumValueName, JoinGraphEnum } = getJoinGraphEnum(serviceList);
    const JoinFieldDirective = getJoinFieldDirective(JoinGraphEnum);
    const JoinOwnerDirective = getJoinOwnerDirective(JoinGraphEnum);
    const JoinTypeDirective = new graphql_1.GraphQLDirective({
        name: 'join__type',
        locations: [graphql_1.DirectiveLocation.OBJECT, graphql_1.DirectiveLocation.INTERFACE],
        isRepeatable: true,
        args: {
            graph: {
                type: new graphql_1.GraphQLNonNull(JoinGraphEnum),
            },
            key: {
                type: FieldSetScalar,
            },
        },
    });
    return {
        graphNameToEnumValueName,
        FieldSetScalar,
        JoinTypeDirective,
        JoinFieldDirective,
        JoinOwnerDirective,
        JoinGraphEnum,
        JoinGraphDirective,
    };
}
exports.getJoinDefinitions = getJoinDefinitions;
//# sourceMappingURL=joinSpec.js.map