import { YamlParserResult } from '@stoplight/yaml';
import { IParser } from './types';
export { YamlParserResult };
export declare const parseYaml: (input: string) => YamlParserResult<unknown>;
export declare const Yaml: IParser<YamlParserResult<unknown>>;
