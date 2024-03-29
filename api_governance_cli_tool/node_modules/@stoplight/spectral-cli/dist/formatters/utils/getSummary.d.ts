import { Dictionary } from '@stoplight/types';
import { IRuleResult } from '@stoplight/spectral-core';
export declare const getSummaryForSource: (results: IRuleResult[]) => string | null;
export declare const getSummary: (groupedResults: Dictionary<IRuleResult[]>) => string | null;
