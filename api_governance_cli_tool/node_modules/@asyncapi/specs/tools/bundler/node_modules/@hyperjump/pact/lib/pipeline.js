const curry = require("just-curry-it");


module.exports = curry((fns, doc) => {
  return fns.reduce(async (acc, fn) => fn(await acc), doc);
});
