const contentTypeParser = require("content-type");
const curry = require("just-curry-it");
const Pact = require("@hyperjump/pact");
const JsonPointer = require("@hyperjump/json-pointer");
const { jsonTypeOf, splitUrl, safeResolveUrl, pathRelative } = require("./common");
const fetch = require("./fetch");
const Reference = require("./reference");


// Config
const config = {};
const configAlias = {};

const setConfig = (schemaVersion, key, value) => {
  if (!config[schemaVersion]) {
    config[schemaVersion] = {};
  }
  config[schemaVersion][key] = value;
};

const getConfig = (schemaVersion, key) => {
  const configVersion = schemaVersion in configAlias ? configAlias[schemaVersion] : schemaVersion;
  if (configVersion in config) {
    return config[configVersion][key];
  }
};

// Schema Management
const schemaStore = {};
const schemaStoreAlias = {};

const add = (schema, url = "", defaultSchemaVersion = "") => {
  schema = JSON.parse(JSON.stringify(schema));

  // Schema Version
  const schemaVersion = splitUrl(schema["$schema"] || defaultSchemaVersion)[0];
  if (!schemaVersion) {
    throw Error("Couldn't determine schema version");
  }
  delete schema["$schema"];

  // Identifier
  const baseToken = getConfig(schemaVersion, "baseToken");
  const anchorToken = getConfig(schemaVersion, "anchorToken");
  const externalId = splitUrl(url)[0];
  if (!externalId && !splitUrl(schema[baseToken] || "")[0]) {
    throw Error("Couldn't determine an identifier for the schema");
  }
  const internalUrl = safeResolveUrl(externalId, schema[baseToken] || "");
  const [id, fragment] = splitUrl(internalUrl);
  delete schema[baseToken];
  if (fragment && baseToken === anchorToken) {
    schema[anchorToken] = anchorToken !== baseToken ? encodeURI(fragment) : `#${encodeURI(fragment)}`;
  }
  if (externalId) {
    schemaStoreAlias[externalId] = id;
  }

  // recursiveAnchor
  const dynamicAnchors = {};
  const recursiveAnchorToken = getConfig(schemaVersion, "recursiveAnchorToken");
  if (schema[recursiveAnchorToken] === true) {
    dynamicAnchors[""] = `${id}#`;
    schema[anchorToken] = "";
    delete schema[recursiveAnchorToken];
  }

  // Vocabulary
  let vocabulary;
  const vocabularyToken = getConfig(schemaVersion, "vocabularyToken");
  if (jsonTypeOf(schema[vocabularyToken], "object")) {
    configAlias[id] = schemaVersion;
    vocabulary = schema[vocabularyToken];
    delete schema[vocabularyToken];
  } else {
    configAlias[id] = schemaVersion;
    vocabulary = { [schemaVersion]: true };
  }

  // Store Schema
  const anchors = { "": "" };
  schemaStore[id] = {
    id: id,
    schemaVersion: schemaVersion,
    schema: processSchema(schema, id, schemaVersion, JsonPointer.nil, anchors, dynamicAnchors),
    anchors: anchors,
    dynamicAnchors: dynamicAnchors,
    vocabulary: vocabulary,
    validated: false
  };

  return id;
};

const processSchema = (subject, id, schemaVersion, pointer, anchors, dynamicAnchors) => {
  if (jsonTypeOf(subject, "object")) {
    const embeddedSchemaVersion = typeof subject["$schema"] === "string" ? splitUrl(subject["$schema"])[0] : schemaVersion;
    const embeddedEmbeddedToken = getConfig(embeddedSchemaVersion, "embeddedToken");
    const embeddedAnchorToken = getConfig(embeddedSchemaVersion, "anchorToken");
    if (typeof subject[embeddedEmbeddedToken] === "string" && (embeddedEmbeddedToken !== embeddedAnchorToken || subject[embeddedEmbeddedToken][0] !== "#")) {
      const ref = safeResolveUrl(id, subject[embeddedEmbeddedToken]);
      subject[embeddedEmbeddedToken] = ref;
      add(subject, ref, schemaVersion);
      return Reference.cons(subject[embeddedEmbeddedToken], subject);
    }

    const anchorToken = getConfig(schemaVersion, "anchorToken");
    const dynamicAnchorToken = getConfig(schemaVersion, "dynamicAnchorToken");
    if (typeof subject[dynamicAnchorToken] === "string") {
      dynamicAnchors[subject[dynamicAnchorToken]] = `${id}#${encodeURI(pointer)}`;
      anchors[subject[dynamicAnchorToken]] = pointer;
      delete subject[dynamicAnchorToken];
    }

    const embeddedToken = getConfig(schemaVersion, "embeddedToken");
    if (typeof subject[anchorToken] === "string") {
      const anchor = anchorToken !== embeddedToken ? subject[anchorToken] : subject[anchorToken].slice(1);
      anchors[anchor] = pointer;
      delete subject[anchorToken];
    }

    const jrefToken = getConfig(schemaVersion, "jrefToken");
    if (typeof subject[jrefToken] === "string") {
      return Reference.cons(subject[jrefToken], subject);
    }

    for (const key in subject) {
      subject[key] = processSchema(subject[key], id, schemaVersion, JsonPointer.append(key, pointer), anchors, dynamicAnchors);
    }

    return subject;
  } else if (Array.isArray(subject)) {
    return subject.map((item, ndx) => processSchema(item, id, schemaVersion, JsonPointer.append(ndx, pointer), anchors, dynamicAnchors));
  } else {
    return subject;
  }
};

const hasStoredSchema = (id) => id in schemaStore || id in schemaStoreAlias;
const getStoredSchema = (id) => schemaStore[schemaStoreAlias[id]] || schemaStore[id];

const markValidated = (id) => {
  schemaStore[id].validated = true;
};

// Schema Retrieval
const nil = Object.freeze({
  id: "",
  schemaVersion: undefined,
  vocabulary: {},
  pointer: JsonPointer.nil,
  schema: undefined,
  value: undefined,
  anchors: {},
  dynamicAnchors: {},
  validated: true
});

const get = async (url, contextDoc = nil) => {
  const resolvedUrl = safeResolveUrl(uri(contextDoc), url);
  const [id, fragment] = splitUrl(resolvedUrl);

  if (!hasStoredSchema(id)) {
    const response = await fetch(id, { headers: { Accept: "application/schema+json" } });
    if (response.status >= 400) {
      await response.text(); // Sometimes node hangs without this hack
      throw Error(`Failed to retrieve schema with id: ${id}`);
    }

    if (response.headers.has("content-type")) {
      const contentType = contentTypeParser.parse(response.headers.get("content-type")).type;
      if (contentType !== "application/schema+json") {
        throw Error(`${id} is not a schema. Found a document with media type: ${contentType}`);
      }
    }

    add(await response.json(), id);
  }

  const storedSchema = getStoredSchema(id);
  const pointer = fragment[0] !== "/" ? getAnchorPointer(storedSchema, fragment) : fragment;
  const doc = Object.freeze({
    ...storedSchema,
    pointer: pointer,
    value: JsonPointer.get(pointer, storedSchema.schema)
  });

  return followReferences(doc);
};

const followReferences = (doc) => Reference.isReference(doc.value) ? get(Reference.href(doc.value), doc) : doc;

const getAnchorPointer = (schema, fragment) => {
  if (!(fragment in schema.anchors)) {
    throw Error(`No such anchor '${encodeURI(schema.id)}#${encodeURI(fragment)}'`);
  }

  return schema.anchors[fragment];
};

// Utility Functions
const uri = (doc) => `${doc.id}#${encodeURI(doc.pointer)}`;
const value = (doc) => Reference.isReference(doc.value) ? Reference.value(doc.value) : doc.value;
const has = (key, doc) => key in value(doc);
const typeOf = (doc, type) => jsonTypeOf(value(doc), type);

const step = (key, doc) => {
  const storedSchema = getStoredSchema(doc.id);
  const nextDoc = Object.freeze({
    ...doc,
    pointer: JsonPointer.append(key, doc.pointer),
    value: value(doc)[key],
    validated: storedSchema.validated
  });
  return followReferences(nextDoc);
};

const keys = (doc) => Object.keys(value(doc));

const entries = (doc) => Pact.pipeline([
  value,
  Object.keys,
  Pact.map(async (key) => [key, await step(key, doc)]),
  Pact.all
], doc);

const map = curry((fn, doc) => Pact.pipeline([
  value,
  Pact.map(async (item, ndx) => fn(await step(ndx, doc), ndx)),
  Pact.all
], doc));

const length = (doc) => value(doc).length;

const toSchemaDefaultOptions = {
  parentId: "",
  parentDialect: "",
  includeEmbedded: true
};
const toSchema = (schemaDoc, options = {}) => {
  const fullOptions = { ...toSchemaDefaultOptions, ...options };

  const schema = JSON.parse(JSON.stringify(schemaDoc.schema, (key, value) => {
    if (!Reference.isReference(value)) {
      return value;
    }

    const refValue = Reference.value(value);
    const embeddedDialect = refValue.$schema || schemaDoc.schemaVersion;
    const embeddedToken = getConfig(embeddedDialect, "embeddedToken");
    if (!fullOptions.includeEmbedded && embeddedToken in refValue) {
      return;
    } else {
      return Reference.value(value);
    }
  }));

  const dynamicAnchorToken = getConfig(schemaDoc.schemaVersion, "dynamicAnchorToken");
  Object.entries(schemaDoc.dynamicAnchors)
    .forEach(([anchor, uri]) => {
      const pointer = splitUrl(uri)[1];
      JsonPointer.assign(pointer, schema, {
        [dynamicAnchorToken]: anchor,
        ...JsonPointer.get(pointer, schema)
      });
    });

  const anchorToken = getConfig(schemaDoc.schemaVersion, "anchorToken");
  Object.entries(schemaDoc.anchors)
    .filter(([anchor]) => anchor !== "")
    .forEach(([anchor, pointer]) => {
      JsonPointer.assign(pointer, schema, {
        [anchorToken]: anchor,
        ...JsonPointer.get(pointer, schema)
      });
    });

  const baseToken = getConfig(schemaDoc.schemaVersion, "baseToken");
  const id = relativeUri(fullOptions.parentId, schemaDoc.id);
  const dialect = fullOptions.parentDialect === schemaDoc.schemaVersion ? "" : schemaDoc.schemaVersion;
  return {
    ...(id && { [baseToken]: id }),
    ...(dialect && { $schema: dialect }),
    ...schema
  };
};

const relativeUri = (from, to) => {
  if (to.startsWith("file://")) {
    const pathToSchema = from.slice(7, from.lastIndexOf("/"));
    return from === "" ? "" : pathRelative(pathToSchema, to.slice(7));
  } else {
    return to;
  }
};

module.exports = {
  setConfig, getConfig,
  add, get, markValidated,
  uri, value, getAnchorPointer, typeOf, has, step, keys, entries, map, length,
  toSchema
};
