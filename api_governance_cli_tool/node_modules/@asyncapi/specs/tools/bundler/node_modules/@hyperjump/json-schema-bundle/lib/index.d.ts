import type { Core, Schema, SchemaDocument, SchemaObject, InvalidSchemaError } from "@hyperjump/json-schema-core";


export type JsonSchemaBundler = {
  add: typeof Schema.add;
  get: typeof Schema.get;
  bundle: (schemaDoc: SchemaDocument, options?: BundleOptions) => Promise<SchemaObject>;
  FULL: "full";
  FLAT: "flat";
  URI: "uri";
  UUID: "uuid";
  setMetaOutputFormat: typeof Core.setMetaOutputFormat;
  setShouldMetaValidate: typeof Core.setShouldMetaValidate;
  FLAG: typeof Core.FLAG;
  BASIC: typeof Core.BASIC;
  DETAILED: typeof Core.DETAILED;
  VERBOSE: typeof Core.VERBOSE;
  InvalidSchemaError: typeof InvalidSchemaError;
};

export type BundleOptions = {
  alwaysIncludeDialect?: boolean;
  bundleMode?: BundleMode;
  definitionNamingStrategy: DefinitionNamingStrategy;
};

export type BundleMode = JsonSchemaBundler["FULL"] | JsonSchemaBundler["FLAT"];
export type DefinitionNamingStrategy = JsonSchemaBundler["URI"] | JsonSchemaBundler["UUID"];

export const add: JsonSchemaBundler["add"];
export const get: JsonSchemaBundler["get"];
export const bundle: JsonSchemaBundler["bundle"];
export const FULL: JsonSchemaBundler["FULL"];
export const FLAT: JsonSchemaBundler["FLAT"];
export const URI: JsonSchemaBundler["URI"];
export const UUID: JsonSchemaBundler["UUID"];
export const setMetaOutputFormat: JsonSchemaBundler["setMetaOutputFormat"];
export const setShouldMetaValidate: JsonSchemaBundler["setShouldMetaValidate"];
export const FLAG: JsonSchemaBundler["FLAG"];
export const BASIC: JsonSchemaBundler["BASIC"];
export const DETAILED: JsonSchemaBundler["DETAILED"];
export const VERBOSE: JsonSchemaBundler["VERBOSE"];

export * from "@hyperjump/json-schema";

declare const jsonSchemaBundler: JsonSchemaBundler;
export default jsonSchemaBundler;
