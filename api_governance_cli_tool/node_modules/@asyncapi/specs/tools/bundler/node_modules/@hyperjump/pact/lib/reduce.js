const curry = require("just-curry-it");


module.exports = curry(async (fn, acc, doc) => {
  return (await doc).reduce(async (acc, item) => fn(await acc, item), acc);
});
