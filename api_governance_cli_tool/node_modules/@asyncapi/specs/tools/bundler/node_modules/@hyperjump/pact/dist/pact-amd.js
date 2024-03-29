define(function () { 'use strict';

  var entries$1 = async (doc) => Object.entries(await doc);

  var justCurryIt = curry$6;

  /*
    function add(a, b, c) {
      return a + b + c;
    }
    curry(add)(1)(2)(3); // 6
    curry(add)(1)(2)(2); // 5
    curry(add)(2)(4, 3); // 9

    function add(...args) {
      return args.reduce((sum, n) => sum + n, 0)
    }
    var curryAdd4 = curry(add, 4)
    curryAdd4(1)(2, 3)(4); // 10

    function converter(ratio, input) {
      return (input*ratio).toFixed(1);
    }
    const curriedConverter = curry(converter)
    const milesToKm = curriedConverter(1.62);
    milesToKm(35); // 56.7
    milesToKm(10); // 16.2
  */

  function curry$6(fn, arity) {
    return function curried() {
      if (arity == null) {
        arity = fn.length;
      }
      var args = [].slice.call(arguments);
      if (args.length >= arity) {
        return fn.apply(this, args);
      } else {
        return function() {
          return curried.apply(this, args.concat([].slice.call(arguments)));
        };
      }
    };
  }

  const curry$5 = justCurryIt;


  var map$2 = curry$5(async (fn, doc) => (await doc).map(fn));

  const curry$4 = justCurryIt;


  var reduce$2 = curry$4(async (fn, acc, doc) => {
    return (await doc).reduce(async (acc, item) => fn(await acc, item), acc);
  });

  const curry$3 = justCurryIt;
  const reduce$1 = reduce$2;


  var filter = curry$3(async (fn, doc, options = {}) => {
    return reduce$1(async (acc, item) => {
      return (await fn(item)) ? acc.concat([item]) : acc;
    }, [], doc, options);
  });

  const curry$2 = justCurryIt;
  const map$1 = map$2;


  var some = curry$2(async (fn, doc) => {
    const results = await map$1(fn, doc);
    return (await Promise.all(results))
      .some((a) => a);
  });

  const curry$1 = justCurryIt;
  const map = map$2;


  var every = curry$1(async (fn, doc) => {
    const results = await map(fn, doc);
    return (await Promise.all(results))
      .every((a) => a);
  });

  const curry = justCurryIt;


  var pipeline$1 = curry((fns, doc) => {
    return fns.reduce(async (acc, fn) => fn(await acc), doc);
  });

  var all = (doc) => Promise.all(doc);

  const pipeline = pipeline$1;
  const entries = entries$1;
  const reduce = reduce$2;


  var allValues = (doc) => {
    return pipeline([
      entries,
      reduce(async (acc, [propertyName, propertyValue]) => {
        acc[propertyName] = await propertyValue;
        return acc;
      }, {})
    ], doc);
  };

  var lib = {
    entries: entries$1,
    map: map$2,
    filter: filter,
    reduce: reduce$2,
    some: some,
    every: every,
    pipeline: pipeline$1,
    all: all,
    allValues: allValues
  };

  return lib;

});
//# sourceMappingURL=pact-amd.js.map
