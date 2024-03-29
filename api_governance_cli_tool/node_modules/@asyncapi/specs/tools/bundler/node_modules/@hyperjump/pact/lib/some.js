const curry = require("just-curry-it");
const map = require("./map");


module.exports = curry(async (fn, doc) => {
  const results = await map(fn, doc);
  return (await Promise.all(results))
    .some((a) => a);
});
