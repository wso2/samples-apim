const JsonSchema = require("@hyperjump/json-schema");
const { Core, Schema } = require("@hyperjump/json-schema-core");
const Keywords = require("./keywords");


Schema.setConfig("https://json-schema.org/draft/2020-12/schema", "bundlingLocation", "/$defs");

Core.defineVocabulary("https://json-schema.org/draft/2020-12/vocab/core", {
  "validate": Keywords.validate,
  "$defs": JsonSchema.Keywords.definitions,
  "$dynamicRef": JsonSchema.Keywords.dynamicRef,
  "$ref": Keywords.ref
});

Core.defineVocabulary("https://json-schema.org/draft/2020-12/vocab/applicator", {
  "additionalProperties": Keywords.additionalProperties6,
  "allOf": Keywords.allOf,
  "anyOf": Keywords.anyOf,
  "contains": Keywords.containsMinContainsMaxContains,
  "dependentSchemas": Keywords.dependentSchemas,
  "if": Keywords.if,
  "then": Keywords.then,
  "else": Keywords.else,
  "items": Keywords.items202012,
  "not": Keywords.not,
  "oneOf": Keywords.oneOf,
  "patternProperties": Keywords.patternProperties,
  "prefixItems": Keywords.tupleItems,
  "properties": Keywords.properties,
  "propertyNames": Keywords.propertyNames
});

Core.defineVocabulary("https://json-schema.org/draft/2020-12/vocab/unevaluated", {
  "unevaluatedItems": Keywords.unevaluatedItems,
  "unevaluatedProperties": Keywords.unevaluatedProperties
});
