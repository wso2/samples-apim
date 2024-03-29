import { IDiagnostic } from '@stoplight/types';
import { IParseOptions, Kind, YAMLMapping, YAMLNode, YAMLScalar } from './types';
export declare const parseWithPointers: <T>(value: string, options?: IParseOptions | undefined) => import("@stoplight/types").IParserResult<T | undefined, YAMLNode, number[], IParseOptions>;
export declare const walkAST: (node: import("./types").YAMLAnchorReference | import("./types").YAMLBaseNode<Kind.INCLUDE_REF> | YAMLScalar | import("./types").YAMLMap | YAMLMapping | import("./types").YAMLSequence | null, options: IParseOptions | undefined, lineMap: number[], diagnostics: IDiagnostic[]) => unknown;
