import { IRuleResult } from '@stoplight/spectral-core';
import { FormatterOptions } from '../formatters/types';
import type { OutputFormat } from './config';
export declare function formatOutput(results: IRuleResult[], format: OutputFormat, formatOptions: FormatterOptions): string;
export declare function writeOutput(outputStr: string, outputFile: string): Promise<void>;
