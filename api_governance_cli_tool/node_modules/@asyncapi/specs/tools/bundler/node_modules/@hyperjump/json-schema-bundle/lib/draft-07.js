const JsonSchema = require("@hyperjump/json-schema");
const { Core, Schema } = require("@hyperjump/json-schema-core");
const Keywords = require("./keywords");


Schema.setConfig("http://json-schema.org/draft-07/schema", "bundlingLocation", "/definitions");

Core.defineVocabulary("http://json-schema.org/draft-07/schema", {
  "validate": Keywords.validate,
  "additionalItems": Keywords.additionalItems6,
  "additionalProperties": Keywords.additionalProperties6,
  "allOf": Keywords.allOf,
  "anyOf": Keywords.anyOf,
  "const": JsonSchema.Keywords.const,
  "contains": Keywords.contains,
  "default": JsonSchema.Keywords.metaData,
  "definitions": JsonSchema.Keywords.definitions,
  "dependencies": Keywords.dependencies,
  "description": JsonSchema.Keywords.metaData,
  "enum": JsonSchema.Keywords.enum,
  "exclusiveMaximum": JsonSchema.Keywords.exclusiveMaximum,
  "exclusiveMinimum": JsonSchema.Keywords.exclusiveMinimum,
  "format": JsonSchema.Keywords.metaData,
  "if": Keywords.if,
  "then": Keywords.then,
  "else": Keywords.else,
  "items": Keywords.items,
  "maxItems": JsonSchema.Keywords.maxItems,
  "maxLength": JsonSchema.Keywords.maxLength6,
  "maxProperties": JsonSchema.Keywords.maxProperties,
  "maximum": JsonSchema.Keywords.maximum,
  "minItems": JsonSchema.Keywords.minItems,
  "minLength": JsonSchema.Keywords.minLength6,
  "minProperties": JsonSchema.Keywords.minProperties,
  "minimum": JsonSchema.Keywords.minimum,
  "multipleOf": JsonSchema.Keywords.multipleOf,
  "not": Keywords.not,
  "oneOf": Keywords.oneOf,
  "pattern": JsonSchema.Keywords.pattern,
  "patternProperties": Keywords.patternProperties,
  "properties": Keywords.properties,
  "propertyNames": Keywords.propertyNames,
  "readOnly": JsonSchema.Keywords.metaData,
  "required": JsonSchema.Keywords.required,
  "title": JsonSchema.Keywords.metaData,
  "type": JsonSchema.Keywords.type,
  "uniqueItems": JsonSchema.Keywords.uniqueItems,
  "writeOnly": JsonSchema.Keywords.metaData
});
