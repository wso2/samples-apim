import type { JsonType } from "./common";


export type Schema = {
  setConfig: <A>(schemaVersion: Dialect, key: string, value: A) => void;
  getConfig: <A>(schemaVersion: Dialect, key: string) => A;
  add: <A extends SchemaObject | boolean>(schema: A, url?: string, defaultSchemaVersion?: Dialect) => string;
  get: (uri: string, context?: SchemaDocument) => Promise<SchemaDocument>;
  markValidated: (id: string) => void;
  uri: (doc: SchemaDocument) => string;
  value: <A extends SchemaFragment>(doc: SchemaDocument<A>) => A;
  getAnchorPointer: (schema: SchemaDocument, fragment: string) => string;
  typeOf: (
    (doc: SchemaDocument, type: "null") => doc is SchemaDocument<null>
  ) & (
    (doc: SchemaDocument, type: "boolean") => doc is SchemaDocument<boolean>
  ) & (
    (doc: SchemaDocument, type: "object") => doc is SchemaDocument<SchemaObject>
  ) & (
    (doc: SchemaDocument, type: "array") => doc is SchemaDocument<SchemaFragment[]>
  ) & (
    (doc: SchemaDocument, type: "number" | "integer") => doc is SchemaDocument<number>
  ) & (
    (doc: SchemaDocument, type: "string") => doc is SchemaDocument<string>
  ) & (
    (doc: SchemaDocument, type: JsonType) => boolean
  ) & (
    (doc: SchemaDocument) => (type: JsonType) => boolean
  );
  has: (key: string, doc: SchemaDocument) => boolean;
  step: (key: string, doc: SchemaDocument) => Promise<SchemaDocument>;
  keys: (doc: SchemaDocument) => string[];
  entries: (doc: SchemaDocument) => Promise<SchemaEntry[]>;
  map: (
    <A>(fn: MapFn<A>, doc: SchemaDocument) => Promise<A[]>
  ) & (
    <A>(fn: MapFn<A>) => (doc: SchemaDocument) => Promise<A[]>
  );
  length: (doc: SchemaDocument) => number;
  toSchema: (doc: SchemaDocument, options: ToSchemaOptions) => SchemaObject;
};

type MapFn<A> = (element: SchemaDocument, index: number) => A;
export type SchemaEntry = [string, SchemaDocument];

export type ToSchemaOptions = {
  parentId?: string;
  parentDialect?: string;
  includeEmbedded?: boolean;
};

export type SchemaDocument<A extends SchemaFragment = SchemaFragment> = {
  id: string;
  schemaVersion: Dialect;
  pointer: string;
  schema: SchemaObject;
  value: A;
  anchors: Anchors;
  dynamicAnchors: Anchors;
  vocabulary: Record<string, boolean>;
  validated: boolean;
};

/* eslint-disable @typescript-eslint/indent */
export type Dialect = "http://json-schema.org/draft-04/schema#" |
  "http://json-schema.org/draft-06/schema#" |
  "http://json-schema.org/draft-07/schema#" |
  "https://json-schema.org/draft/2019-09/schema" |
  "https://json-schema.org/draft/2020-12/schema" |
  string;
/* eslint-enable @typescript-eslint/indent */

export type SchemaFragment = string | number | boolean | null | SchemaObject | SchemaFragment[];
export type SchemaObject = { // eslint-disable-line @typescript-eslint/consistent-indexed-object-style
  [keyword: string]: SchemaFragment;
};

export type Anchors = Record<string, string>;

declare const schema: Schema;
export default schema;
