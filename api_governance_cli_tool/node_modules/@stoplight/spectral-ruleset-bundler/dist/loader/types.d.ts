import type { Ruleset } from '@stoplight/spectral-core';
import type { Plugin } from 'rollup';
import type { IO } from '../types';
export declare type Loader = (rulesetFile: string, io: IO, plugins?: Plugin[]) => Promise<Ruleset>;
