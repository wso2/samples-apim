import { Plugin, OutputChunk } from 'rollup';
export declare type BundleOptions = {
    plugins: Plugin[];
    target: 'node' | 'browser' | 'runtime';
    format?: 'esm' | 'commonjs' | 'iife';
    treeshake?: boolean;
    fullOutput?: boolean;
};
export { IO } from './types';
export declare function bundleRuleset(input: string, opts: Omit<BundleOptions, 'fullOutput'> | (Omit<BundleOptions, 'fullOutput'> & {
    fullOutput: false;
})): Promise<string>;
export declare function bundleRuleset(input: string, opts: Omit<BundleOptions, 'fullOutput'> & {
    fullOutput: true;
}): Promise<OutputChunk>;
