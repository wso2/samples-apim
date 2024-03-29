import type { Json } from "@hyperjump/json-pointer";
import type { AST } from "../core";
import type { SchemaDocument, Anchors } from "../schema";
import type { JsonDocument } from "../instance";


export type Keyword<A extends Json | undefined = Json> = {
  compile: Compile<A>;
  interpret: Interpret<A>;
  collectEvaluatedProperties?: CollectEvaluatedProperties<A>;
  collectEvaluatedItems?: CollectEvaluatedItems<A>;
};

export type Compile<A> = (schema: SchemaDocument, ast: AST, parentSchema: SchemaDocument) => Promise<A>;
export type Interpret<A> = (compiledKeywordValue: A, instance: JsonDocument, ast: AST, dynamicAnchors: Anchors) => boolean;
export type CollectEvaluatedProperties<A> = (compiledKeywordValue: A, instance: JsonDocument, ast: AST, dynamicAnchors: Anchors, isTop?: boolean) => string[] | false;
export type CollectEvaluatedItems<A> = (compiledKeywordValue: A, instance: JsonDocument, ast: AST, dynamicAnchors: Anchors, isTop?: boolean) => Set<number> | false;

type DistribKeyword<T> = T extends Json ? Keyword<T> : never;
export type Vocabulary = { [K in keyof Record<string, Json>]: DistribKeyword<Record<string, Json>[K]> };

declare const Keywords: Vocabulary;
export default Keywords;
