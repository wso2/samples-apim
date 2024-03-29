const curry = require("just-curry-it");


module.exports = curry(async (fn, doc) => (await doc).map(fn));
