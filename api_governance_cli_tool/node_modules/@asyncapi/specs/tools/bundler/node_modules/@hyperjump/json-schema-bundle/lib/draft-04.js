const JsonSchema = require("@hyperjump/json-schema");
const { Core, Schema } = require("@hyperjump/json-schema-core");
const Keywords = require("./keywords");


Schema.setConfig("http://json-schema.org/draft-04/schema", "bundlingLocation", "/definitions");

Core.defineVocabulary("http://json-schema.org/draft-04/schema", {
  "validate": Keywords.validate,
  "additionalItems": Keywords.additionalItems,
  "additionalProperties": Keywords.additionalProperties,
  "allOf": Keywords.allOf,
  "anyOf": Keywords.anyOf,
  "default": JsonSchema.Keywords.metaData,
  "definitions": JsonSchema.Keywords.definitions,
  "dependencies": Keywords.dependencies,
  "description": JsonSchema.Keywords.metaData,
  "enum": JsonSchema.Keywords.enum,
  "format": JsonSchema.Keywords.metaData,
  "items": Keywords.items,
  "maxItems": JsonSchema.Keywords.maxItems,
  "maxLength": JsonSchema.Keywords.maxLength,
  "maxProperties": JsonSchema.Keywords.maxProperties,
  "maximum": JsonSchema.Keywords.maximumExclusiveMaximum,
  "minItems": JsonSchema.Keywords.minItems,
  "minLength": JsonSchema.Keywords.minLength,
  "minProperties": JsonSchema.Keywords.minProperties,
  "minimum": JsonSchema.Keywords.minimumExclusiveMinimum,
  "multipleOf": JsonSchema.Keywords.multipleOf,
  "not": Keywords.not,
  "oneOf": Keywords.oneOf,
  "pattern": JsonSchema.Keywords.pattern,
  "patternProperties": Keywords.patternProperties,
  "properties": Keywords.properties,
  "required": JsonSchema.Keywords.required,
  "title": JsonSchema.Keywords.metaData,
  "type": JsonSchema.Keywords.type,
  "uniqueItems": JsonSchema.Keywords.uniqueItems
});
