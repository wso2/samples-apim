import { SchemaDefinition } from "./schema";
export interface DumpOptions {
    indent?: number;
    noArrayIndent?: boolean;
    skipInvalid?: boolean;
    flowLevel?: number;
    styles?: {
        [x: string]: any;
    };
    schema?: SchemaDefinition;
    lineWidth?: number;
    noRefs?: boolean;
}
export declare function dump(input: any, options?: DumpOptions): string;
export declare function safeDump(input: any, options?: DumpOptions): string;
