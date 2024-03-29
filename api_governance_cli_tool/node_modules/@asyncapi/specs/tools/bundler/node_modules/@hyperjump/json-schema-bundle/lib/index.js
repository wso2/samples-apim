const { v4: uuid } = require("uuid");
const JsonSchema = require("@hyperjump/json-schema");
const JsonPointer = require("@hyperjump/json-pointer");
const { Core, Schema, InvalidSchemaError } = require("@hyperjump/json-schema-core");
const Bundle = require("./core");
const { splitUri } = require("./common");

require("./draft-04");
require("./draft-06");
require("./draft-07");
require("./draft-2019-09");
require("./draft-2020-12");


const FULL = "full";
const FLAT = "flat";
const URI = "uri";
const UUID = "uuid";

const defaultOptions = {
  alwaysIncludeDialect: false,
  bundleMode: FLAT,
  definitionNamingStrategy: URI
};

const bundle = async (schemaDoc, options = {}) => {
  const fullOptions = { ...defaultOptions, ...options };

  const { ast, schemaUri } = await Core.compile(schemaDoc);
  const subSchemaUris = new Set();
  Bundle.collectExternalIds(schemaUri, subSchemaUris, ast, {});
  const externalIds = new Set([...subSchemaUris].map((uri) => splitUri(uri)[0]));
  externalIds.delete(schemaDoc.id);

  const bundled = Schema.toSchema(schemaDoc, {
    includeEmbedded: fullOptions.bundleMode === FULL
  });

  const bundlingLocation = Schema.getConfig(schemaDoc.schemaVersion, "bundlingLocation");
  if (JsonPointer.get(bundlingLocation, bundled) === undefined && externalIds.size > 0) {
    JsonPointer.assign(bundlingLocation, bundled, {});
  }

  for (const uri of externalIds.values()) {
    const externalSchema = await JsonSchema.get(uri);
    const embeddedSchema = Schema.toSchema(externalSchema, {
      parentId: schemaDoc.id,
      parentDialect: fullOptions.alwaysIncludeDialect ? "" : schemaDoc.schemaVersion,
      includeEmbedded: fullOptions.bundleMode === FULL
    });
    let id;
    if (fullOptions.definitionNamingStrategy === URI) {
      const embeddedToken = Schema.getConfig(externalSchema.schemaVersion, "embeddedToken");
      id = embeddedSchema[embeddedToken];
    } else if (fullOptions.definitionNamingStrategy === UUID) {
      id = uuid();
    } else {
      throw Error(`Unknown definition naming stragety: ${fullOptions.definitionNamingStrategy}`);
    }
    const pointer = JsonPointer.append(id, bundlingLocation);
    JsonPointer.assign(pointer, bundled, embeddedSchema);
  }

  return bundled;
};

module.exports = {
  add: JsonSchema.add,
  get: Schema.get,
  bundle: bundle,
  FULL: FULL,
  FLAT: FLAT,
  URI: URI,
  UUID: UUID,
  setMetaOutputFormat: Core.setMetaOutputFormat,
  setShouldMetaValidate: Core.setShouldMetaValidate,
  FLAG: Core.FLAG,
  BASIC: Core.BASIC,
  DETAILED: Core.DETAILED,
  VERBOSE: Core.VERBOSE,
  InvalidSchemaError: InvalidSchemaError
};
