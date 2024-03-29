import { MigrationOptions, TransformerCtx } from './types';
import { namedTypes } from 'ast-types';
import { Ruleset } from './validation/types';
export { isBasicRuleset } from './utils/isBasicRuleset';
export declare function migrateRuleset(filepath: string, opts: MigrationOptions): Promise<string>;
export declare function process(input: Ruleset, ctx: TransformerCtx): Promise<namedTypes.ObjectExpression>;
