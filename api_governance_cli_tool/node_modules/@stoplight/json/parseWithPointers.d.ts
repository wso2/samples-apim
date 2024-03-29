import { IDiagnostic, IParserASTResult } from '@stoplight/types';
import { IJsonASTNode, IParseOptions } from './types';
export declare const parseWithPointers: <T = any>(value: string, options?: IParseOptions) => import("@stoplight/types").IParserResult<T, IJsonASTNode, number[], unknown>;
export declare function parseTree<T>(text: string, errors: IDiagnostic[] | undefined, options: IParseOptions): IParserASTResult<T, IJsonASTNode, number[]>;
