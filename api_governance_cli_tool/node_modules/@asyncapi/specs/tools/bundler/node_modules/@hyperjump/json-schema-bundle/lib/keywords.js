const JsonSchema = require("@hyperjump/json-schema");
const { Core } = require("@hyperjump/json-schema-core");
const Bundle = require("./core");


const validate = {
  ...JsonSchema.Keywords.validate,
  collectExternalIds: (schemaUri, externalIds, ast, dynamicAnchors) => {
    const nodes = ast[schemaUri][2];
    if (externalIds.has(schemaUri) || typeof nodes === "boolean") {
      return;
    }
    externalIds.add(schemaUri);

    for (const [keywordId, , keywordValue] of nodes) {
      const keyword = Core.getKeyword(keywordId);

      if (keyword.collectExternalIds) {
        keyword.collectExternalIds(keywordValue, externalIds, ast, dynamicAnchors);
      }
    }
  }
};

const ref = {
  ...JsonSchema.Keywords.ref,
  collectExternalIds: Bundle.collectExternalIds
};

const additionalItems = {
  ...JsonSchema.Keywords.additionalItems,
  collectExternalIds: ([, additionalItems], externalIds, ast, dynamicAnchors) => {
    if (typeof additionalItems === "string") {
      Bundle.collectExternalIds(additionalItems, externalIds, ast, dynamicAnchors);
    }
  }
};

const additionalProperties = {
  ...JsonSchema.Keywords.additionalProperties,
  collectExternalIds: ([, , additionalProperties], externalIds, ast, dynamicAnchors) => {
    if (typeof additionalProperties === "string") {
      Bundle.collectExternalIds(additionalProperties, externalIds, ast, dynamicAnchors);
    }
  }
};

const additionalItems6 = {
  ...JsonSchema.Keywords.additionalItems6,
  collectExternalIds: ([, additionalItems], externalIds, ast, dynamicAnchors) => {
    Bundle.collectExternalIds(additionalItems, externalIds, ast, dynamicAnchors);
  }
};

const additionalProperties6 = {
  ...JsonSchema.Keywords.additionalProperties6,
  collectExternalIds: ([, , additionalProperties], externalIds, ast, dynamicAnchors) => {
    Bundle.collectExternalIds(additionalProperties, externalIds, ast, dynamicAnchors);
  }
};

const allOf = {
  ...JsonSchema.Keywords.allOf,
  collectExternalIds: (allOf, externalIds, ast, dynamicAnchors) => {
    allOf.forEach((schemaUri) => Bundle.collectExternalIds(schemaUri, externalIds, ast, dynamicAnchors));
  }
};

const anyOf = {
  ...JsonSchema.Keywords.anyOf,
  collectExternalIds: (anyOf, externalIds, ast, dynamicAnchors) => {
    anyOf.forEach((schemaUri) => Bundle.collectExternalIds(schemaUri, externalIds, ast, dynamicAnchors));
  }
};

const contains = {
  ...JsonSchema.Keywords.contains,
  collectExternalIds: Bundle.collectExternalIds
};

const containsMinContainsMaxContains = {
  ...JsonSchema.Keywords.containsMinContainsMaxContains,
  collectExternalIds: ({ contains }, externalIds, ast, dynamicAnchors) => {
    Bundle.collectExternalIds(contains, externalIds, ast, dynamicAnchors);
  }
};

const dependencies = {
  ...JsonSchema.Keywords.dependencies,
  collectExternalIds: (dependentSchemas, externalIds, ast, dynamicAnchors) => {
    Object.values(dependentSchemas).forEach(([, dependency]) => {
      if (typeof dependency === "string") {
        Bundle.collectExternalIds(dependency, externalIds, ast, dynamicAnchors);
      }
    });
  }
};

const dependentSchemas = {
  ...JsonSchema.Keywords.dependentSchemas,
  collectExternalIds: (dependentSchemas, externalIds, ast, dynamicAnchors) => {
    Object.values(dependentSchemas).forEach(([, schemaUri]) => Bundle.collectExternalIds(schemaUri, externalIds, ast, dynamicAnchors));
  }
};

const if_ = {
  ...JsonSchema.Keywords.if,
  collectExternalIds: Bundle.collectExternalIds
};

const then = {
  ...JsonSchema.Keywords.then,
  collectExternalIds: ([, then], externalIds, ast, dynamicAnchors) => {
    Bundle.collectExternalIds(then, externalIds, ast, dynamicAnchors);
  }
};

const else_ = {
  ...JsonSchema.Keywords.else,
  collectExternalIds: ([, elseSchema], externalIds, ast, dynamicAnchors) => {
    Bundle.collectExternalIds(elseSchema, externalIds, ast, dynamicAnchors);
  }
};

const items = {
  ...JsonSchema.Keywords.items,
  collectExternalIds: (items, externalIds, ast, dynamicAnchors) => {
    if (typeof items === "string") {
      Bundle.collectExternalIds(items, externalIds, ast, dynamicAnchors);
    } else {
      items.forEach((schemaUri) => Bundle.collectExternalIds(schemaUri, externalIds, ast, dynamicAnchors));
    }
  }
};

const items202012 = {
  ...JsonSchema.Keywords.items202012,
  collectExternalIds: ([, items], externalIds, ast, dynamicAnchors) => {
    Bundle.collectExternalIds(items, externalIds, ast, dynamicAnchors);
  }
};

const not = {
  ...JsonSchema.Keywords.not,
  collectExternalIds: Bundle.collectExternalIds
};

const oneOf = {
  ...JsonSchema.Keywords.oneOf,
  collectExternalIds: (oneOf, externalIds, ast, dynamicAnchors) => {
    oneOf.forEach((schemaUri) => Bundle.collectExternalIds(schemaUri, externalIds, ast, dynamicAnchors));
  }
};

const patternProperties = {
  ...JsonSchema.Keywords.patternProperties,
  collectExternalIds: (patternProperties, externalIds, ast, dynamicAnchors) => {
    patternProperties.forEach(([, schemaUri]) => Bundle.collectExternalIds(schemaUri, externalIds, ast, dynamicAnchors));
  }
};

const tupleItems = {
  ...JsonSchema.Keywords.tupleItems,
  collectExternalIds: (tupleItems, externalIds, ast, dynamicAnchors) => {
    tupleItems.forEach((schemaUri) => Bundle.collectExternalIds(schemaUri, externalIds, ast, dynamicAnchors));
  }
};

const properties = {
  ...JsonSchema.Keywords.properties,
  collectExternalIds: (properties, externalIds, ast, dynamicAnchors) => {
    Object.values(properties).forEach((schemaUri) => Bundle.collectExternalIds(schemaUri, externalIds, ast, dynamicAnchors));
  }
};

const propertyNames = {
  ...JsonSchema.Keywords.propertyNames,
  collectExternalIds: Bundle.collectExternalIds
};

const unevaluatedItems = {
  ...JsonSchema.Keywords.unevaluatedItems,
  collectExternalIds: ([, unevaluatedItems], externalIds, ast, dynamicAnchors) => {
    Bundle.collectExternalIds(unevaluatedItems, externalIds, ast, dynamicAnchors);
  }
};

const unevaluatedProperties = {
  ...JsonSchema.Keywords.unevaluatedProperties,
  collectExternalIds: ([, unevaluatedProperties], externalIds, ast, dynamicAnchors) => {
    Bundle.collectExternalIds(unevaluatedProperties, externalIds, ast, dynamicAnchors);
  }
};

module.exports = {
  validate,
  ref,
  additionalItems,
  additionalItems6,
  additionalProperties,
  additionalProperties6,
  allOf,
  anyOf,
  contains,
  containsMinContainsMaxContains,
  dependencies,
  dependentSchemas,
  if: if_,
  then,
  else: else_,
  items,
  items202012,
  not,
  oneOf,
  patternProperties,
  tupleItems,
  properties,
  propertyNames,
  unevaluatedItems,
  unevaluatedProperties
};
