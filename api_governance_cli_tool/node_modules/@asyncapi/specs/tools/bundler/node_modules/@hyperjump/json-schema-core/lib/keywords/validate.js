const Pact = require("@hyperjump/pact");
const PubSub = require("pubsub-js");
const Core = require("../core");
const Instance = require("../instance");
const Schema = require("../schema");


const compile = async (schema, ast) => {
  const url = Schema.uri(schema);
  if (!(url in ast)) {
    ast[url] = false; // Place dummy entry in ast to avoid recursive loops

    const schemaValue = Schema.value(schema);
    if (!["object", "boolean"].includes(typeof schemaValue)) {
      throw Error(`No schema found at '${Schema.uri(schema)}'`);
    }

    ast[url] = [
      `${schema.schemaVersion}#validate`,
      Schema.uri(schema),
      typeof schemaValue === "boolean" ? schemaValue : await Pact.pipeline([
        Schema.entries,
        Pact.map(([keyword, keywordSchema]) => [`${schema.schemaVersion}#${keyword}`, keywordSchema]),
        Pact.filter(([keywordId]) => Core.hasKeyword(keywordId) && keywordId !== `${schema.schemaVersion}#validate`),
        Pact.map(async ([keywordId, keywordSchema]) => {
          const keywordAst = await Core.getKeyword(keywordId).compile(keywordSchema, ast, schema);
          return [keywordId, Schema.uri(keywordSchema), keywordAst];
        }),
        Pact.all
      ], schema)
    ];
  }

  return url;
};

const interpret = (uri, instance, ast, dynamicAnchors) => {
  const [keywordId, schemaUrl, nodes] = ast[uri];

  PubSub.publishSync("result.start");
  const isValid = typeof nodes === "boolean" ? nodes : nodes
    .every(([keywordId, schemaUrl, keywordValue]) => {
      PubSub.publishSync("result.start");
      const isValid = Core.getKeyword(keywordId).interpret(keywordValue, instance, ast, dynamicAnchors);

      PubSub.publishSync("result", {
        keyword: keywordId,
        absoluteKeywordLocation: schemaUrl,
        instanceLocation: Instance.uri(instance),
        valid: isValid,
        ast: keywordValue
      });
      PubSub.publishSync("result.end");
      return isValid;
    });

  PubSub.publishSync("result", {
    keyword: keywordId,
    absoluteKeywordLocation: schemaUrl,
    instanceLocation: Instance.uri(instance),
    valid: isValid,
    ast: uri
  });
  PubSub.publishSync("result.end");
  return isValid;
};

const collectEvaluatedProperties = (uri, instance, ast, dynamicAnchors, isTop = false) => {
  const nodes = ast[uri][2];

  if (typeof nodes === "boolean") {
    return nodes ? [] : false;
  }

  return nodes
    .filter(([keywordId]) => !isTop || !keywordId.endsWith("#unevaluatedProperties"))
    .reduce((acc, [keywordId, , keywordValue]) => {
      const propertyNames = acc && Core.getKeyword(keywordId).collectEvaluatedProperties(keywordValue, instance, ast, dynamicAnchors);
      return propertyNames !== false && [...acc, ...propertyNames];
    }, []);
};

const collectEvaluatedItems = (uri, instance, ast, dynamicAnchors, isTop = false) => {
  const nodes = ast[uri][2];

  if (typeof nodes === "boolean") {
    return nodes ? new Set() : false;
  }

  return nodes
    .filter(([keywordId]) => !isTop || !keywordId.endsWith("#unevaluatedItems"))
    .reduce((acc, [keywordId, , keywordValue]) => {
      const itemIndexes = acc !== false && Core.getKeyword(keywordId).collectEvaluatedItems(keywordValue, instance, ast, dynamicAnchors);
      return itemIndexes !== false && new Set([...acc, ...itemIndexes]);
    }, new Set());
};

module.exports = { compile, interpret, collectEvaluatedProperties, collectEvaluatedItems };
