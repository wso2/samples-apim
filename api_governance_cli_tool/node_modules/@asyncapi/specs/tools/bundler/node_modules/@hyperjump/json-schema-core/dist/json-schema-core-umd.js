(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.JSC = {}));
})(this, (function (exports) { 'use strict';

  var justCurryIt = curry;

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

  function curry(fn, arity) {
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

  var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function createCommonjsModule(fn, module) {
  	return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  var pubsub = createCommonjsModule(function (module, exports) {
  /**
   * Copyright (c) 2010,2011,2012,2013,2014 Morgan Roderick http://roderick.dk
   * License: MIT - http://mrgnrdrck.mit-license.org
   *
   * https://github.com/mroderick/PubSubJS
   */

  (function (root, factory){

      var PubSub = {};
      root.PubSub = PubSub;
      factory(PubSub);
      // CommonJS and Node.js module support
      {
          if (module !== undefined && module.exports) {
              exports = module.exports = PubSub; // Node.js specific `module.exports`
          }
          exports.PubSub = PubSub; // CommonJS module 1.1.1 spec
          module.exports = exports = PubSub; // CommonJS
      }

  }(( typeof window === 'object' && window ) || commonjsGlobal, function (PubSub){

      var messages = {},
          lastUid = -1,
          ALL_SUBSCRIBING_MSG = '*';

      function hasKeys(obj){
          var key;

          for (key in obj){
              if ( Object.prototype.hasOwnProperty.call(obj, key) ){
                  return true;
              }
          }
          return false;
      }

      /**
       * Returns a function that throws the passed exception, for use as argument for setTimeout
       * @alias throwException
       * @function
       * @param { Object } ex An Error object
       */
      function throwException( ex ){
          return function reThrowException(){
              throw ex;
          };
      }

      function callSubscriberWithDelayedExceptions( subscriber, message, data ){
          try {
              subscriber( message, data );
          } catch( ex ){
              setTimeout( throwException( ex ), 0);
          }
      }

      function callSubscriberWithImmediateExceptions( subscriber, message, data ){
          subscriber( message, data );
      }

      function deliverMessage( originalMessage, matchedMessage, data, immediateExceptions ){
          var subscribers = messages[matchedMessage],
              callSubscriber = immediateExceptions ? callSubscriberWithImmediateExceptions : callSubscriberWithDelayedExceptions,
              s;

          if ( !Object.prototype.hasOwnProperty.call( messages, matchedMessage ) ) {
              return;
          }

          for (s in subscribers){
              if ( Object.prototype.hasOwnProperty.call(subscribers, s)){
                  callSubscriber( subscribers[s], originalMessage, data );
              }
          }
      }

      function createDeliveryFunction( message, data, immediateExceptions ){
          return function deliverNamespaced(){
              var topic = String( message ),
                  position = topic.lastIndexOf( '.' );

              // deliver the message as it is now
              deliverMessage(message, message, data, immediateExceptions);

              // trim the hierarchy and deliver message to each level
              while( position !== -1 ){
                  topic = topic.substr( 0, position );
                  position = topic.lastIndexOf('.');
                  deliverMessage( message, topic, data, immediateExceptions );
              }

              deliverMessage(message, ALL_SUBSCRIBING_MSG, data, immediateExceptions);
          };
      }

      function hasDirectSubscribersFor( message ) {
          var topic = String( message ),
              found = Boolean(Object.prototype.hasOwnProperty.call( messages, topic ) && hasKeys(messages[topic]));

          return found;
      }

      function messageHasSubscribers( message ){
          var topic = String( message ),
              found = hasDirectSubscribersFor(topic) || hasDirectSubscribersFor(ALL_SUBSCRIBING_MSG),
              position = topic.lastIndexOf( '.' );

          while ( !found && position !== -1 ){
              topic = topic.substr( 0, position );
              position = topic.lastIndexOf( '.' );
              found = hasDirectSubscribersFor(topic);
          }

          return found;
      }

      function publish( message, data, sync, immediateExceptions ){
          message = (typeof message === 'symbol') ? message.toString() : message;

          var deliver = createDeliveryFunction( message, data, immediateExceptions ),
              hasSubscribers = messageHasSubscribers( message );

          if ( !hasSubscribers ){
              return false;
          }

          if ( sync === true ){
              deliver();
          } else {
              setTimeout( deliver, 0 );
          }
          return true;
      }

      /**
       * Publishes the message, passing the data to it's subscribers
       * @function
       * @alias publish
       * @param { String } message The message to publish
       * @param {} data The data to pass to subscribers
       * @return { Boolean }
       */
      PubSub.publish = function( message, data ){
          return publish( message, data, false, PubSub.immediateExceptions );
      };

      /**
       * Publishes the message synchronously, passing the data to it's subscribers
       * @function
       * @alias publishSync
       * @param { String } message The message to publish
       * @param {} data The data to pass to subscribers
       * @return { Boolean }
       */
      PubSub.publishSync = function( message, data ){
          return publish( message, data, true, PubSub.immediateExceptions );
      };

      /**
       * Subscribes the passed function to the passed message. Every returned token is unique and should be stored if you need to unsubscribe
       * @function
       * @alias subscribe
       * @param { String } message The message to subscribe to
       * @param { Function } func The function to call when a new message is published
       * @return { String }
       */
      PubSub.subscribe = function( message, func ){
          if ( typeof func !== 'function'){
              return false;
          }

          message = (typeof message === 'symbol') ? message.toString() : message;

          // message is not registered yet
          if ( !Object.prototype.hasOwnProperty.call( messages, message ) ){
              messages[message] = {};
          }

          // forcing token as String, to allow for future expansions without breaking usage
          // and allow for easy use as key names for the 'messages' object
          var token = 'uid_' + String(++lastUid);
          messages[message][token] = func;

          // return token for unsubscribing
          return token;
      };

      PubSub.subscribeAll = function( func ){
          return PubSub.subscribe(ALL_SUBSCRIBING_MSG, func);
      };

      /**
       * Subscribes the passed function to the passed message once
       * @function
       * @alias subscribeOnce
       * @param { String } message The message to subscribe to
       * @param { Function } func The function to call when a new message is published
       * @return { PubSub }
       */
      PubSub.subscribeOnce = function( message, func ){
          var token = PubSub.subscribe( message, function(){
              // before func apply, unsubscribe message
              PubSub.unsubscribe( token );
              func.apply( this, arguments );
          });
          return PubSub;
      };

      /**
       * Clears all subscriptions
       * @function
       * @public
       * @alias clearAllSubscriptions
       */
      PubSub.clearAllSubscriptions = function clearAllSubscriptions(){
          messages = {};
      };

      /**
       * Clear subscriptions by the topic
       * @function
       * @public
       * @alias clearAllSubscriptions
       * @return { int }
       */
      PubSub.clearSubscriptions = function clearSubscriptions(topic){
          var m;
          for (m in messages){
              if (Object.prototype.hasOwnProperty.call(messages, m) && m.indexOf(topic) === 0){
                  delete messages[m];
              }
          }
      };

      /**
         Count subscriptions by the topic
       * @function
       * @public
       * @alias countSubscriptions
       * @return { Array }
      */
      PubSub.countSubscriptions = function countSubscriptions(topic){
          var m;
          // eslint-disable-next-line no-unused-vars
          var token;
          var count = 0;
          for (m in messages) {
              if (Object.prototype.hasOwnProperty.call(messages, m) && m.indexOf(topic) === 0) {
                  for (token in messages[m]) {
                      count++;
                  }
                  break;
              }
          }
          return count;
      };


      /**
         Gets subscriptions by the topic
       * @function
       * @public
       * @alias getSubscriptions
      */
      PubSub.getSubscriptions = function getSubscriptions(topic){
          var m;
          var list = [];
          for (m in messages){
              if (Object.prototype.hasOwnProperty.call(messages, m) && m.indexOf(topic) === 0){
                  list.push(m);
              }
          }
          return list;
      };

      /**
       * Removes subscriptions
       *
       * - When passed a token, removes a specific subscription.
       *
  	 * - When passed a function, removes all subscriptions for that function
       *
  	 * - When passed a topic, removes all subscriptions for that topic (hierarchy)
       * @function
       * @public
       * @alias subscribeOnce
       * @param { String | Function } value A token, function or topic to unsubscribe from
       * @example // Unsubscribing with a token
       * var token = PubSub.subscribe('mytopic', myFunc);
       * PubSub.unsubscribe(token);
       * @example // Unsubscribing with a function
       * PubSub.unsubscribe(myFunc);
       * @example // Unsubscribing from a topic
       * PubSub.unsubscribe('mytopic');
       */
      PubSub.unsubscribe = function(value){
          var descendantTopicExists = function(topic) {
                  var m;
                  for ( m in messages ){
                      if ( Object.prototype.hasOwnProperty.call(messages, m) && m.indexOf(topic) === 0 ){
                          // a descendant of the topic exists:
                          return true;
                      }
                  }

                  return false;
              },
              isTopic    = typeof value === 'string' && ( Object.prototype.hasOwnProperty.call(messages, value) || descendantTopicExists(value) ),
              isToken    = !isTopic && typeof value === 'string',
              isFunction = typeof value === 'function',
              result = false,
              m, message, t;

          if (isTopic){
              PubSub.clearSubscriptions(value);
              return;
          }

          for ( m in messages ){
              if ( Object.prototype.hasOwnProperty.call( messages, m ) ){
                  message = messages[m];

                  if ( isToken && message[value] ){
                      delete message[value];
                      result = value;
                      // tokens are unique, so we can just stop here
                      break;
                  }

                  if (isFunction) {
                      for ( t in message ){
                          if (Object.prototype.hasOwnProperty.call(message, t) && message[t] === value){
                              delete message[t];
                              result = true;
                          }
                      }
                  }
              }
          }

          return result;
      };
  }));
  });
  pubsub.PubSub;

  var urlResolveBrowser = urlResolve;

  /*
  The majority of the module is built by following RFC1808
  url: https://tools.ietf.org/html/rfc1808
  */

  // adds a slash at end if not present
  function _addSlash (url) {
    return url + (url[url.length-1] === '/' ? '' : '/');
  }

  // resolve the ..'s (directory up) and such
  function _pathResolve (path) {
    let pathSplit = path.split('/');

    // happens when path starts with /
    if (pathSplit[0] === '') {
      pathSplit = pathSplit.slice(1);
    }

    // let segmentCount = 0; // number of segments that have been passed
    let resultArray = [];
    pathSplit.forEach((current, index) => {
      // skip occurances of '.'
      if (current !== '.') {
        if (current === '..') {
          resultArray.pop(); // remove previous
        } else if (current !== '' || index === pathSplit.length - 1) {
          resultArray.push(current);
        }
      }
    });
    return '/' + resultArray.join('/');
  }

  // parses a base url string into an object containing host, path and query
  function _baseParse (base) {
    const resultObject = {
      host: '',
      path: '',
      query: '',
      protocol: ''
    };

    let path = base;
    let protocolEndIndex = base.indexOf('//');

    resultObject.protocol = path.substring(0, protocolEndIndex);

    protocolEndIndex += 2; // add two to pass double slash

    const pathIndex = base.indexOf('/', protocolEndIndex);
    const queryIndex = base.indexOf('?');
    const hashIndex = base.indexOf('#');

    if (hashIndex !== -1) {
      path = path.substring(0, hashIndex); // remove hash, not needed for base
    }

    if (queryIndex !== -1) {
      const query = path.substring(queryIndex); // remove query, save in return obj
      resultObject.query = query;
      path = path.substring(0, queryIndex);
    }

    if (pathIndex !== -1) {
      const host = path.substring(0, pathIndex); // separate host & path
      resultObject.host = host;
      path = path.substring(pathIndex);
      resultObject.path = path;
    } else {
      resultObject.host = path; // there was no path, therefore path is host
    }

    return resultObject;
  }

  // https://tools.ietf.org/html/rfc3986#section-3.1
  const _scheme = '[a-z][a-z0-9+.-]*'; // ALPHA *( ALPHA / DIGIT / "+" / "-" / "."  )]
  const _isAbsolute = new RegExp(`^(${_scheme}:)?//`, 'i');

  // parses a relative url string into an object containing the href,
  // hash, query and whether it is a net path, absolute path or relative path
  function _relativeParse (relative) {
    const resultObject = {
      href: relative, // href is always what was passed through
      hash: '',
      query: '',
      netPath: false,
      absolutePath: false,
      relativePath: false
    };
    // check for protocol
    // if protocol exists, is net path (absolute URL)
    if (_isAbsolute.test(relative)) {
      resultObject.netPath = true;
      // return, in this case the relative is the resolved url, no need to parse.
      return resultObject;
    }

    // if / is first, this is an absolute path,
    // I.E. it overwrites the base URL's path
    if (relative[0] === '/') {
      resultObject.absolutePath = true;
      // return resultObject
    } else if (relative !== '') {
      resultObject.relativePath = true;
    }

    let path = relative;
    const queryIndex = relative.indexOf('?');
    const hashIndex = relative.indexOf('#');

    if (hashIndex !== -1) {
      const hash = path.substring(hashIndex);
      resultObject.hash = hash;
      path = path.substring(0, hashIndex);
    }

    if (queryIndex !== -1) {
      const query = path.substring(queryIndex);
      resultObject.query = query;
      path = path.substring(0, queryIndex);
    }

    resultObject.path = path; // whatever is left is path
    return resultObject;
  }

  function _shouldAddSlash (url) {
    const protocolIndex = url.indexOf('//') + 2;
    const noPath = !(url.includes('/', protocolIndex));
    const noQuery = !(url.includes('?', protocolIndex));
    const noHash = !(url.includes('#', protocolIndex));
    return (noPath && noQuery && noHash);
  }

  function _shouldAddProtocol (url) {
    return url.startsWith('//');
  }

  /*
  * PRECONDITION: Base is a fully qualified URL. e.g. http://example.com/
  * optional: path, query or hash
  * returns the resolved url
  */
  function urlResolve (base, relative) {
    base = base.trim();
    relative = relative.trim();

    // about is always absolute
    if (relative.startsWith('about:')) {
      return relative;
    }

    const baseObj = _baseParse(base);
    const relativeObj = _relativeParse(relative);

    if (!baseObj.protocol && !relativeObj.netPath) {
      throw new Error('Error, protocol is not specified');
    }

    if (relativeObj.netPath) { // relative is full qualified URL
      if (_shouldAddProtocol(relativeObj.href)) {
        relativeObj.href = baseObj.protocol + relativeObj.href;
      }

      if (_shouldAddSlash(relativeObj.href)) {
        return _addSlash(relativeObj.href);
      }

      return relativeObj.href;
    } else if (relativeObj.absolutePath) { // relative is an absolute path
      const {path, query, hash} = relativeObj;

      return baseObj.host + _pathResolve(path) + query + hash;
    } else if (relativeObj.relativePath) { // relative is a relative path
      const {path, query, hash} = relativeObj;

      let basePath = baseObj.path;
      let resultString = baseObj.host;

      let resolvePath;

      if (path.length === 0) {
        resolvePath = basePath;
      } else {
        // remove last segment if no slash at end
        basePath = basePath.substring(0, basePath.lastIndexOf('/'));
        resolvePath = _pathResolve(basePath + '/' + path);
      }

      // if result is just the base host, add /
      if ((resolvePath === '') && (!query) && (!hash)) {
        resultString += '/';
      } else {
        resultString += resolvePath + query + hash;
      }

      return resultString;
    } else {
      const {host, path, query} = baseObj;
      // when path and query aren't supplied add slash
      if ((!path) && (!query)) {
        return _addSlash(host);
      }
      return host + path + query + relativeObj.hash;
    }
  }

  const isObject = (value) => typeof value === "object" && !Array.isArray(value) && value !== null;
  const isType = {
    null: (value) => value === null,
    boolean: (value) => typeof value === "boolean",
    object: isObject,
    array: (value) => Array.isArray(value),
    number: (value) => typeof value === "number",
    integer: (value) => Number.isInteger(value),
    string: (value) => typeof value === "string"
  };
  const jsonTypeOf$2 = (value, type) => isType[type](value);

  const splitUrl$2 = (url) => {
    const indexOfHash = url.indexOf("#");
    const ndx = indexOfHash === -1 ? url.length : indexOfHash;
    const urlReference = url.slice(0, ndx);
    const urlFragment = url.slice(ndx + 1);

    return [decodeURI(urlReference), decodeURI(urlFragment)];
  };

  const getScheme = (url) => {
    const matches = RegExp(/^(.+):\/\//).exec(url);
    return matches ? matches[1] : "";
  };

  const safeResolveUrl$1 = (contextUrl, url) => {
    const resolvedUrl = urlResolveBrowser(contextUrl, url);
    const contextId = splitUrl$2(contextUrl)[0];
    if (contextId && getScheme(resolvedUrl) === "file" && getScheme(contextId) !== "file") {
      throw Error(`Can't access file '${resolvedUrl}' resource from network context '${contextUrl}'`);
    }
    return resolvedUrl;
  };

  const CHAR_BACKWARD_SLASH = 47;

  const pathRelative$1 = (from, to) => {
    if (from === to) {
      return "";
    }

    let toStart = 1;
    const fromLen = from.length - 1;
    const toLen = to.length - toStart;

    // Compare paths to find the longest common path from root
    const length = fromLen < toLen ? fromLen : toLen;
    let lastCommonSep = -1;
    let i = 0;
    for (; i < length; i++) {
      const fromCode = from.charCodeAt(i + 1);
      if (fromCode !== to.charCodeAt(toStart + i)) {
        break;
      } else if (fromCode === CHAR_BACKWARD_SLASH) {
        lastCommonSep = i;
      }
    }

    if (toLen > length) {
      if (to.charCodeAt(toStart + i) === CHAR_BACKWARD_SLASH) {
        return to.slice(toStart + i + 1);
      }
      if (i === 0) {
        return to.slice(toStart + i);
      }
    }
    if (fromLen > length) {
      if (from.charCodeAt(i + 1) === CHAR_BACKWARD_SLASH) {
        lastCommonSep = i;
      } else if (length === 0) {
        lastCommonSep = 0;
      }
    }

    let out = "";
    // Generate the relative path based on the path difference between `to` and `from`
    for (i = lastCommonSep + 2; i <= from.length; ++i) {
      if (i === from.length || from.charCodeAt(i) === CHAR_BACKWARD_SLASH) {
        out += out.length === 0 ? ".." : "/..";
      }
    }

    toStart += lastCommonSep;

    // Lastly, append the rest of the destination (`to`) path that comes after
    // the common path parts
    if (out.length > 0) {
      return `${out}${to.slice(toStart, to.length)}`;
    }

    if (to.charCodeAt(toStart) === CHAR_BACKWARD_SLASH) {
      ++toStart;
    }

    return to.slice(toStart, to.length);
  };

  var common = { jsonTypeOf: jsonTypeOf$2, splitUrl: splitUrl$2, safeResolveUrl: safeResolveUrl$1, pathRelative: pathRelative$1 };

  const nil$2 = "";

  const compile$3 = (pointer) => {
    if (pointer.length > 0 && pointer[0] !== "/") {
      throw Error("Invalid JSON Pointer");
    }

    return pointer.split("/").slice(1).map(unescape);
  };

  const get$1 = (pointer, value = undefined) => {
    const ptr = compile$3(pointer);

    const fn = (value) => ptr.reduce(([value, pointer], segment) => {
      return [applySegment(value, segment, pointer), append(segment, pointer)];
    }, [value, ""])[0];

    return value === undefined ? fn : fn(value);
  };

  const set = (pointer, subject = undefined, value = undefined) => {
    const ptr = compile$3(pointer);
    const fn = justCurryIt((subject, value) => _set(ptr, subject, value, nil$2));
    return subject === undefined ? fn : fn(subject, value);
  };

  const _set = (pointer, subject, value, cursor) => {
    if (pointer.length === 0) {
      return value;
    } else if (pointer.length > 1) {
      const segment = pointer.shift();
      return { ...subject, [segment]: _set(pointer, applySegment(subject, segment, cursor), value, append(segment, cursor)) };
    } else if (Array.isArray(subject)) {
      const clonedSubject = [...subject];
      const segment = computeSegment(subject, pointer[0]);
      clonedSubject[segment] = value;
      return clonedSubject;
    } else if (typeof subject === "object" && subject !== null) {
      return { ...subject, [pointer[0]]: value };
    } else {
      return applySegment(subject, pointer[0], cursor);
    }
  };

  const assign = (pointer, subject = undefined, value = undefined) => {
    const ptr = compile$3(pointer);
    const fn = justCurryIt((subject, value) => _assign(ptr, subject, value, nil$2));
    return subject === undefined ? fn : fn(subject, value);
  };

  const _assign = (pointer, subject, value, cursor) => {
    if (pointer.length === 0) {
      return;
    } else if (pointer.length === 1 && !isScalar(subject)) {
      const segment = computeSegment(subject, pointer[0]);
      subject[segment] = value;
    } else {
      const segment = pointer.shift();
      _assign(pointer, applySegment(subject, segment, cursor), value, append(segment, cursor));
    }
  };

  const unset = (pointer, subject = undefined) => {
    const ptr = compile$3(pointer);
    const fn = (subject) => _unset(ptr, subject, nil$2);
    return subject === undefined ? fn : fn(subject);
  };

  const _unset = (pointer, subject, cursor) => {
    if (pointer.length == 0) {
      return undefined;
    } else if (pointer.length > 1) {
      const segment = pointer.shift();
      const value = applySegment(subject, segment, cursor);
      return { ...subject, [segment]: _unset(pointer, value, append(segment, cursor)) };
    } else if (Array.isArray(subject)) {
      return subject.filter((_, ndx) => ndx != pointer[0]);
    } else if (typeof subject === "object" && subject !== null) {
      // eslint-disable-next-line no-unused-vars
      const { [pointer[0]]: _, ...result } = subject;
      return result;
    } else {
      return applySegment(subject, pointer[0], cursor);
    }
  };

  const remove = (pointer, subject = undefined) => {
    const ptr = compile$3(pointer);
    const fn = (subject) => _remove(ptr, subject, nil$2);
    return subject === undefined ? fn : fn(subject);
  };

  const _remove = (pointer, subject, cursor) => {
    if (pointer.length === 0) {
      return;
    } else if (pointer.length > 1) {
      const segment = pointer.shift();
      const value = applySegment(subject, segment, cursor);
      _remove(pointer, value, append(segment, cursor));
    } else if (Array.isArray(subject)) {
      subject.splice(pointer[0], 1);
    } else if (typeof subject === "object" && subject !== null) {
      delete subject[pointer[0]];
    } else {
      applySegment(subject, pointer[0], cursor);
    }
  };

  const append = justCurryIt((segment, pointer) => pointer + "/" + escape(segment));

  const escape = (segment) => segment.toString().replace(/~/g, "~0").replace(/\//g, "~1");
  const unescape = (segment) => segment.toString().replace(/~1/g, "/").replace(/~0/g, "~");
  const computeSegment = (value, segment) => Array.isArray(value) && segment === "-" ? value.length : segment;

  const applySegment = (value, segment, cursor = "") => {
    if (value === undefined) {
      throw TypeError(`Value at '${cursor}' is undefined and does not have property '${segment}'`);
    } else if (value === null) {
      throw TypeError(`Value at '${cursor}' is null and does not have property '${segment}'`);
    } else if (isScalar(value)) {
      throw TypeError(`Value at '${cursor}' is a ${typeof value} and does not have property '${segment}'`);
    } else {
      const computedSegment = computeSegment(value, segment);
      return value[computedSegment];
    }
  };

  const isScalar = (value) => value === null || typeof value !== "object";

  var lib$2 = { nil: nil$2, append, get: get$1, set, assign, unset, remove };
  lib$2.nil;
  lib$2.append;
  lib$2.get;
  lib$2.set;
  lib$2.assign;
  lib$2.unset;
  lib$2.remove;

  const $__value = Symbol("$__value");
  const $__href = Symbol("$__href");

  const cons$1 = (href, value) => Object.freeze({
    [$__href]: href,
    [$__value]: value
  });

  const isReference = (ref) => ref && ref[$__href] !== undefined;
  const href = (ref) => ref[$__href];
  const value$2 = (ref) => ref[$__value];

  var reference = { cons: cons$1, isReference, href, value: value$2 };
  reference.cons;
  reference.isReference;
  reference.href;
  reference.value;

  const { jsonTypeOf: jsonTypeOf$1 } = common;



  const nil$1 = Object.freeze({ id: "", pointer: "", instance: undefined, value: undefined });
  const cons = (instance, id = "") => Object.freeze({ ...nil$1, id, instance, value: instance });
  const uri$1 = (doc) => `${doc.id}#${encodeURI(doc.pointer)}`;
  const value$1 = (doc) => reference.isReference(doc.value) ? reference.value(doc.value) : doc.value;
  const has$1 = (key, doc) => key in value$1(doc);
  const typeOf$1 = justCurryIt((doc, type) => jsonTypeOf$1(value$1(doc), type));

  const step$1 = (key, doc) => Object.freeze({
    ...doc,
    pointer: lib$2.append(key, doc.pointer),
    value: value$1(doc)[key]
  });

  const entries$2 = (doc) => Object.keys(value$1(doc))
    .map((key) => [key, step$1(key, doc)]);

  const keys$1 = (doc) => Object.keys(value$1(doc));

  const map$2 = justCurryIt((fn, doc) => value$1(doc)
    .map((item, ndx, array, thisArg) => fn(step$1(ndx, doc), ndx, array, thisArg)));

  const filter$1 = justCurryIt((fn, doc) => value$1(doc)
    .map((item, ndx, array, thisArg) => step$1(ndx, doc))
    .filter((item, ndx, array, thisArg) => fn(item, ndx, array, thisArg)));

  const reduce$1 = justCurryIt((fn, acc, doc) => value$1(doc)
    .reduce((acc, item, ndx) => fn(acc, step$1(ndx, doc), ndx), acc));

  const every$1 = justCurryIt((fn, doc) => value$1(doc)
    .every((item, ndx, array, thisArg) => fn(step$1(ndx, doc), ndx, array, thisArg)));

  const some$1 = justCurryIt((fn, doc) => value$1(doc)
    .some((item, ndx, array, thisArg) => fn(step$1(ndx, doc), ndx, array, thisArg)));

  const length$1 = (doc) => value$1(doc).length;

  var instance = { nil: nil$1, cons, uri: uri$1, value: value$1, has: has$1, typeOf: typeOf$1, step: step$1, entries: entries$2, keys: keys$1, map: map$2, filter: filter$1, reduce: reduce$1, every: every$1, some: some$1, length: length$1 };
  instance.nil;
  instance.cons;
  instance.uri;
  instance.value;
  instance.has;
  instance.typeOf;
  instance.step;
  instance.entries;
  instance.keys;
  instance.map;
  instance.filter;
  instance.reduce;
  instance.every;
  instance.some;
  instance.length;

  /*!
   * content-type
   * Copyright(c) 2015 Douglas Christopher Wilson
   * MIT Licensed
   */

  /**
   * RegExp to match *( ";" parameter ) in RFC 7231 sec 3.1.1.1
   *
   * parameter     = token "=" ( token / quoted-string )
   * token         = 1*tchar
   * tchar         = "!" / "#" / "$" / "%" / "&" / "'" / "*"
   *               / "+" / "-" / "." / "^" / "_" / "`" / "|" / "~"
   *               / DIGIT / ALPHA
   *               ; any VCHAR, except delimiters
   * quoted-string = DQUOTE *( qdtext / quoted-pair ) DQUOTE
   * qdtext        = HTAB / SP / %x21 / %x23-5B / %x5D-7E / obs-text
   * obs-text      = %x80-FF
   * quoted-pair   = "\" ( HTAB / SP / VCHAR / obs-text )
   */
  var PARAM_REGEXP = /; *([!#$%&'*+.^_`|~0-9A-Za-z-]+) *= *("(?:[\u000b\u0020\u0021\u0023-\u005b\u005d-\u007e\u0080-\u00ff]|\\[\u000b\u0020-\u00ff])*"|[!#$%&'*+.^_`|~0-9A-Za-z-]+) */g;
  var TEXT_REGEXP = /^[\u000b\u0020-\u007e\u0080-\u00ff]+$/;
  var TOKEN_REGEXP = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;

  /**
   * RegExp to match quoted-pair in RFC 7230 sec 3.2.6
   *
   * quoted-pair = "\" ( HTAB / SP / VCHAR / obs-text )
   * obs-text    = %x80-FF
   */
  var QESC_REGEXP = /\\([\u000b\u0020-\u00ff])/g;

  /**
   * RegExp to match chars that must be quoted-pair in RFC 7230 sec 3.2.6
   */
  var QUOTE_REGEXP = /([\\"])/g;

  /**
   * RegExp to match type in RFC 7231 sec 3.1.1.1
   *
   * media-type = type "/" subtype
   * type       = token
   * subtype    = token
   */
  var TYPE_REGEXP = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+\/[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;

  /**
   * Module exports.
   * @public
   */

  var format_1 = format;
  var parse_1 = parse;

  /**
   * Format object to media type.
   *
   * @param {object} obj
   * @return {string}
   * @public
   */

  function format (obj) {
    if (!obj || typeof obj !== 'object') {
      throw new TypeError('argument obj is required')
    }

    var parameters = obj.parameters;
    var type = obj.type;

    if (!type || !TYPE_REGEXP.test(type)) {
      throw new TypeError('invalid type')
    }

    var string = type;

    // append parameters
    if (parameters && typeof parameters === 'object') {
      var param;
      var params = Object.keys(parameters).sort();

      for (var i = 0; i < params.length; i++) {
        param = params[i];

        if (!TOKEN_REGEXP.test(param)) {
          throw new TypeError('invalid parameter name')
        }

        string += '; ' + param + '=' + qstring(parameters[param]);
      }
    }

    return string
  }

  /**
   * Parse media type to object.
   *
   * @param {string|object} string
   * @return {Object}
   * @public
   */

  function parse (string) {
    if (!string) {
      throw new TypeError('argument string is required')
    }

    // support req/res-like objects as argument
    var header = typeof string === 'object'
      ? getcontenttype(string)
      : string;

    if (typeof header !== 'string') {
      throw new TypeError('argument string is required to be a string')
    }

    var index = header.indexOf(';');
    var type = index !== -1
      ? header.substr(0, index).trim()
      : header.trim();

    if (!TYPE_REGEXP.test(type)) {
      throw new TypeError('invalid media type')
    }

    var obj = new ContentType(type.toLowerCase());

    // parse parameters
    if (index !== -1) {
      var key;
      var match;
      var value;

      PARAM_REGEXP.lastIndex = index;

      while ((match = PARAM_REGEXP.exec(header))) {
        if (match.index !== index) {
          throw new TypeError('invalid parameter format')
        }

        index += match[0].length;
        key = match[1].toLowerCase();
        value = match[2];

        if (value[0] === '"') {
          // remove quotes and escapes
          value = value
            .substr(1, value.length - 2)
            .replace(QESC_REGEXP, '$1');
        }

        obj.parameters[key] = value;
      }

      if (index !== header.length) {
        throw new TypeError('invalid parameter format')
      }
    }

    return obj
  }

  /**
   * Get content-type from req/res objects.
   *
   * @param {object}
   * @return {Object}
   * @private
   */

  function getcontenttype (obj) {
    var header;

    if (typeof obj.getHeader === 'function') {
      // res-like
      header = obj.getHeader('content-type');
    } else if (typeof obj.headers === 'object') {
      // req-like
      header = obj.headers && obj.headers['content-type'];
    }

    if (typeof header !== 'string') {
      throw new TypeError('content-type header is missing from object')
    }

    return header
  }

  /**
   * Quote a string if necessary.
   *
   * @param {string} val
   * @return {string}
   * @private
   */

  function qstring (val) {
    var str = String(val);

    // no need to quote tokens
    if (TOKEN_REGEXP.test(str)) {
      return str
    }

    if (str.length > 0 && !TEXT_REGEXP.test(str)) {
      throw new TypeError('invalid parameter value')
    }

    return '"' + str.replace(QUOTE_REGEXP, '\\$1') + '"'
  }

  /**
   * Class to represent a content type.
   * @private
   */
  function ContentType (type) {
    this.parameters = Object.create(null);
    this.type = type;
  }

  var contentType = {
  	format: format_1,
  	parse: parse_1
  };

  var entries$1 = async (doc) => Object.entries(await doc);

  var map$1 = justCurryIt(async (fn, doc) => (await doc).map(fn));

  var reduce = justCurryIt(async (fn, acc, doc) => {
    return (await doc).reduce(async (acc, item) => fn(await acc, item), acc);
  });

  var filter = justCurryIt(async (fn, doc, options = {}) => {
    return reduce(async (acc, item) => {
      return (await fn(item)) ? acc.concat([item]) : acc;
    }, [], doc, options);
  });

  var some = justCurryIt(async (fn, doc) => {
    const results = await map$1(fn, doc);
    return (await Promise.all(results))
      .some((a) => a);
  });

  var every = justCurryIt(async (fn, doc) => {
    const results = await map$1(fn, doc);
    return (await Promise.all(results))
      .every((a) => a);
  });

  var pipeline = justCurryIt((fns, doc) => {
    return fns.reduce(async (acc, fn) => fn(await acc), doc);
  });

  var all = (doc) => Promise.all(doc);

  var allValues = (doc) => {
    return pipeline([
      entries$1,
      reduce(async (acc, [propertyName, propertyValue]) => {
        acc[propertyName] = await propertyValue;
        return acc;
      }, {})
    ], doc);
  };

  var lib$1 = {
    entries: entries$1,
    map: map$1,
    filter: filter,
    reduce: reduce,
    some: some,
    every: every,
    pipeline: pipeline,
    all: all,
    allValues: allValues
  };
  lib$1.entries;
  lib$1.map;
  lib$1.filter;
  lib$1.reduce;
  lib$1.some;
  lib$1.every;
  lib$1.pipeline;
  lib$1.all;
  lib$1.allValues;

  var fetch_browser = fetch;

  const { jsonTypeOf, splitUrl: splitUrl$1, safeResolveUrl, pathRelative } = common;




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

  const add$1 = (schema, url = "", defaultSchemaVersion = "") => {
    schema = JSON.parse(JSON.stringify(schema));

    // Schema Version
    const schemaVersion = splitUrl$1(schema["$schema"] || defaultSchemaVersion)[0];
    if (!schemaVersion) {
      throw Error("Couldn't determine schema version");
    }
    delete schema["$schema"];

    // Identifier
    const baseToken = getConfig(schemaVersion, "baseToken");
    const anchorToken = getConfig(schemaVersion, "anchorToken");
    const externalId = splitUrl$1(url)[0];
    if (!externalId && !splitUrl$1(schema[baseToken] || "")[0]) {
      throw Error("Couldn't determine an identifier for the schema");
    }
    const internalUrl = safeResolveUrl(externalId, schema[baseToken] || "");
    const [id, fragment] = splitUrl$1(internalUrl);
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
      schema: processSchema(schema, id, schemaVersion, lib$2.nil, anchors, dynamicAnchors),
      anchors: anchors,
      dynamicAnchors: dynamicAnchors,
      vocabulary: vocabulary,
      validated: false
    };

    return id;
  };

  const processSchema = (subject, id, schemaVersion, pointer, anchors, dynamicAnchors) => {
    if (jsonTypeOf(subject, "object")) {
      const embeddedSchemaVersion = typeof subject["$schema"] === "string" ? splitUrl$1(subject["$schema"])[0] : schemaVersion;
      const embeddedEmbeddedToken = getConfig(embeddedSchemaVersion, "embeddedToken");
      const embeddedAnchorToken = getConfig(embeddedSchemaVersion, "anchorToken");
      if (typeof subject[embeddedEmbeddedToken] === "string" && (embeddedEmbeddedToken !== embeddedAnchorToken || subject[embeddedEmbeddedToken][0] !== "#")) {
        const ref = safeResolveUrl(id, subject[embeddedEmbeddedToken]);
        subject[embeddedEmbeddedToken] = ref;
        add$1(subject, ref, schemaVersion);
        return reference.cons(subject[embeddedEmbeddedToken], subject);
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
        return reference.cons(subject[jrefToken], subject);
      }

      for (const key in subject) {
        subject[key] = processSchema(subject[key], id, schemaVersion, lib$2.append(key, pointer), anchors, dynamicAnchors);
      }

      return subject;
    } else if (Array.isArray(subject)) {
      return subject.map((item, ndx) => processSchema(item, id, schemaVersion, lib$2.append(ndx, pointer), anchors, dynamicAnchors));
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
    pointer: lib$2.nil,
    schema: undefined,
    value: undefined,
    anchors: {},
    dynamicAnchors: {},
    validated: true
  });

  const get = async (url, contextDoc = nil) => {
    const resolvedUrl = safeResolveUrl(uri(contextDoc), url);
    const [id, fragment] = splitUrl$1(resolvedUrl);

    if (!hasStoredSchema(id)) {
      const response = await fetch_browser(id, { headers: { Accept: "application/schema+json" } });
      if (response.status >= 400) {
        await response.text(); // Sometimes node hangs without this hack
        throw Error(`Failed to retrieve schema with id: ${id}`);
      }

      if (response.headers.has("content-type")) {
        const contentType$1 = contentType.parse(response.headers.get("content-type")).type;
        if (contentType$1 !== "application/schema+json") {
          throw Error(`${id} is not a schema. Found a document with media type: ${contentType$1}`);
        }
      }

      add$1(await response.json(), id);
    }

    const storedSchema = getStoredSchema(id);
    const pointer = fragment[0] !== "/" ? getAnchorPointer(storedSchema, fragment) : fragment;
    const doc = Object.freeze({
      ...storedSchema,
      pointer: pointer,
      value: lib$2.get(pointer, storedSchema.schema)
    });

    return followReferences$1(doc);
  };

  const followReferences$1 = (doc) => reference.isReference(doc.value) ? get(reference.href(doc.value), doc) : doc;

  const getAnchorPointer = (schema, fragment) => {
    if (!(fragment in schema.anchors)) {
      throw Error(`No such anchor '${encodeURI(schema.id)}#${encodeURI(fragment)}'`);
    }

    return schema.anchors[fragment];
  };

  // Utility Functions
  const uri = (doc) => `${doc.id}#${encodeURI(doc.pointer)}`;
  const value = (doc) => reference.isReference(doc.value) ? reference.value(doc.value) : doc.value;
  const has = (key, doc) => key in value(doc);
  const typeOf = (doc, type) => jsonTypeOf(value(doc), type);

  const step = (key, doc) => {
    const storedSchema = getStoredSchema(doc.id);
    const nextDoc = Object.freeze({
      ...doc,
      pointer: lib$2.append(key, doc.pointer),
      value: value(doc)[key],
      validated: storedSchema.validated
    });
    return followReferences$1(nextDoc);
  };

  const keys = (doc) => Object.keys(value(doc));

  const entries = (doc) => lib$1.pipeline([
    value,
    Object.keys,
    lib$1.map(async (key) => [key, await step(key, doc)]),
    lib$1.all
  ], doc);

  const map = justCurryIt((fn, doc) => lib$1.pipeline([
    value,
    lib$1.map(async (item, ndx) => fn(await step(ndx, doc), ndx)),
    lib$1.all
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
      if (!reference.isReference(value)) {
        return value;
      }

      const refValue = reference.value(value);
      const embeddedDialect = refValue.$schema || schemaDoc.schemaVersion;
      const embeddedToken = getConfig(embeddedDialect, "embeddedToken");
      if (!fullOptions.includeEmbedded && embeddedToken in refValue) {
        return;
      } else {
        return reference.value(value);
      }
    }));

    const dynamicAnchorToken = getConfig(schemaDoc.schemaVersion, "dynamicAnchorToken");
    Object.entries(schemaDoc.dynamicAnchors)
      .forEach(([anchor, uri]) => {
        const pointer = splitUrl$1(uri)[1];
        lib$2.assign(pointer, schema, {
          [dynamicAnchorToken]: anchor,
          ...lib$2.get(pointer, schema)
        });
      });

    const anchorToken = getConfig(schemaDoc.schemaVersion, "anchorToken");
    Object.entries(schemaDoc.anchors)
      .filter(([anchor]) => anchor !== "")
      .forEach(([anchor, pointer]) => {
        lib$2.assign(pointer, schema, {
          [anchorToken]: anchor,
          ...lib$2.get(pointer, schema)
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

  var schema = {
    setConfig, getConfig,
    add: add$1, get, markValidated,
    uri, value, getAnchorPointer, typeOf, has, step, keys, entries, map, length,
    toSchema
  };
  schema.setConfig;
  schema.getConfig;
  schema.add;
  schema.get;
  schema.markValidated;
  schema.uri;
  schema.value;
  schema.getAnchorPointer;
  schema.typeOf;
  schema.has;
  schema.step;
  schema.keys;
  schema.entries;
  schema.map;
  schema.length;
  schema.toSchema;

  class InvalidSchemaError extends Error {
    constructor(output) {
      super("Invalid Schema");
      this.name = this.constructor.name;
      this.output = output;
    }
  }

  var invalidSchemaError = InvalidSchemaError;

  const { splitUrl } = common;





  const FLAG = "FLAG", BASIC = "BASIC", DETAILED = "DETAILED", VERBOSE = "VERBOSE";

  let metaOutputFormat = DETAILED;
  let shouldMetaValidate = true;

  const validate$1 = async (schema, value = undefined, outputFormat = undefined) => {
    const compiled = await compile$2(schema);
    const interpretAst = (value, outputFormat) => interpret$2(compiled, instance.cons(value), outputFormat);

    return value === undefined ? interpretAst : interpretAst(value, outputFormat);
  };

  const compile$2 = async (schema) => {
    const ast = { metaData: {} };
    const schemaUri = await compileSchema(schema, ast);
    return { ast, schemaUri };
  };

  const interpret$2 = justCurryIt(({ ast, schemaUri }, value, outputFormat = FLAG) => {
    if (![FLAG, BASIC, DETAILED, VERBOSE].includes(outputFormat)) {
      throw Error(`The '${outputFormat}' error format is not supported`);
    }

    const output = [];
    const subscriptionToken = pubsub.subscribe("result", outputHandler(outputFormat, output));
    interpretSchema(schemaUri, value, ast, {});
    pubsub.unsubscribe(subscriptionToken);

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
  const compileSchema = async (schema$1, ast) => {
    schema$1 = await followReferences(schema$1);

    // Vocabularies
    if (!hasKeyword(`${schema$1.schemaVersion}#validate`)) {
      const metaSchema = await schema.get(schema$1.schemaVersion);

      // Check for mandatory vocabularies
      const mandatoryVocabularies = schema.getConfig(metaSchema.id, "mandatoryVocabularies") || [];
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
    if (shouldMetaValidate && !schema$1.validated) {
      schema.markValidated(schema$1.id);

      // Compile
      if (!(schema$1.schemaVersion in metaValidators)) {
        const metaSchema = await schema.get(schema$1.schemaVersion);
        const compiledSchema = await compile$2(metaSchema);
        metaValidators[metaSchema.id] = interpret$2(compiledSchema);
      }

      // Interpret
      const schemaInstance = instance.cons(schema$1.schema, schema$1.id);
      const metaResults = metaValidators[schema$1.schemaVersion](schemaInstance, metaOutputFormat);
      if (!metaResults.valid) {
        throw new invalidSchemaError(metaResults);
      }
    }

    // Compile
    if (!(schema$1.id in ast.metaData)) {
      ast.metaData[schema$1.id] = {
        id: schema$1.id,
        dynamicAnchors: schema$1.dynamicAnchors,
        anchors: schema$1.anchors
      };
    }
    return getKeyword(`${schema$1.schemaVersion}#validate`).compile(schema$1, ast);
  };

  const followReferences = async (doc) => {
    return schema.typeOf(doc, "string") ? followReferences(await schema.get(schema.value(doc), doc)) : doc;
  };

  const interpretSchema = (schemaUri, instance, ast, dynamicAnchors) => {
    const keywordId = getKeywordId(schemaUri, ast);
    const id = splitUrl(schemaUri)[0];
    return getKeyword(keywordId).interpret(schemaUri, instance, ast, { ...ast.metaData[id].dynamicAnchors, ...dynamicAnchors });
  };

  const collectEvaluatedProperties$1 = (schemaUri, instance, ast, dynamicAnchors, isTop) => {
    const keywordId = getKeywordId(schemaUri, ast);
    return getKeyword(keywordId).collectEvaluatedProperties(schemaUri, instance, ast, dynamicAnchors, isTop);
  };

  const collectEvaluatedItems$1 = (schemaUri, instance, ast, dynamicAnchors, isTop) => {
    const keywordId = getKeywordId(schemaUri, ast);
    return getKeyword(keywordId).collectEvaluatedItems(schemaUri, instance, ast, dynamicAnchors, isTop);
  };

  const getKeywordId = (schemaUri, ast) => {
    if (!(schemaUri in ast)) {
      throw Error(`No schema found at ${schemaUri}`);
    }

    return ast[schemaUri][0];
  };

  const add = (schema$1, url = "", defaultSchemaVersion = "") => {
    const id = schema.add(schema$1, url, defaultSchemaVersion);
    delete metaValidators[id];
  };

  var core = {
    validate: validate$1, compile: compile$2, interpret: interpret$2,
    setMetaOutputFormat, setShouldMetaValidate, FLAG, BASIC, DETAILED, VERBOSE,
    add, getKeyword, hasKeyword, defineVocabulary,
    compileSchema, interpretSchema, collectEvaluatedProperties: collectEvaluatedProperties$1, collectEvaluatedItems: collectEvaluatedItems$1
  };
  core.validate;
  core.compile;
  core.interpret;
  core.setMetaOutputFormat;
  core.setShouldMetaValidate;
  core.FLAG;
  core.BASIC;
  core.DETAILED;
  core.VERBOSE;
  core.add;
  core.getKeyword;
  core.hasKeyword;
  core.defineVocabulary;
  core.compileSchema;
  core.interpretSchema;
  core.collectEvaluatedProperties;
  core.collectEvaluatedItems;

  const compile$1 = (schema$1) => schema.value(schema$1);
  const interpret$1 = () => true;

  var metaData = { compile: compile$1, interpret: interpret$1 };
  metaData.compile;
  metaData.interpret;

  const compile = async (schema$1, ast) => {
    const url = schema.uri(schema$1);
    if (!(url in ast)) {
      ast[url] = false; // Place dummy entry in ast to avoid recursive loops

      const schemaValue = schema.value(schema$1);
      if (!["object", "boolean"].includes(typeof schemaValue)) {
        throw Error(`No schema found at '${schema.uri(schema$1)}'`);
      }

      ast[url] = [
        `${schema$1.schemaVersion}#validate`,
        schema.uri(schema$1),
        typeof schemaValue === "boolean" ? schemaValue : await lib$1.pipeline([
          schema.entries,
          lib$1.map(([keyword, keywordSchema]) => [`${schema$1.schemaVersion}#${keyword}`, keywordSchema]),
          lib$1.filter(([keywordId]) => core.hasKeyword(keywordId) && keywordId !== `${schema$1.schemaVersion}#validate`),
          lib$1.map(async ([keywordId, keywordSchema]) => {
            const keywordAst = await core.getKeyword(keywordId).compile(keywordSchema, ast, schema$1);
            return [keywordId, schema.uri(keywordSchema), keywordAst];
          }),
          lib$1.all
        ], schema$1)
      ];
    }

    return url;
  };

  const interpret = (uri, instance$1, ast, dynamicAnchors) => {
    const [keywordId, schemaUrl, nodes] = ast[uri];

    pubsub.publishSync("result.start");
    const isValid = typeof nodes === "boolean" ? nodes : nodes
      .every(([keywordId, schemaUrl, keywordValue]) => {
        pubsub.publishSync("result.start");
        const isValid = core.getKeyword(keywordId).interpret(keywordValue, instance$1, ast, dynamicAnchors);

        pubsub.publishSync("result", {
          keyword: keywordId,
          absoluteKeywordLocation: schemaUrl,
          instanceLocation: instance.uri(instance$1),
          valid: isValid,
          ast: keywordValue
        });
        pubsub.publishSync("result.end");
        return isValid;
      });

    pubsub.publishSync("result", {
      keyword: keywordId,
      absoluteKeywordLocation: schemaUrl,
      instanceLocation: instance.uri(instance$1),
      valid: isValid,
      ast: uri
    });
    pubsub.publishSync("result.end");
    return isValid;
  };

  const collectEvaluatedProperties = (uri, instance, ast, dynamicAnchors, isTop = false) => {
    const nodes = ast[uri][2];

    if (typeof nodes === "boolean") {
      return nodes ? [] : false;
    }

    return nodes
      .filter(([keywordId]) => !isTop || !keywordId.endsWith("#unevaluatedProperties"))
      .reduce((acc, [keywordId, , keywordValue]) => {
        const propertyNames = acc && core.getKeyword(keywordId).collectEvaluatedProperties(keywordValue, instance, ast, dynamicAnchors);
        return propertyNames !== false && [...acc, ...propertyNames];
      }, []);
  };

  const collectEvaluatedItems = (uri, instance, ast, dynamicAnchors, isTop = false) => {
    const nodes = ast[uri][2];

    if (typeof nodes === "boolean") {
      return nodes ? new Set() : false;
    }

    return nodes
      .filter(([keywordId]) => !isTop || !keywordId.endsWith("#unevaluatedItems"))
      .reduce((acc, [keywordId, , keywordValue]) => {
        const itemIndexes = acc !== false && core.getKeyword(keywordId).collectEvaluatedItems(keywordValue, instance, ast, dynamicAnchors);
        return itemIndexes !== false && new Set([...acc, ...itemIndexes]);
      }, new Set());
  };

  var validate = { compile, interpret, collectEvaluatedProperties, collectEvaluatedItems };
  validate.compile;
  validate.interpret;
  validate.collectEvaluatedProperties;
  validate.collectEvaluatedItems;

  var keywords = { metaData, validate };
  keywords.metaData;
  keywords.validate;

  var lib = { Core: core, Schema: schema, Instance: instance, Reference: reference, Keywords: keywords, InvalidSchemaError: invalidSchemaError };
  var lib_1 = lib.Core;
  var lib_2 = lib.Schema;
  var lib_3 = lib.Instance;
  var lib_4 = lib.Reference;
  var lib_5 = lib.Keywords;
  var lib_6 = lib.InvalidSchemaError;

  exports.Core = lib_1;
  exports.Instance = lib_3;
  exports.InvalidSchemaError = lib_6;
  exports.Keywords = lib_5;
  exports.Reference = lib_4;
  exports.Schema = lib_2;
  exports["default"] = lib;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=json-schema-core-umd.js.map
