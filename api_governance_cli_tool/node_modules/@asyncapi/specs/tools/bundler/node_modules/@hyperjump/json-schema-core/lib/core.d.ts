import type { Schema, SchemaDocument, SchemaObject, Anchors } from "./schema";
import type { Vocabulary, Compile, Interpret, CollectEvaluatedProperties, CollectEvaluatedItems } from "./keywords";


export type Core = {
  validate: (
    (schema: SchemaDocument, value: unknown, outputFormat?: OutputFormat) => Promise<Result>
  ) & (
    (schema: SchemaDocument) => Promise<Validator>
  );
  compile: (schema: SchemaDocument<SchemaObject>) => Promise<CompiledSchema>;
  interpret: (
    (compiledSchema: CompiledSchema, value: unknown, outputFormat?: OutputFormat) => Result
  ) & (
    (compiledSchema: CompiledSchema) => Validator
  );
  setMetaOutputFormat: (format: OutputFormat) => void;
  setShouldMetaValidate: (isEnabled: boolean) => void;
  FLAG: "FLAG";
  BASIC: "BASIC";
  DETAILED: "DETAILED";
  VERBOSE: "VERBOSE";
  add: Schema["add"];
  getKeyword: <A>(id: string) => {
    compile: Compile<A>;
    interpret: Interpret<A>;
    collectEvaluatedProperties: CollectEvaluatedProperties<A>;
    collectEvaluatedItems: CollectEvaluatedItems<A>;
  };
  hasKeyword: (id: string) => boolean;
  defineVocabulary: (id: string, keywords: Vocabulary) => void;
  compileSchema: Compile<string>;
  interpretSchema: Interpret<string>;
  collectEvaluatedProperties: CollectEvaluatedProperties<string>;
  collectEvaluatedItems: CollectEvaluatedItems<string>;
};

export type Validator = (value: unknown, outputFormat?: OutputFormat) => Result;

export type OutputFormat = "FLAG" | "BASIC" | "DETAILED" | "VERBOSE" | string;

export type CompiledSchema = {
  schemaUri: string;
  ast: AST;
};

export type AST = {
  metaData: Record<string, MetaData>;
} & Record<string, Node<Node<unknown>[] | boolean>>;

export type Node<A> = [keywordId: string, schemaUri: string, keywordValue: A];

export type MetaData = {
  id: string;
  dynamicAnchors: Anchors;
  anchors: Anchors;
};

export type Result = {
  keyword: string;
  absoluteKeywordLocation: string;
  instanceLocation: string;
  valid: boolean;
  errors?: Result[];
};

declare const core: Core;
export default core;
