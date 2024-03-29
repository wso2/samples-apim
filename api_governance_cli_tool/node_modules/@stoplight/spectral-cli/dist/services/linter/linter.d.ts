import { IRuleResult } from '@stoplight/spectral-core';
import { ILintConfig } from '../config';
export declare function lint(documents: Array<number | string>, flags: ILintConfig): Promise<IRuleResult[]>;
