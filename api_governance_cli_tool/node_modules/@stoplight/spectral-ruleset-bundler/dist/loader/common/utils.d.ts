export declare function isBasicRuleset(filepath: string): boolean;
export declare function isErrorWithCode(error: unknown): error is Error & {
    code: string;
};
