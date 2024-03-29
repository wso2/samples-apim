import type { IO } from '../types';
import type { Plugin } from 'rollup';
export declare type PluginsPreset = (io: IO) => Plugin[];
