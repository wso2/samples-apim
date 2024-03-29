const pipeline = require("./pipeline");
const entries = require("./entries");
const reduce = require("./reduce");


module.exports = (doc) => {
  return pipeline([
    entries,
    reduce(async (acc, [propertyName, propertyValue]) => {
      acc[propertyName] = await propertyValue;
      return acc;
    }, {})
  ], doc);
};
