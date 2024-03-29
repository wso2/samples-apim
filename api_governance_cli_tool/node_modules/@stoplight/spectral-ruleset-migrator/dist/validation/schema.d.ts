export { schema as default };
declare const schema: {
    $schema: string;
    type: string;
    properties: {
        aliases: {
            type: string;
        };
        except: {
            type: string;
            additionalProperties: {
                type: string;
                items: {
                    type: string;
                };
            };
        };
        extends: {
            oneOf: ({
                type: string;
                items?: undefined;
            } | {
                type: string;
                items: {
                    oneOf: ({
                        type: string;
                        minItems?: undefined;
                        items?: undefined;
                    } | {
                        type: string;
                        minItems: number;
                        items: ({
                            type: string;
                            enum?: undefined;
                        } | {
                            enum: string[];
                            type?: undefined;
                        })[];
                    })[];
                };
            })[];
        };
        formats: {
            type: string;
            items: {
                type: string;
            };
        };
        functions: {
            type: string;
            items: {
                type: string;
            };
        };
        functionsDir: {
            type: string;
        };
        rules: {
            type: string;
            properties: {
                formats: {
                    $ref: string;
                };
            };
        };
    };
};
