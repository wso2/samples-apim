const { Core } = require("@hyperjump/json-schema-core");
const { splitUri } = require("./common");


const collectExternalIds = (schemaUri, externalIds, ast, dynamicAnchors) => {
  const keywordId = ast[schemaUri][0];
  const id = splitUri(schemaUri)[0];
  Core.getKeyword(keywordId).collectExternalIds(schemaUri, externalIds, ast, { ...ast.metaData[id].dynamicAnchors, ...dynamicAnchors });
};

module.exports = { collectExternalIds };
