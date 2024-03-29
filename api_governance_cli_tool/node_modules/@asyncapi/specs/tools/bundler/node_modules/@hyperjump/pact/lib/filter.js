const curry = require("just-curry-it");
const reduce = require("./reduce");


module.exports = curry(async (fn, doc, options = {}) => {
  return reduce(async (acc, item) => {
    return (await fn(item)) ? acc.concat([item]) : acc;
  }, [], doc, options);
});
