"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = void 0;
const schema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    properties: {
        aliases: {
            type: 'object',
        },
        except: {
            type: 'object',
            additionalProperties: {
                type: 'array',
                items: {
                    type: 'string',
                },
            },
        },
        extends: {
            oneOf: [
                {
                    type: 'string',
                },
                {
                    type: 'array',
                    items: {
                        oneOf: [
                            {
                                type: 'string',
                            },
                            {
                                type: 'array',
                                minItems: 2,
                                items: [
                                    {
                                        type: 'string',
                                    },
                                    {
                                        enum: ['all', 'recommended', 'off'],
                                    },
                                ],
                            },
                        ],
                    },
                },
            ],
        },
        formats: {
            type: 'array',
            items: {
                type: 'string',
            },
        },
        functions: {
            type: 'array',
            items: {
                type: 'string',
            },
        },
        functionsDir: {
            type: 'string',
        },
        rules: {
            type: 'object',
            properties: {
                formats: {
                    $ref: '#/properties/formats',
                },
            },
        },
    },
};
exports.default = schema;
//# sourceMappingURL=schema.js.map