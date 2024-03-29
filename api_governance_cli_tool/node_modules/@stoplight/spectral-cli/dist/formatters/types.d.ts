import { ISpectralDiagnostic } from '@stoplight/spectral-core';
import type { DiagnosticSeverity } from '@stoplight/types';
export declare type FormatterOptions = {
    failSeverity: DiagnosticSeverity;
};
export declare type Formatter = (results: ISpectralDiagnostic[], options: FormatterOptions) => string;
