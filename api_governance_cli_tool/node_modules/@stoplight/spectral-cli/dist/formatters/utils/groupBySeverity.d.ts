import { DiagnosticSeverity, Dictionary } from '@stoplight/types';
import type { IRuleResult } from '@stoplight/spectral-core';
export declare const groupBySeverity: (results: IRuleResult[]) => Dictionary<IRuleResult[], DiagnosticSeverity>;
