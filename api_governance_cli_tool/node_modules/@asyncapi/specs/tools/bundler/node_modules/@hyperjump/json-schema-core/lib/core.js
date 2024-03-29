const curry = require("just-curry-it");
const PubSub = require("pubsub-js");
const { splitUrl } = require("./common");
const Instance = require("./instance");
const Schema = require("./schema");
const InvalidSchemaError = require("./invalid-schema-error");


const FLAG = "FLAG", BASIC = "BASIC", DETAILED = "DETAILED", VERBOSE = "VERBOSE";

let metaOutputFormat = DETAILED;
let shouldMetaValidate = true;

const validate = async (schema, value = undefined, outputFormat = undefined) => {
  const compiled = await compile(schema);
  const interpretAst = (value, outputFormat) => interpret(compiled, Instance.cons(value), outputFormat);

  return value === undefined ? interpretAst : interpretAst(value, outputFormat);
};

const compile = async (schema) => {
  const ast = { metaData: {} };
  const schemaUri = await compileSchema(schema, ast);
  return { ast, schemaUri };
};

const interpret = curry(({ ast, schemaUri }, value, outputFormat = FLAG) => {
  if (![FLAG, BASIC, DETAILED, VERBOSE].includes(outputFormat)) {
    throw Error(`The '${outputFormat}' error format is not supported`);
  }

  const output = [];
  const subscriptionToken = PubSub.subscribe("result", outputHandler(outputFormat, output));
  interpretSchema(schemaUri, value, ast, {});
  PubSub.unsubscribe(subscriptionToken);

  return output[0];
});

const outputHandler = (outputFormat, output) => {
  const resultStack = [];

  return (message, keywordResult) => {
    if (message === "result") {
      const { keyword, absoluteKeywordLocation, instanceLocation, valid } = keywordResult;
      const result = { keyword, absoluteKeywordLocation, instanceLocation, valid, errors: [] };
      resultStack.push(result);
    } else if (message === "result.start") {
      resultStack.push(message);
    } else if (message === "result.end") {
      const result = resultStack.pop();
      while (resultStack[resultStack.length - 1] !== "result.start") {
        const topResult = resultStack.pop();

        const errors = [topResult];
        if (outputFormat === BASIC) {
          errors.push(...topResult.errors);
          delete topResult.errors;
        }

        if (outputFormat === VERBOSE || (outputFormat !== FLAG && !topResult.valid)) {
          result.errors.unshift(...errors);
        }
      }
      resultStack[resultStack.length - 1] = result;

      output[0] = result;
    }
  };
};

const setMetaOutputFormat = (format) => {
  metaOutputFormat = format;
};

const setShouldMetaValidate = (isEnabled) => {
  shouldMetaValidate = isEnabled;
};

const _keywords = {};
const getKeyword = (id) => _keywords[id];
const hasKeyword = (id) => id in _keywords;
const addKeyword = (id, keywordHandler) => {
  _keywords[id] = {
    collectEvaluatedItems: (keywordValue, instance, ast, dynamicAnchors, isTop) => keywordHandler.interpret(keywordValue, instance, ast, dynamicAnchors, isTop) && new Set(),
    collectEvaluatedProperties: (keywordValue, instance, ast, dynamicAnchors, isTop) => keywordHandler.interpret(keywordValue, instance, ast, dynamicAnchors, isTop) && [],
    ...keywordHandler
  };
};

const _vocabularies = {};
const defineVocabulary = (id, keywords) => {
  _vocabularies[id] = keywords;
};

const metaValidators = {};
const compileSchema = async (schema, ast) => {
  schema = await followReferences(schema);

  // Vocabularies
  if (!hasKeyword(`${schema.schemaVersion}#validate`)) {
    const metaSchema = await Schema.get(schema.schemaVersion);

    // Check for mandatory vocabularies
    const mandatoryVocabularies = Schema.getConfig(metaSchema.id, "mandatoryVocabularies") || [];
    mandatoryVocabularies.forEach((vocabularyId) => {
      if (!metaSchema.vocabulary[vocabularyId]) {
        throw Error(`Vocabulary '${vocabularyId}' must be explicitly declared and required`);
      }
    });

    // Load vocabularies
    Object.entries(metaSchema.vocabulary)
      .forEach(([vocabularyId, isRequired]) => {
        if (vocabularyId in _vocabularies) {
          Object.entries(_vocabularies[vocabularyId])
            .forEach(([keyword, keywordHandler]) => {
              addKeyword(`${metaSchema.id}#${keyword}`, keywordHandler);
            });
        } else if (isRequired) {
          throw Error(`Missing required vocabulary: ${vocabularyId}`);
        }
      });
  }

  // Meta validation
  if (shouldMetaValidate && !schema.validated) {
    Schema.markValidated(schema.id);

    // Compile
    if (!(schema.schemaVersion in metaValidators)) {
      const metaSchema = await Schema.get(schema.schemaVersion);
      const compiledSchema = await compile(metaSchema);
      metaValidators[metaSchema.id] = interpret(compiledSchema);
    }

    // Interpret
    const schemaInstance = Instance.cons(schema.schema, schema.id);
    const metaResults = metaValidators[schema.schemaVersion](schemaInstance, metaOutputFormat);
    if (!metaResults.valid) {
      throw new InvalidSchemaError(metaResults);
    }
  }

  // Compile
  if (!(schema.id in ast.metaData)) {
    ast.metaData[schema.id] = {
      id: schema.id,
      dynamicAnchors: schema.dynamicAnchors,
      anchors: schema.anchors
    };
  }
  return getKeyword(`${schema.schemaVersion}#validate`).compile(schema, ast);
};

const followReferences = async (doc) => {
  return Schema.typeOf(doc, "string") ? followReferences(await Schema.get(Schema.value(doc), doc)) : doc;
};

const interpretSchema = (schemaUri, instance, ast, dynamicAnchors) => {
  const keywordId = getKeywordId(schemaUri, ast);
  const id = splitUrl(schemaUri)[0];
  return getKeyword(keywordId).interpret(schemaUri, instance, ast, { ...ast.metaData[id].dynamicAnchors, ...dynamicAnchors });
};

const collectEvaluatedProperties = (schemaUri, instance, ast, dynamicAnchors, isTop) => {
  const keywordId = getKeywordId(schemaUri, ast);
  return getKeyword(keywordId).collectEvaluatedProperties(schemaUri, instance, ast, dynamicAnchors, isTop);
};

const collectEvaluatedItems = (schemaUri, instance, ast, dynamicAnchors, isTop) => {
  const keywordId = getKeywordId(schemaUri, ast);
  return getKeyword(keywordId).collectEvaluatedItems(schemaUri, instance, ast, dynamicAnchors, isTop);
};

const getKeywordId = (schemaUri, ast) => {
  if (!(schemaUri in ast)) {
    throw Error(`No schema found at ${schemaUri}`);
  }

  return ast[schemaUri][0];
};

const add = (schema, url = "", defaultSchemaVersion = "") => {
  const id = Schema.add(schema, url, defaultSchemaVersion);
  delete metaValidators[id];
};

module.exports = {
  validate, compile, interpret,
  setMetaOutputFormat, setShouldMetaValidate, FLAG, BASIC, DETAILED, VERBOSE,
  add, getKeyword, hasKeyword, defineVocabulary,
  compileSchema, interpretSchema, collectEvaluatedProperties, collectEvaluatedItems
};
