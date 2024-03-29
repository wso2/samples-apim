const JsonSchema = require("@hyperjump/json-schema");
const { Core, Schema } = require("@hyperjump/json-schema-core");
const Keywords = require("./keywords");


Schema.setConfig("https://json-schema.org/draft/2019-09/schema", "bundlingLocation", "/$defs");

Core.defineVocabulary("https://json-schema.org/draft/2019-09/vocab/core", {
  "validate": Keywords.validate,
  "$defs": JsonSchema.Keywords.definitions,
  "$recursiveRef": JsonSchema.Keywords.dynamicRef,
  "$ref": Keywords.ref
});

Core.defineVocabulary("https://json-schema.org/draft/2019-09/vocab/applicator", {
  "additionalItems": Keywords.additionalItems6,
  "additionalProperties": Keywords.additionalProperties6,
  "allOf": Keywords.allOf,
  "anyOf": Keywords.anyOf,
  "contains": Keywords.containsMinContainsMaxContains,
  "dependentSchemas": Keywords.dependentSchemas,
  "if": Keywords.if,
  "then": Keywords.then,
  "else": Keywords.else,
  "items": Keywords.items,
  "not": Keywords.not,
  "oneOf": Keywords.oneOf,
  "patternProperties": Keywords.patternProperties,
  "properties": Keywords.properties,
  "propertyNames": Keywords.propertyNames,
  "unevaluatedItems": Keywords.unevaluatedItems,
  "unevaluatedProperties": Keywords.unevaluatedProperties
});
