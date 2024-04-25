import { GraphQLDirective, GraphQLEnumType, GraphQLScalarType } from 'graphql';
import { ServiceDefinition } from './composition';
export declare function getJoinDefinitions(serviceList: ServiceDefinition[]): {
    graphNameToEnumValueName: {
        [k: string]: string;
    };
    FieldSetScalar: GraphQLScalarType;
    JoinTypeDirective: GraphQLDirective;
    JoinFieldDirective: GraphQLDirective;
    JoinOwnerDirective: GraphQLDirective;
    JoinGraphEnum: GraphQLEnumType;
    JoinGraphDirective: GraphQLDirective;
};
//# sourceMappingURL=joinSpec.d.ts.map