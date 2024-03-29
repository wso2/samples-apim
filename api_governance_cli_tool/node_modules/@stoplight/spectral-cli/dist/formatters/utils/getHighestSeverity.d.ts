import { DiagnosticSeverity } from '@stoplight/types';
import { IRuleResult } from '@stoplight/spectral-core';
export declare const getHighestSeverity: (results: IRuleResult[]) => DiagnosticSeverity;
