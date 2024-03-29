var JsonSchema = (function (exports) {
  'use strict';

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

      if (root.PubSub) {
          PubSub = root.PubSub;
          console.warn("PubSub already loaded, using existing version");
      } else {
          root.PubSub = PubSub;
          factory(PubSub);
      }
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

  const isObject$1 = (value) => typeof value === "object" && !Array.isArray(value) && value !== null;
  const isType = {
    null: (value) => value === null,
    boolean: (value) => typeof value === "boolean",
    object: isObject$1,
    array: (value) => Array.isArray(value),
    number: (value) => typeof value === "number",
    integer: (value) => Number.isInteger(value),
    string: (value) => typeof value === "string"
  };
  const jsonTypeOf$2 = (value, type) => isType[type](value);

  const splitUrl$4 = (url) => {
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
    const contextId = splitUrl$4(contextUrl)[0];
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

  var common$1 = { jsonTypeOf: jsonTypeOf$2, splitUrl: splitUrl$4, safeResolveUrl: safeResolveUrl$1, pathRelative: pathRelative$1 };

  const nil$2 = "";

  const compile$P = (pointer) => {
    if (pointer.length > 0 && pointer[0] !== "/") {
      throw Error("Invalid JSON Pointer");
    }

    return pointer.split("/").slice(1).map(unescape);
  };

  const get$1 = (pointer, value = undefined) => {
    const ptr = compile$P(pointer);

    const fn = (value) => ptr.reduce(([value, pointer], segment) => {
      return [applySegment(value, segment, pointer), append(segment, pointer)];
    }, [value, ""])[0];

    return value === undefined ? fn : fn(value);
  };

  const set = (pointer, subject = undefined, value = undefined) => {
    const ptr = compile$P(pointer);
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
    const ptr = compile$P(pointer);
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
    const ptr = compile$P(pointer);
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
    const ptr = compile$P(pointer);
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

  var lib$3 = { nil: nil$2, append, get: get$1, set, assign, unset, remove };
  lib$3.nil;
  lib$3.append;
  lib$3.get;
  lib$3.set;
  lib$3.assign;
  lib$3.unset;
  lib$3.remove;

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

  const { jsonTypeOf: jsonTypeOf$1 } = common$1;



  const nil$1 = Object.freeze({ id: "", pointer: "", instance: undefined, value: undefined });
  const cons = (instance, id = "") => Object.freeze({ ...nil$1, id, instance, value: instance });
  const uri$1 = (doc) => `${doc.id}#${encodeURI(doc.pointer)}`;
  const value$1 = (doc) => reference.isReference(doc.value) ? reference.value(doc.value) : doc.value;
  const has$1 = (key, doc) => key in value$1(doc);
  const typeOf$1 = justCurryIt((doc, type) => jsonTypeOf$1(value$1(doc), type));

  const step$1 = (key, doc) => Object.freeze({
    ...doc,
    pointer: lib$3.append(key, doc.pointer),
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

  var format_1 = format$1;
  var parse_1 = parse;

  /**
   * Format object to media type.
   *
   * @param {object} obj
   * @return {string}
   * @public
   */

  function format$1 (obj) {
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

  var lib$2 = {
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
  lib$2.entries;
  lib$2.map;
  lib$2.filter;
  lib$2.reduce;
  lib$2.some;
  lib$2.every;
  lib$2.pipeline;
  lib$2.all;
  lib$2.allValues;

  var fetch_browser = fetch;

  const { jsonTypeOf, splitUrl: splitUrl$3, safeResolveUrl, pathRelative } = common$1;




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
    const schemaVersion = splitUrl$3(schema["$schema"] || defaultSchemaVersion)[0];
    if (!schemaVersion) {
      throw Error("Couldn't determine schema version");
    }
    delete schema["$schema"];

    // Identifier
    const baseToken = getConfig(schemaVersion, "baseToken");
    const anchorToken = getConfig(schemaVersion, "anchorToken");
    const externalId = splitUrl$3(url)[0];
    if (!externalId && !splitUrl$3(schema[baseToken] || "")[0]) {
      throw Error("Couldn't determine an identifier for the schema");
    }
    const internalUrl = safeResolveUrl(externalId, schema[baseToken] || "");
    const [id, fragment] = splitUrl$3(internalUrl);
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
      schema: processSchema(schema, id, schemaVersion, lib$3.nil, anchors, dynamicAnchors),
      anchors: anchors,
      dynamicAnchors: dynamicAnchors,
      vocabulary: vocabulary,
      validated: false
    };

    return id;
  };

  const processSchema = (subject, id, schemaVersion, pointer, anchors, dynamicAnchors) => {
    if (jsonTypeOf(subject, "object")) {
      const embeddedSchemaVersion = typeof subject["$schema"] === "string" ? splitUrl$3(subject["$schema"])[0] : schemaVersion;
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
        subject[key] = processSchema(subject[key], id, schemaVersion, lib$3.append(key, pointer), anchors, dynamicAnchors);
      }

      return subject;
    } else if (Array.isArray(subject)) {
      return subject.map((item, ndx) => processSchema(item, id, schemaVersion, lib$3.append(ndx, pointer), anchors, dynamicAnchors));
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
    pointer: lib$3.nil,
    schema: undefined,
    value: undefined,
    anchors: {},
    dynamicAnchors: {},
    validated: true
  });

  const get = async (url, contextDoc = nil) => {
    const resolvedUrl = safeResolveUrl(uri(contextDoc), url);
    const [id, fragment] = splitUrl$3(resolvedUrl);

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
      value: lib$3.get(pointer, storedSchema.schema)
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
      pointer: lib$3.append(key, doc.pointer),
      value: value(doc)[key],
      validated: storedSchema.validated
    });
    return followReferences$1(nextDoc);
  };

  const keys = (doc) => Object.keys(value(doc));

  const entries = (doc) => lib$2.pipeline([
    value,
    Object.keys,
    lib$2.map(async (key) => [key, await step(key, doc)]),
    lib$2.all
  ], doc);

  const map = justCurryIt((fn, doc) => lib$2.pipeline([
    value,
    lib$2.map(async (item, ndx) => fn(await step(ndx, doc), ndx)),
    lib$2.all
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
        const pointer = splitUrl$3(uri)[1];
        lib$3.assign(pointer, schema, {
          [dynamicAnchorToken]: anchor,
          ...lib$3.get(pointer, schema)
        });
      });

    const anchorToken = getConfig(schemaDoc.schemaVersion, "anchorToken");
    Object.entries(schemaDoc.anchors)
      .filter(([anchor]) => anchor !== "")
      .forEach(([anchor, pointer]) => {
        lib$3.assign(pointer, schema, {
          [anchorToken]: anchor,
          ...lib$3.get(pointer, schema)
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

  var schema$5 = {
    setConfig, getConfig,
    add: add$1, get, markValidated,
    uri, value, getAnchorPointer, typeOf, has, step, keys, entries, map, length,
    toSchema
  };
  schema$5.setConfig;
  schema$5.getConfig;
  schema$5.add;
  schema$5.get;
  schema$5.markValidated;
  schema$5.uri;
  schema$5.value;
  schema$5.getAnchorPointer;
  schema$5.typeOf;
  schema$5.has;
  schema$5.step;
  schema$5.keys;
  schema$5.entries;
  schema$5.map;
  schema$5.length;
  schema$5.toSchema;

  class InvalidSchemaError$1 extends Error {
    constructor(output) {
      super("Invalid Schema");
      this.name = this.constructor.name;
      this.output = output;
    }
  }

  var invalidSchemaError = InvalidSchemaError$1;

  const { splitUrl: splitUrl$2 } = common$1;





  const FLAG = "FLAG", BASIC = "BASIC", DETAILED = "DETAILED", VERBOSE = "VERBOSE";

  let metaOutputFormat = DETAILED;
  let shouldMetaValidate = true;

  const validate$1 = async (schema, value = undefined, outputFormat = undefined) => {
    const compiled = await compile$O(schema);
    const interpretAst = (value, outputFormat) => interpret$O(compiled, instance.cons(value), outputFormat);

    return value === undefined ? interpretAst : interpretAst(value, outputFormat);
  };

  const compile$O = async (schema) => {
    const ast = { metaData: {} };
    const schemaUri = await compileSchema(schema, ast);
    return { ast, schemaUri };
  };

  const interpret$O = justCurryIt(({ ast, schemaUri }, value, outputFormat = FLAG) => {
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
  const compileSchema = async (schema, ast) => {
    schema = await followReferences(schema);

    // Vocabularies
    if (!hasKeyword(`${schema.schemaVersion}#validate`)) {
      const metaSchema = await schema$5.get(schema.schemaVersion);

      // Check for mandatory vocabularies
      const mandatoryVocabularies = schema$5.getConfig(metaSchema.id, "mandatoryVocabularies") || [];
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
    if (shouldMetaValidate && !schema.validated) {
      schema$5.markValidated(schema.id);

      // Compile
      if (!(schema.schemaVersion in metaValidators)) {
        const metaSchema = await schema$5.get(schema.schemaVersion);
        const compiledSchema = await compile$O(metaSchema);
        metaValidators[metaSchema.id] = interpret$O(compiledSchema);
      }

      // Interpret
      const schemaInstance = instance.cons(schema.schema, schema.id);
      const metaResults = metaValidators[schema.schemaVersion](schemaInstance, metaOutputFormat);
      if (!metaResults.valid) {
        throw new invalidSchemaError(metaResults);
      }
    }

    // Compile
    if (!(schema.id in ast.metaData)) {
      ast.metaData[schema.id] = {
        id: schema.id,
        dynamicAnchors: schema.dynamicAnchors,
        anchors: schema.anchors
      };
    }
    return getKeyword(`${schema.schemaVersion}#validate`).compile(schema, ast);
  };

  const followReferences = async (doc) => {
    return schema$5.typeOf(doc, "string") ? followReferences(await schema$5.get(schema$5.value(doc), doc)) : doc;
  };

  const interpretSchema = (schemaUri, instance, ast, dynamicAnchors) => {
    const keywordId = getKeywordId(schemaUri, ast);
    const id = splitUrl$2(schemaUri)[0];
    return getKeyword(keywordId).interpret(schemaUri, instance, ast, { ...ast.metaData[id].dynamicAnchors, ...dynamicAnchors });
  };

  const collectEvaluatedProperties$e = (schemaUri, instance, ast, dynamicAnchors, isTop) => {
    const keywordId = getKeywordId(schemaUri, ast);
    return getKeyword(keywordId).collectEvaluatedProperties(schemaUri, instance, ast, dynamicAnchors, isTop);
  };

  const collectEvaluatedItems$f = (schemaUri, instance, ast, dynamicAnchors, isTop) => {
    const keywordId = getKeywordId(schemaUri, ast);
    return getKeyword(keywordId).collectEvaluatedItems(schemaUri, instance, ast, dynamicAnchors, isTop);
  };

  const getKeywordId = (schemaUri, ast) => {
    if (!(schemaUri in ast)) {
      throw Error(`No schema found at ${schemaUri}`);
    }

    return ast[schemaUri][0];
  };

  const add = (schema, url = "", defaultSchemaVersion = "") => {
    const id = schema$5.add(schema, url, defaultSchemaVersion);
    delete metaValidators[id];
  };

  var core$2 = {
    validate: validate$1, compile: compile$O, interpret: interpret$O,
    setMetaOutputFormat, setShouldMetaValidate, FLAG, BASIC, DETAILED, VERBOSE,
    add, getKeyword, hasKeyword, defineVocabulary,
    compileSchema, interpretSchema, collectEvaluatedProperties: collectEvaluatedProperties$e, collectEvaluatedItems: collectEvaluatedItems$f
  };
  core$2.validate;
  core$2.compile;
  core$2.interpret;
  core$2.setMetaOutputFormat;
  core$2.setShouldMetaValidate;
  core$2.FLAG;
  core$2.BASIC;
  core$2.DETAILED;
  core$2.VERBOSE;
  core$2.add;
  core$2.getKeyword;
  core$2.hasKeyword;
  core$2.defineVocabulary;
  core$2.compileSchema;
  core$2.interpretSchema;
  core$2.collectEvaluatedProperties;
  core$2.collectEvaluatedItems;

  const compile$N = (schema) => schema$5.value(schema);
  const interpret$N = () => true;

  var metaData$2 = { compile: compile$N, interpret: interpret$N };
  metaData$2.compile;
  metaData$2.interpret;

  const compile$M = async (schema, ast) => {
    const url = schema$5.uri(schema);
    if (!(url in ast)) {
      ast[url] = false; // Place dummy entry in ast to avoid recursive loops

      const schemaValue = schema$5.value(schema);
      if (!["object", "boolean"].includes(typeof schemaValue)) {
        throw Error(`No schema found at '${schema$5.uri(schema)}'`);
      }

      ast[url] = [
        `${schema.schemaVersion}#validate`,
        schema$5.uri(schema),
        typeof schemaValue === "boolean" ? schemaValue : await lib$2.pipeline([
          schema$5.entries,
          lib$2.map(([keyword, keywordSchema]) => [`${schema.schemaVersion}#${keyword}`, keywordSchema]),
          lib$2.filter(([keywordId]) => core$2.hasKeyword(keywordId) && keywordId !== `${schema.schemaVersion}#validate`),
          lib$2.map(async ([keywordId, keywordSchema]) => {
            const keywordAst = await core$2.getKeyword(keywordId).compile(keywordSchema, ast, schema);
            return [keywordId, schema$5.uri(keywordSchema), keywordAst];
          }),
          lib$2.all
        ], schema)
      ];
    }

    return url;
  };

  const interpret$M = (uri, instance$1, ast, dynamicAnchors) => {
    const [keywordId, schemaUrl, nodes] = ast[uri];

    pubsub.publishSync("result.start");
    const isValid = typeof nodes === "boolean" ? nodes : nodes
      .every(([keywordId, schemaUrl, keywordValue]) => {
        pubsub.publishSync("result.start");
        const isValid = core$2.getKeyword(keywordId).interpret(keywordValue, instance$1, ast, dynamicAnchors);

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

  const collectEvaluatedProperties$d = (uri, instance, ast, dynamicAnchors, isTop = false) => {
    const nodes = ast[uri][2];

    if (typeof nodes === "boolean") {
      return nodes ? [] : false;
    }

    return nodes
      .filter(([keywordId]) => !isTop || !keywordId.endsWith("#unevaluatedProperties"))
      .reduce((acc, [keywordId, , keywordValue]) => {
        const propertyNames = acc && core$2.getKeyword(keywordId).collectEvaluatedProperties(keywordValue, instance, ast, dynamicAnchors);
        return propertyNames !== false && [...acc, ...propertyNames];
      }, []);
  };

  const collectEvaluatedItems$e = (uri, instance, ast, dynamicAnchors, isTop = false) => {
    const nodes = ast[uri][2];

    if (typeof nodes === "boolean") {
      return nodes ? new Set() : false;
    }

    return nodes
      .filter(([keywordId]) => !isTop || !keywordId.endsWith("#unevaluatedItems"))
      .reduce((acc, [keywordId, , keywordValue]) => {
        const itemIndexes = acc !== false && core$2.getKeyword(keywordId).collectEvaluatedItems(keywordValue, instance, ast, dynamicAnchors);
        return itemIndexes !== false && new Set([...acc, ...itemIndexes]);
      }, new Set());
  };

  var validate = { compile: compile$M, interpret: interpret$M, collectEvaluatedProperties: collectEvaluatedProperties$d, collectEvaluatedItems: collectEvaluatedItems$e };
  validate.compile;
  validate.interpret;
  validate.collectEvaluatedProperties;
  validate.collectEvaluatedItems;

  var keywords$1 = { metaData: metaData$2, validate };
  keywords$1.metaData;
  keywords$1.validate;

  var lib$1 = { Core: core$2, Schema: schema$5, Instance: instance, Reference: reference, Keywords: keywords$1, InvalidSchemaError: invalidSchemaError };

  const { Core: Core$v, Schema: Schema$N, Instance: Instance$B } = lib$1;


  const compile$L = async (schema, ast, parentSchema) => {
    const items = await Schema$N.step("items", parentSchema);
    const numberOfItems = Schema$N.typeOf(items, "array") ? Schema$N.length(items) : Number.MAX_SAFE_INTEGER;

    if (Schema$N.typeOf(schema, "boolean")) {
      return [numberOfItems, Schema$N.value(schema)];
    } else {
      return [numberOfItems, await Core$v.compileSchema(schema, ast)];
    }
  };

  const interpret$L = ([numberOfItems, additionalItems], instance, ast, dynamicAnchors) => {
    if (!Instance$B.typeOf(instance, "array")) {
      return true;
    }

    if (typeof additionalItems === "string") {
      return Instance$B.every((item, ndx) => ndx < numberOfItems || Core$v.interpretSchema(additionalItems, item, ast, dynamicAnchors), instance);
    } else {
      return Instance$B.every((item, ndx) => ndx < numberOfItems ? true : additionalItems, instance);
    }
  };

  var additionalItems = { compile: compile$L, interpret: interpret$L };
  additionalItems.compile;
  additionalItems.interpret;

  const { Core: Core$u, Schema: Schema$M, Instance: Instance$A } = lib$1;


  const compile$K = async (schema, ast, parentSchema) => {
    const items = await Schema$M.step("items", parentSchema);
    const numberOfItems = Schema$M.typeOf(items, "array") ? Schema$M.length(items) : Number.MAX_SAFE_INTEGER;

    return [numberOfItems, await Core$u.compileSchema(schema, ast)];
  };

  const interpret$K = ([numberOfItems, additionalItems], instance, ast, dynamicAnchors) => {
    if (!Instance$A.typeOf(instance, "array")) {
      return true;
    }

    return Instance$A.every((item, ndx) => ndx < numberOfItems || Core$u.interpretSchema(additionalItems, item, ast, dynamicAnchors), instance);
  };

  const collectEvaluatedItems$d = (keywordValue, instance, ast, dynamicAnchors) => {
    return interpret$K(keywordValue, instance, ast, dynamicAnchors) && new Set(Instance$A.map((item, ndx) => ndx, instance));
  };

  var additionalItems6 = { compile: compile$K, interpret: interpret$K, collectEvaluatedItems: collectEvaluatedItems$d };
  additionalItems6.compile;
  additionalItems6.interpret;
  additionalItems6.collectEvaluatedItems;

  const { Core: Core$t, Schema: Schema$L, Instance: Instance$z } = lib$1;


  const compile$J = async (schema, ast, parentSchema) => {
    const properties = await Schema$L.step("properties", parentSchema);
    const propertyNames = Schema$L.typeOf(properties, "object") ? Schema$L.keys(properties) : [];

    const patternProperties = await Schema$L.step("patternProperties", parentSchema);
    const propertyNamePatterns = Schema$L.typeOf(patternProperties, "object") ? Schema$L.keys(patternProperties).map((pattern) => new RegExp(pattern)) : [];

    if (Schema$L.typeOf(schema, "boolean")) {
      return [propertyNames, propertyNamePatterns, Schema$L.value(schema)];
    } else {
      return [propertyNames, propertyNamePatterns, await Core$t.compileSchema(schema, ast)];
    }
  };

  const interpret$J = ([propertyNames, propertyNamePatterns, additionalProperties], instance, ast, dynamicAnchors) => {
    if (!Instance$z.typeOf(instance, "object")) {
      return true;
    }

    const properties = Instance$z.entries(instance)
      .filter(([propertyName]) => !propertyNames.includes(propertyName) && !propertyNamePatterns.some((pattern) => pattern.test(propertyName)));

    if (typeof additionalProperties === "string") {
      return properties.every(([, property]) => Core$t.interpretSchema(additionalProperties, property, ast, dynamicAnchors));
    } else {
      return properties.length === 0 || additionalProperties;
    }
  };

  var additionalProperties = { compile: compile$J, interpret: interpret$J };
  additionalProperties.compile;
  additionalProperties.interpret;

  const { Core: Core$s, Schema: Schema$K, Instance: Instance$y } = lib$1;


  const compile$I = async (schema, ast, parentSchema) => {
    const propertiesSchema = await Schema$K.step("properties", parentSchema);
    const propertyNames = Schema$K.typeOf(propertiesSchema, "object") ? Schema$K.keys(propertiesSchema) : [];

    const patternProperties = await Schema$K.step("patternProperties", parentSchema);
    const propertyNamePatterns = Schema$K.typeOf(patternProperties, "object") ? Schema$K.keys(patternProperties).map((pattern) => new RegExp(pattern)) : [];

    return [propertyNames, propertyNamePatterns, await Core$s.compileSchema(schema, ast)];
  };

  const interpret$I = ([propertyNames, propertyNamePatterns, additionalProperties], instance, ast, dynamicAnchors) => {
    if (!Instance$y.typeOf(instance, "object")) {
      return true;
    }

    return Instance$y.entries(instance)
      .filter(([propertyName]) => !propertyNames.includes(propertyName) && !propertyNamePatterns.some((pattern) => pattern.test(propertyName)))
      .every(([, property]) => Core$s.interpretSchema(additionalProperties, property, ast, dynamicAnchors));
  };

  const collectEvaluatedProperties$c = (keywordValue, instance, ast, dynamicAnchors) => {
    return interpret$I(keywordValue, instance, ast, dynamicAnchors) && [new RegExp("")];
  };

  var additionalProperties6 = { compile: compile$I, interpret: interpret$I, collectEvaluatedProperties: collectEvaluatedProperties$c };
  additionalProperties6.compile;
  additionalProperties6.interpret;
  additionalProperties6.collectEvaluatedProperties;

  const { Core: Core$r, Schema: Schema$J } = lib$1;



  const compile$H = (schema, ast) => lib$2.pipeline([
    Schema$J.map(async (itemSchema) => Core$r.compileSchema(await itemSchema, ast)),
    lib$2.all
  ], schema);

  const interpret$H = (allOf, instance, ast, dynamicAnchors) => {
    return allOf.every((schemaUrl) => Core$r.interpretSchema(schemaUrl, instance, ast, dynamicAnchors));
  };

  const collectEvaluatedProperties$b = (allOf, instance, ast, dynamicAnchors) => {
    return allOf.reduce((acc, schemaUrl) => {
      const propertyNames = acc && Core$r.collectEvaluatedProperties(schemaUrl, instance, ast, dynamicAnchors);
      return propertyNames !== false && [...acc, ...propertyNames];
    }, []);
  };

  const collectEvaluatedItems$c = (allOf, instance, ast, dynamicAnchors) => {
    return allOf.reduce((acc, schemaUrl) => {
      const itemIndexes = acc !== false && Core$r.collectEvaluatedItems(schemaUrl, instance, ast, dynamicAnchors);
      return itemIndexes !== false && new Set([...acc, ...itemIndexes]);
    }, new Set());
  };

  var allOf = { compile: compile$H, interpret: interpret$H, collectEvaluatedProperties: collectEvaluatedProperties$b, collectEvaluatedItems: collectEvaluatedItems$c };
  allOf.compile;
  allOf.interpret;
  allOf.collectEvaluatedProperties;
  allOf.collectEvaluatedItems;

  const { Core: Core$q, Schema: Schema$I } = lib$1;



  const compile$G = (schema, ast) => lib$2.pipeline([
    Schema$I.map(async (itemSchema) => Core$q.compileSchema(await itemSchema, ast)),
    lib$2.all
  ], schema);

  const interpret$G = (anyOf, instance, ast, dynamicAnchors) => {
    const matches = anyOf.filter((schemaUrl) => Core$q.interpretSchema(schemaUrl, instance, ast, dynamicAnchors));
    return matches.length > 0;
  };

  const collectEvaluatedProperties$a = (anyOf, instance, ast, dynamicAnchors) => {
    return anyOf.reduce((acc, schemaUrl) => {
      const propertyNames = Core$q.collectEvaluatedProperties(schemaUrl, instance, ast, dynamicAnchors);
      return propertyNames !== false ? [...acc || [], ...propertyNames] : acc;
    }, false);
  };

  const collectEvaluatedItems$b = (anyOf, instance, ast, dynamicAnchors) => {
    return anyOf.reduce((acc, schemaUrl) => {
      const itemIndexes = Core$q.collectEvaluatedItems(schemaUrl, instance, ast, dynamicAnchors);
      return itemIndexes !== false ? new Set([...acc || [], ...itemIndexes]) : acc;
    }, false);
  };

  var anyOf = { compile: compile$G, interpret: interpret$G, collectEvaluatedProperties: collectEvaluatedProperties$a, collectEvaluatedItems: collectEvaluatedItems$b };
  anyOf.compile;
  anyOf.interpret;
  anyOf.collectEvaluatedProperties;
  anyOf.collectEvaluatedItems;

  var keyList = Object.keys;
  var native_stringify = JSON.stringify;

  function stringify(val, allowUndefined) {
      var i, max, str, keys, key, propVal, tipeof;

      tipeof = typeof val;

      if (tipeof === 'string') return native_stringify(val);
      if (val === true) return 'true';
      if (val === false) return 'false';
      if (val === null) return 'null';

      if (val instanceof Array) {
          str = '[';
          max = val.length - 1;
          for(i = 0; i < max; i++)
              str += stringify(val[i], false) + ',';
          if (max > -1) {
              str += stringify(val[i], false);
          }

          return str + ']';
      }

      if (val instanceof Object) {
          if (typeof val.toJSON === 'function')
              return stringify(val.toJSON(), allowUndefined);

          // only object is left
          keys = keyList(val).sort();
          max = keys.length;
          str = '';
          i = 0;
          while (i < max) {
              key = keys[i];
              propVal = stringify(val[key], true);
              if (propVal !== undefined) {
                  if (i && str !== '') { //if the string is empty, don't add comma to avoid the json to become invalid.
                      str += ',';
                  }
                  str += native_stringify(key) + ':' + propVal;
              }
              i++;
          }
          return '{' + str + '}';
      }

      switch (tipeof) {
      case 'function':
      case 'undefined':
          return allowUndefined ? undefined : null;
      default:
          return isFinite(val) ? val : null;
      }
  }

  var fastestStableStringify = function(obj) { return '' + stringify(obj, false); };

  const { Schema: Schema$H, Instance: Instance$x } = lib$1;



  const compile$F = (schema) => fastestStableStringify(Schema$H.value(schema));
  const interpret$F = (const_, instance) => fastestStableStringify(Instance$x.value(instance)) === const_;

  var _const = { compile: compile$F, interpret: interpret$F };
  _const.compile;
  _const.interpret;

  const { Core: Core$p, Instance: Instance$w } = lib$1;


  const compile$E = (schema, ast) => Core$p.compileSchema(schema, ast);

  const interpret$E = (contains, instance, ast, dynamicAnchors) => {
    return !Instance$w.typeOf(instance, "array") || Instance$w.some((item) => Core$p.interpretSchema(contains, item, ast, dynamicAnchors), instance);
  };

  var contains = { compile: compile$E, interpret: interpret$E };
  contains.compile;
  contains.interpret;

  const { Core: Core$o, Schema: Schema$G, Instance: Instance$v } = lib$1;


  const compile$D = async (schema, ast, parentSchema) => {
    const contains = await Core$o.compileSchema(schema, ast);

    const minContainsSchema = await Schema$G.step("minContains", parentSchema);
    const minContains = Schema$G.typeOf(minContainsSchema, "number") ? Schema$G.value(minContainsSchema) : 1;

    const maxContainsSchema = await Schema$G.step("maxContains", parentSchema);
    const maxContains = Schema$G.typeOf(maxContainsSchema, "number") ? Schema$G.value(maxContainsSchema) : Number.MAX_SAFE_INTEGER;

    return { contains, minContains, maxContains };
  };

  const interpret$D = ({ contains, minContains, maxContains }, instance, ast, dynamicAnchors) => {
    if (!Instance$v.typeOf(instance, "array")) {
      return true;
    }

    const matches = Instance$v.reduce((matches, item) => {
      return Core$o.interpretSchema(contains, item, ast, dynamicAnchors) ? matches + 1 : matches;
    }, 0, instance);
    return matches >= minContains && matches <= maxContains;
  };

  const collectEvaluatedItems$a = (keywordValue, instance, ast, dynamicAnchors) => {
    return interpret$D(keywordValue, instance, ast, dynamicAnchors) && Instance$v.reduce((matchedIndexes, item, itemIndex) => {
      return Core$o.interpretSchema(keywordValue.contains, item, ast, dynamicAnchors) ? matchedIndexes.add(itemIndex) : matchedIndexes;
    }, new Set(), instance);
  };

  var containsMinContainsMaxContains = { compile: compile$D, interpret: interpret$D, collectEvaluatedItems: collectEvaluatedItems$a };
  containsMinContainsMaxContains.compile;
  containsMinContainsMaxContains.interpret;
  containsMinContainsMaxContains.collectEvaluatedItems;

  const { Core: Core$n, Schema: Schema$F } = lib$1;



  const compile$C = async (schema, ast) => {
    await lib$2.pipeline([
      Schema$F.entries,
      lib$2.map(([, definitionSchema]) => Core$n.compileSchema(definitionSchema, ast)),
      lib$2.all
    ], schema);
  };

  const interpret$C = () => true;

  var definitions = { compile: compile$C, interpret: interpret$C };
  definitions.compile;
  definitions.interpret;

  const { Core: Core$m, Schema: Schema$E, Instance: Instance$u } = lib$1;



  const compile$B = (schema, ast) => lib$2.pipeline([
    Schema$E.entries,
    lib$2.map(async ([key, dependency]) => {
      return [key, Schema$E.typeOf(dependency, "array") ? Schema$E.value(dependency) : await Core$m.compileSchema(dependency, ast)];
    }),
    lib$2.all
  ], schema);

  const interpret$B = (dependencies, instance, ast, dynamicAnchors) => {
    const value = Instance$u.value(instance);

    return !Instance$u.typeOf(instance, "object") || dependencies.every(([propertyName, dependency]) => {
      if (!(propertyName in value)) {
        return true;
      }

      if (Array.isArray(dependency)) {
        return dependency.every((key) => key in value);
      } else {
        return Core$m.interpretSchema(dependency, instance, ast, dynamicAnchors);
      }
    });
  };

  var dependencies = { compile: compile$B, interpret: interpret$B };
  dependencies.compile;
  dependencies.interpret;

  const { Schema: Schema$D, Instance: Instance$t } = lib$1;



  const compile$A = (schema) => lib$2.pipeline([
    Schema$D.entries,
    lib$2.map(([key, dependentRequired]) => [key, Schema$D.value(dependentRequired)]),
    lib$2.all
  ], schema);

  const interpret$A = (dependentRequired, instance) => {
    const value = Instance$t.value(instance);

    return !Instance$t.typeOf(instance, "object") || dependentRequired.every(([propertyName, required]) => {
      return !(propertyName in value) || required.every((key) => key in value);
    });
  };

  var dependentRequired = { compile: compile$A, interpret: interpret$A };
  dependentRequired.compile;
  dependentRequired.interpret;

  const { Core: Core$l, Schema: Schema$C, Instance: Instance$s } = lib$1;



  const compile$z = (schema, ast) => lib$2.pipeline([
    Schema$C.entries,
    lib$2.map(async ([key, dependentSchema]) => [key, await Core$l.compileSchema(dependentSchema, ast)]),
    lib$2.all
  ], schema);

  const interpret$z = (dependentSchemas, instance, ast, dynamicAnchors) => {
    const value = Instance$s.value(instance);

    return !Instance$s.typeOf(instance, "object") || dependentSchemas.every(([propertyName, dependentSchema]) => {
      return !(propertyName in value) || Core$l.interpretSchema(dependentSchema, instance, ast, dynamicAnchors);
    });
  };

  const collectEvaluatedProperties$9 = (dependentSchemas, instance, ast, dynamicAnchors) => {
    return dependentSchemas.reduce((acc, [propertyName, dependentSchema]) => {
      if (!acc || !Instance$s.has(propertyName, instance)) {
        return acc;
      }

      const propertyNames = Core$l.collectEvaluatedProperties(dependentSchema, instance, ast, dynamicAnchors);
      return propertyNames !== false && acc.concat(propertyNames);
    }, []);
  };

  var dependentSchemas = { compile: compile$z, interpret: interpret$z, collectEvaluatedProperties: collectEvaluatedProperties$9 };
  dependentSchemas.compile;
  dependentSchemas.interpret;
  dependentSchemas.collectEvaluatedProperties;

  const { Schema: Schema$B, Instance: Instance$r } = lib$1;



  const compile$y = (schema) => Schema$B.value(schema).map(fastestStableStringify);
  const interpret$y = (enum_, instance) => enum_.some((enumValue) => fastestStableStringify(Instance$r.value(instance)) === enumValue);

  var _enum = { compile: compile$y, interpret: interpret$y };
  _enum.compile;
  _enum.interpret;

  const { Schema: Schema$A, Instance: Instance$q } = lib$1;


  const compile$x = async (schema) => Schema$A.value(schema);
  const interpret$x = (exclusiveMaximum, instance) => !Instance$q.typeOf(instance, "number") || Instance$q.value(instance) < exclusiveMaximum;

  var exclusiveMaximum = { compile: compile$x, interpret: interpret$x };
  exclusiveMaximum.compile;
  exclusiveMaximum.interpret;

  const { Schema: Schema$z, Instance: Instance$p } = lib$1;


  const compile$w = async (schema) => Schema$z.value(schema);
  const interpret$w = (exclusiveMinimum, instance) => !Instance$p.typeOf(instance, "number") || Instance$p.value(instance) > exclusiveMinimum;

  var exclusiveMinimum = { compile: compile$w, interpret: interpret$w };
  exclusiveMinimum.compile;
  exclusiveMinimum.interpret;

  const { Core: Core$k } = lib$1;


  const compile$v = (schema, ast) => Core$k.compileSchema(schema, ast);

  const interpret$v = (ifSchema, instance, ast, dynamicAnchors) => {
    Core$k.interpretSchema(ifSchema, instance, ast, dynamicAnchors);
    return true;
  };

  const collectEvaluatedProperties$8 = (ifSchema, instance, ast, dynamicAnchors) => {
    return Core$k.collectEvaluatedProperties(ifSchema, instance, ast, dynamicAnchors) || [];
  };

  const collectEvaluatedItems$9 = (ifSchema, instance, ast, dynamicAnchors) => {
    return Core$k.collectEvaluatedItems(ifSchema, instance, ast, dynamicAnchors) || new Set();
  };

  var _if = { compile: compile$v, interpret: interpret$v, collectEvaluatedProperties: collectEvaluatedProperties$8, collectEvaluatedItems: collectEvaluatedItems$9 };
  _if.compile;
  _if.interpret;
  _if.collectEvaluatedProperties;
  _if.collectEvaluatedItems;

  const { Core: Core$j, Schema: Schema$y } = lib$1;


  const compile$u = async (schema, ast, parentSchema) => {
    if (Schema$y.has("if", parentSchema)) {
      const ifSchema = await Schema$y.step("if", parentSchema);
      return [await Core$j.compileSchema(ifSchema, ast), await Core$j.compileSchema(schema, ast)];
    } else {
      return [];
    }
  };

  const interpret$u = ([guard, block], instance, ast, dynamicAnchors) => {
    return guard === undefined || !quietInterpretSchema$1(guard, instance, ast, dynamicAnchors) || Core$j.interpretSchema(block, instance, ast, dynamicAnchors);
  };

  // Interpret a schema without events being emitted
  const quietInterpretSchema$1 = (uri, instance, ast, dynamicAnchors) => {
    const nodes = ast[uri][2];

    return typeof nodes === "boolean" ? nodes : nodes
      .every(([keywordId, , keywordValue]) => {
        return Core$j.getKeyword(keywordId).interpret(keywordValue, instance, ast, dynamicAnchors);
      });
  };

  const collectEvaluatedProperties$7 = ([guard, block], instance, ast, dynamicAnchors) => {
    if (guard === undefined || !quietInterpretSchema$1(guard, instance, ast, dynamicAnchors)) {
      return [];
    }

    return Core$j.collectEvaluatedProperties(block, instance, ast, dynamicAnchors);
  };

  const collectEvaluatedItems$8 = ([guard, block], instance, ast, dynamicAnchors) => {
    if (guard === undefined || !quietInterpretSchema$1(guard, instance, ast, dynamicAnchors)) {
      return new Set();
    }

    return Core$j.collectEvaluatedItems(block, instance, ast, dynamicAnchors);
  };

  var then = { compile: compile$u, interpret: interpret$u, collectEvaluatedProperties: collectEvaluatedProperties$7, collectEvaluatedItems: collectEvaluatedItems$8 };
  then.compile;
  then.interpret;
  then.collectEvaluatedProperties;
  then.collectEvaluatedItems;

  const { Core: Core$i, Schema: Schema$x } = lib$1;


  const compile$t = async (schema, ast, parentSchema) => {
    if (Schema$x.has("if", parentSchema)) {
      const ifSchema = await Schema$x.step("if", parentSchema);
      return [await Core$i.compileSchema(ifSchema, ast), await Core$i.compileSchema(schema, ast)];
    } else {
      return [];
    }
  };

  const interpret$t = ([guard, block], instance, ast, dynamicAnchors) => {
    return guard === undefined || quietInterpretSchema(guard, instance, ast, dynamicAnchors) || Core$i.interpretSchema(block, instance, ast, dynamicAnchors);
  };

  // Interpret a schema without events being emitted
  const quietInterpretSchema = (uri, instance, ast, dynamicAnchors) => {
    const nodes = ast[uri][2];

    return typeof nodes === "boolean" ? nodes : nodes
      .every(([keywordId, , keywordValue]) => {
        return Core$i.getKeyword(keywordId).interpret(keywordValue, instance, ast, dynamicAnchors);
      });
  };

  const collectEvaluatedProperties$6 = ([guard, block], instance, ast, dynamicAnchors) => {
    if (guard === undefined || quietInterpretSchema(guard, instance, ast, dynamicAnchors)) {
      return [];
    }

    return Core$i.collectEvaluatedProperties(block, instance, ast, dynamicAnchors);
  };

  const collectEvaluatedItems$7 = ([guard, block], instance, ast, dynamicAnchors) => {
    if (guard === undefined || quietInterpretSchema(guard, instance, ast, dynamicAnchors)) {
      return new Set();
    }

    return Core$i.collectEvaluatedItems(block, instance, ast, dynamicAnchors);
  };

  var _else = { compile: compile$t, interpret: interpret$t, collectEvaluatedProperties: collectEvaluatedProperties$6, collectEvaluatedItems: collectEvaluatedItems$7 };
  _else.compile;
  _else.interpret;
  _else.collectEvaluatedProperties;
  _else.collectEvaluatedItems;

  const { Core: Core$h, Schema: Schema$w, Instance: Instance$o } = lib$1;


  const compile$s = async (schema, ast) => {
    if (Schema$w.typeOf(schema, "array")) {
      const tupleItems = await Schema$w.map((itemSchema) => Core$h.compileSchema(itemSchema, ast), schema);
      return Promise.all(tupleItems);
    } else {
      return Core$h.compileSchema(schema, ast);
    }
  };

  const interpret$s = (items, instance, ast, dynamicAnchors) => {
    if (!Instance$o.typeOf(instance, "array")) {
      return true;
    }

    if (typeof items === "string") {
      return Instance$o.every((itemValue) => Core$h.interpretSchema(items, itemValue, ast, dynamicAnchors), instance);
    } else {
      return Instance$o.every((item, ndx) => !(ndx in items) || Core$h.interpretSchema(items[ndx], item, ast, dynamicAnchors), instance);
    }
  };

  const collectEvaluatedItems$6 = (items, instance, ast, dynamicAnchors) => {
    return interpret$s(items, instance, ast, dynamicAnchors) && (typeof items === "string"
      ? new Set(Instance$o.map((item, itemIndex) => itemIndex, instance))
      : new Set(items.map((item, itemIndex) => itemIndex)));
  };

  var items = { compile: compile$s, interpret: interpret$s, collectEvaluatedItems: collectEvaluatedItems$6 };
  items.compile;
  items.interpret;
  items.collectEvaluatedItems;

  const { Core: Core$g, Schema: Schema$v, Instance: Instance$n } = lib$1;


  const compile$r = async (schema, ast, parentSchema) => {
    const items = await Schema$v.step("prefixItems", parentSchema);
    const numberOfPrefixItems = Schema$v.typeOf(items, "array") ? Schema$v.length(items) : 0;

    return [numberOfPrefixItems, await Core$g.compileSchema(schema, ast)];
  };

  const interpret$r = ([numberOfPrefixItems, items], instance, ast, dynamicAnchors) => {
    if (!Instance$n.typeOf(instance, "array")) {
      return true;
    }

    return Instance$n.every((item, ndx) => ndx < numberOfPrefixItems || Core$g.interpretSchema(items, item, ast, dynamicAnchors), instance);
  };

  const collectEvaluatedItems$5 = (keywordValue, instance, ast, dynamicAnchors) => {
    return interpret$r(keywordValue, instance, ast, dynamicAnchors) && new Set(Instance$n.map((item, ndx) => ndx, instance));
  };

  var items202012 = { compile: compile$r, interpret: interpret$r, collectEvaluatedItems: collectEvaluatedItems$5 };
  items202012.compile;
  items202012.interpret;
  items202012.collectEvaluatedItems;

  const { Schema: Schema$u, Instance: Instance$m } = lib$1;


  const compile$q = (schema) => Schema$u.value(schema);
  const interpret$q = (maxItems, instance) => !Instance$m.typeOf(instance, "array") || Instance$m.length(instance) <= maxItems;

  var maxItems = { compile: compile$q, interpret: interpret$q };
  maxItems.compile;
  maxItems.interpret;

  const { Schema: Schema$t, Instance: Instance$l } = lib$1;


  const compile$p = (schema) => Schema$t.value(schema);
  const interpret$p = (maxLength, instance) => !Instance$l.typeOf(instance, "string") || Instance$l.length(instance) <= maxLength;

  var maxLength = { compile: compile$p, interpret: interpret$p };
  maxLength.compile;
  maxLength.interpret;

  const { Schema: Schema$s, Instance: Instance$k } = lib$1;


  const compile$o = (schema) => Schema$s.value(schema);
  const interpret$o = (maxLength, instance) => !Instance$k.typeOf(instance, "string") || [...Instance$k.value(instance)].length <= maxLength;

  var maxLength6 = { compile: compile$o, interpret: interpret$o };
  maxLength6.compile;
  maxLength6.interpret;

  const { Schema: Schema$r, Instance: Instance$j } = lib$1;


  const compile$n = (schema) => Schema$r.value(schema);
  const interpret$n = (maxProperties, instance) => !Instance$j.typeOf(instance, "object") || Instance$j.keys(instance).length <= maxProperties;

  var maxProperties = { compile: compile$n, interpret: interpret$n };
  maxProperties.compile;
  maxProperties.interpret;

  const { Schema: Schema$q, Instance: Instance$i } = lib$1;


  const compile$m = async (schema, ast, parentSchema) => {
    const exclusiveMaximum = await Schema$q.step("exclusiveMaximum", parentSchema);
    const isExclusive = Schema$q.value(exclusiveMaximum);

    return [Schema$q.value(schema), isExclusive];
  };

  const interpret$m = ([maximum, isExclusive], instance) => {
    if (!Instance$i.typeOf(instance, "number")) {
      return true;
    }

    const value = Instance$i.value(instance);
    return isExclusive ? value < maximum : value <= maximum;
  };

  var maximumExclusiveMaximum = { compile: compile$m, interpret: interpret$m };
  maximumExclusiveMaximum.compile;
  maximumExclusiveMaximum.interpret;

  const { Schema: Schema$p, Instance: Instance$h } = lib$1;


  const compile$l = async (schema) => Schema$p.value(schema);
  const interpret$l = (maximum, instance) => !Instance$h.typeOf(instance, "number") || Instance$h.value(instance) <= maximum;

  var maximum = { compile: compile$l, interpret: interpret$l };
  maximum.compile;
  maximum.interpret;

  const { Schema: Schema$o, Instance: Instance$g } = lib$1;


  const compile$k = (schema) => Schema$o.value(schema);
  const interpret$k = (minItems, instance) => !Instance$g.typeOf(instance, "array") || Instance$g.length(instance) >= minItems;

  var minItems = { compile: compile$k, interpret: interpret$k };
  minItems.compile;
  minItems.interpret;

  const { Schema: Schema$n, Instance: Instance$f } = lib$1;


  const compile$j = (schema) => Schema$n.value(schema);
  const interpret$j = (minLength, instance) => !Instance$f.typeOf(instance, "string") || Instance$f.length(instance) >= minLength;

  var minLength = { compile: compile$j, interpret: interpret$j };
  minLength.compile;
  minLength.interpret;

  const { Schema: Schema$m, Instance: Instance$e } = lib$1;


  const compile$i = (schema) => Schema$m.value(schema);
  const interpret$i = (minLength, instance) => !Instance$e.typeOf(instance, "string") || [...Instance$e.value(instance)].length >= minLength;

  var minLength6 = { compile: compile$i, interpret: interpret$i };
  minLength6.compile;
  minLength6.interpret;

  const { Schema: Schema$l, Instance: Instance$d } = lib$1;


  const compile$h = (schema) => Schema$l.value(schema);
  const interpret$h = (minProperties, instance) => !Instance$d.typeOf(instance, "object") || Instance$d.keys(instance).length >= minProperties;

  var minProperties = { compile: compile$h, interpret: interpret$h };
  minProperties.compile;
  minProperties.interpret;

  const { Schema: Schema$k, Instance: Instance$c } = lib$1;


  const compile$g = async (schema, ast, parentSchema) => {
    const exclusiveMinimum = await Schema$k.step("exclusiveMinimum", parentSchema);
    const isExclusive = Schema$k.value(exclusiveMinimum);

    return [Schema$k.value(schema), isExclusive];
  };

  const interpret$g = ([minimum, isExclusive], instance) => {
    if (!Instance$c.typeOf(instance, "number")) {
      return true;
    }

    const value = Instance$c.value(instance);
    return isExclusive ? value > minimum : value >= minimum;
  };

  var minimumExclusiveMinimum = { compile: compile$g, interpret: interpret$g };
  minimumExclusiveMinimum.compile;
  minimumExclusiveMinimum.interpret;

  const { Schema: Schema$j, Instance: Instance$b } = lib$1;


  const compile$f = async (schema) => Schema$j.value(schema);
  const interpret$f = (minimum, instance) => !Instance$b.typeOf(instance, "number") || Instance$b.value(instance) >= minimum;

  var minimum = { compile: compile$f, interpret: interpret$f };
  minimum.compile;
  minimum.interpret;

  const { Schema: Schema$i, Instance: Instance$a } = lib$1;


  const compile$e = (schema) => Schema$i.value(schema);

  const interpret$e = (multipleOf, instance) => {
    if (!Instance$a.typeOf(instance, "number")) {
      return true;
    }

    const remainder = Instance$a.value(instance) % multipleOf;
    return numberEqual(0, remainder) || numberEqual(multipleOf, remainder);
  };

  const numberEqual = (a, b) => Math.abs(a - b) < 1.19209290e-7;

  var multipleOf = { compile: compile$e, interpret: interpret$e };
  multipleOf.compile;
  multipleOf.interpret;

  const { Core: Core$f } = lib$1;


  const compile$d = Core$f.compileSchema;
  const interpret$d = (not, instance, ast, dynamicAnchors) => !Core$f.interpretSchema(not, instance, ast, dynamicAnchors);

  var not = { compile: compile$d, interpret: interpret$d };
  not.compile;
  not.interpret;

  const { Core: Core$e, Schema: Schema$h } = lib$1;


  const compile$c = async (schema, ast) => {
    const oneOf = await Schema$h.map((itemSchema) => Core$e.compileSchema(itemSchema, ast), schema);
    return Promise.all(oneOf);
  };

  const interpret$c = (oneOf, instance, ast, dynamicAnchors) => {
    let validCount = 0;
    for (const schemaUrl of oneOf) {
      if (Core$e.interpretSchema(schemaUrl, instance, ast, dynamicAnchors)) {
        validCount++;
      }

      if (validCount > 1) {
        break;
      }
    }

    return validCount === 1;
  };

  const collectEvaluatedProperties$5 = (oneOf, instance, ast, dynamicAnchors) => {
    let validCount = 0;
    return oneOf.reduce((acc, schemaUrl) => {
      if (validCount > 1) {
        return false;
      }

      const propertyNames = Core$e.collectEvaluatedProperties(schemaUrl, instance, ast, dynamicAnchors);
      return propertyNames ? validCount++ === 0 && propertyNames : acc;
    }, false);
  };

  const collectEvaluatedItems$4 = (oneOf, instance, ast, dynamicAnchors) => {
    let validCount = 0;
    return oneOf.reduce((acc, schemaUrl) => {
      if (validCount > 1) {
        return false;
      }

      const itemIndexes = Core$e.collectEvaluatedItems(schemaUrl, instance, ast, dynamicAnchors);
      return itemIndexes ? validCount++ === 0 && itemIndexes : acc;
    }, false);
  };

  var oneOf = { compile: compile$c, interpret: interpret$c, collectEvaluatedProperties: collectEvaluatedProperties$5, collectEvaluatedItems: collectEvaluatedItems$4 };
  oneOf.compile;
  oneOf.interpret;
  oneOf.collectEvaluatedProperties;
  oneOf.collectEvaluatedItems;

  const { Schema: Schema$g, Instance: Instance$9 } = lib$1;


  const compile$b = (schema) => new RegExp(Schema$g.value(schema), "u");
  const interpret$b = (pattern, instance) => !Instance$9.typeOf(instance, "string") || pattern.test(Instance$9.value(instance));

  var pattern = { compile: compile$b, interpret: interpret$b };
  pattern.compile;
  pattern.interpret;

  const { Core: Core$d, Schema: Schema$f, Instance: Instance$8 } = lib$1;



  const compile$a = (schema, ast) => lib$2.pipeline([
    Schema$f.entries,
    lib$2.map(async ([pattern, propertySchema]) => [new RegExp(pattern, "u"), await Core$d.compileSchema(propertySchema, ast)]),
    lib$2.all
  ], schema);

  const interpret$a = (patternProperties, instance, ast, dynamicAnchors) => {
    return !Instance$8.typeOf(instance, "object") || patternProperties.every(([pattern, schemaUrl]) => {
      return Instance$8.entries(instance)
        .filter(([propertyName]) => pattern.test(propertyName))
        .every(([, propertyValue]) => Core$d.interpretSchema(schemaUrl, propertyValue, ast, dynamicAnchors));
    });
  };

  const collectEvaluatedProperties$4 = (patternProperties, instance, ast, dynamicAnchors) => {
    return interpret$a(patternProperties, instance, ast, dynamicAnchors) && patternProperties.map(([pattern]) => pattern);
  };

  var patternProperties = { compile: compile$a, interpret: interpret$a, collectEvaluatedProperties: collectEvaluatedProperties$4 };
  patternProperties.compile;
  patternProperties.interpret;
  patternProperties.collectEvaluatedProperties;

  const isObject = (value) => typeof value === "object" && !Array.isArray(value) && value !== null;
  const escapeRegExp$1 = (string) => string.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&");

  const splitUrl$1 = (url) => {
    const indexOfHash = url.indexOf("#");
    const ndx = indexOfHash === -1 ? url.length : indexOfHash;
    const urlReference = url.slice(0, ndx);
    const urlFragment = url.slice(ndx + 1);

    return [decodeURI(urlReference), decodeURI(urlFragment)];
  };

  var common = { isObject, escapeRegExp: escapeRegExp$1, splitUrl: splitUrl$1 };

  const { Core: Core$c, Schema: Schema$e, Instance: Instance$7 } = lib$1;

  const { escapeRegExp } = common;


  const compile$9 = (schema, ast) => lib$2.pipeline([
    Schema$e.entries,
    lib$2.reduce(async (acc, [propertyName, propertySchema]) => {
      acc[propertyName] = await Core$c.compileSchema(propertySchema, ast);
      return acc;
    }, Object.create(null))
  ], schema);

  const interpret$9 = (properties, instance, ast, dynamicAnchors) => {
    return !Instance$7.typeOf(instance, "object") || Instance$7.entries(instance)
      .filter(([propertyName]) => propertyName in properties)
      .every(([propertyName, schemaUrl]) => Core$c.interpretSchema(properties[propertyName], schemaUrl, ast, dynamicAnchors));
  };

  const collectEvaluatedProperties$3 = (properties, instance, ast, dynamicAnchors) => {
    return interpret$9(properties, instance, ast, dynamicAnchors) && Object.keys(properties)
      .map((propertyName) => new RegExp(`^${escapeRegExp(propertyName)}$`));
  };

  var properties = { compile: compile$9, interpret: interpret$9, collectEvaluatedProperties: collectEvaluatedProperties$3 };
  properties.compile;
  properties.interpret;
  properties.collectEvaluatedProperties;

  const { Core: Core$b, Instance: Instance$6 } = lib$1;


  const compile$8 = (schema, ast) => Core$b.compileSchema(schema, ast);

  const interpret$8 = (propertyNames, instance, ast, dynamicAnchors) => {
    return !Instance$6.typeOf(instance, "object") || Instance$6.keys(instance)
      .every((key) => Core$b.interpretSchema(propertyNames, Instance$6.cons(key), ast, dynamicAnchors));
  };

  var propertyNames = { compile: compile$8, interpret: interpret$8 };
  propertyNames.compile;
  propertyNames.interpret;

  const { Core: Core$a, Schema: Schema$d } = lib$1;
  const { splitUrl } = common;


  const compile$7 = async (dynamicRef, ast) => {
    const [, fragment] = splitUrl(Schema$d.value(dynamicRef));
    const referencedSchema = await Schema$d.get(Schema$d.value(dynamicRef), dynamicRef);
    await Core$a.compileSchema(referencedSchema, ast);
    return [referencedSchema.id, fragment];
  };

  const interpret$7 = ([id, fragment], instance, ast, dynamicAnchors) => {
    if (fragment in ast.metaData[id].dynamicAnchors) {
      return Core$a.interpretSchema(dynamicAnchors[fragment], instance, ast, dynamicAnchors);
    } else {
      const pointer = Schema$d.getAnchorPointer(ast.metaData[id], fragment);
      return Core$a.interpretSchema(`${id}#${encodeURI(pointer)}`, instance, ast, dynamicAnchors);
    }
  };

  const collectEvaluatedProperties$2 = Core$a.collectEvaluatedProperties;
  const collectEvaluatedItems$3 = Core$a.collectEvaluatedItems;

  var dynamicRef = { compile: compile$7, interpret: interpret$7, collectEvaluatedProperties: collectEvaluatedProperties$2, collectEvaluatedItems: collectEvaluatedItems$3 };
  dynamicRef.compile;
  dynamicRef.interpret;
  dynamicRef.collectEvaluatedProperties;
  dynamicRef.collectEvaluatedItems;

  const { Core: Core$9, Schema: Schema$c } = lib$1;


  const compile$6 = async (ref, ast) => {
    const referencedSchema = await Schema$c.get(Schema$c.value(ref), ref);
    return Core$9.compileSchema(referencedSchema, ast);
  };

  const interpret$6 = Core$9.interpretSchema;
  const collectEvaluatedProperties$1 = Core$9.collectEvaluatedProperties;
  const collectEvaluatedItems$2 = Core$9.collectEvaluatedItems;

  var ref = { compile: compile$6, interpret: interpret$6, collectEvaluatedProperties: collectEvaluatedProperties$1, collectEvaluatedItems: collectEvaluatedItems$2 };
  ref.compile;
  ref.interpret;
  ref.collectEvaluatedProperties;
  ref.collectEvaluatedItems;

  const { Schema: Schema$b, Instance: Instance$5 } = lib$1;


  const compile$5 = (schema) => Schema$b.value(schema);

  const interpret$5 = (required, instance) => {
    return !Instance$5.typeOf(instance, "object") || required.every((propertyName) => Object.prototype.hasOwnProperty.call(Instance$5.value(instance), propertyName));
  };

  var required = { compile: compile$5, interpret: interpret$5 };
  required.compile;
  required.interpret;

  const { Core: Core$8, Schema: Schema$a, Instance: Instance$4 } = lib$1;



  const compile$4 = (schema, ast) => {
    return lib$2.pipeline([
      Schema$a.map((itemSchema) => Core$8.compileSchema(itemSchema, ast)),
      lib$2.all
    ], schema);
  };

  const interpret$4 = (items, instance, ast, dynamicAnchors) => {
    if (!Instance$4.typeOf(instance, "array")) {
      return true;
    }

    return Instance$4.every((item, ndx) => !(ndx in items) || Core$8.interpretSchema(items[ndx], item, ast, dynamicAnchors), instance);
  };

  const collectEvaluatedItems$1 = (items, instance, ast, dynamicAnchors) => {
    return interpret$4(items, instance, ast, dynamicAnchors) && new Set(items.map((item, ndx) => ndx));
  };

  var tupleItems = { compile: compile$4, interpret: interpret$4, collectEvaluatedItems: collectEvaluatedItems$1 };
  tupleItems.compile;
  tupleItems.interpret;
  tupleItems.collectEvaluatedItems;

  const { Schema: Schema$9, Instance: Instance$3 } = lib$1;


  const compile$3 = (schema) => Schema$9.value(schema);
  const interpret$3 = (type, instance) => typeof type === "string" ? Instance$3.typeOf(instance, type) : type.some(Instance$3.typeOf(instance));

  var type = { compile: compile$3, interpret: interpret$3 };
  type.compile;
  type.interpret;

  const { Core: Core$7, Schema: Schema$8, Instance: Instance$2 } = lib$1;


  const compile$2 = async (schema, ast, parentSchema) => {
    return [Schema$8.uri(parentSchema), await Core$7.compileSchema(schema, ast)];
  };

  const interpret$2 = ([schemaUrl, unevaluatedItems], instance, ast, dynamicAnchors) => {
    if (!Instance$2.typeOf(instance, "array")) {
      return true;
    }

    const itemIndexes = Core$7.collectEvaluatedItems(schemaUrl, instance, ast, dynamicAnchors, true);
    return itemIndexes === false || Instance$2.every((item, itemIndex) => {
      return itemIndexes.has(itemIndex) || Core$7.interpretSchema(unevaluatedItems, Instance$2.step(itemIndex, instance), ast, dynamicAnchors);
    }, instance);
  };

  const collectEvaluatedItems = (keywordValue, instance, ast, dynamicAnchors) => {
    return interpret$2(keywordValue, instance, ast, dynamicAnchors) && new Set(Instance$2.map((item, ndx) => ndx, instance));
  };

  var unevaluatedItems = { compile: compile$2, interpret: interpret$2, collectEvaluatedItems };
  unevaluatedItems.compile;
  unevaluatedItems.interpret;
  unevaluatedItems.collectEvaluatedItems;

  const { Core: Core$6, Schema: Schema$7, Instance: Instance$1 } = lib$1;


  const compile$1 = async (schema, ast, parentSchema) => {
    return [Schema$7.uri(parentSchema), await Core$6.compileSchema(schema, ast)];
  };

  const interpret$1 = ([schemaUrl, unevaluatedProperties], instance, ast, dynamicAnchors) => {
    if (!Instance$1.typeOf(instance, "object")) {
      return true;
    }

    const evaluatedPropertyNames = Core$6.collectEvaluatedProperties(schemaUrl, instance, ast, dynamicAnchors, true);

    return !evaluatedPropertyNames || Instance$1.entries(instance)
      .filter(([propertyName]) => !evaluatedPropertyNames.some((pattern) => propertyName.match(pattern)))
      .every(([, property]) => Core$6.interpretSchema(unevaluatedProperties, property, ast, dynamicAnchors));
  };

  const collectEvaluatedProperties = (keywordValue, instance, ast, dynamicAnchors) =>{
    return interpret$1(keywordValue, instance, ast, dynamicAnchors) && [new RegExp("")];
  };

  var unevaluatedProperties = { compile: compile$1, interpret: interpret$1, collectEvaluatedProperties };
  unevaluatedProperties.compile;
  unevaluatedProperties.interpret;
  unevaluatedProperties.collectEvaluatedProperties;

  const { Schema: Schema$6, Instance } = lib$1;



  const compile = (schema) => Schema$6.value(schema);

  const interpret = (uniqueItems, instance) => {
    if (!Instance.typeOf(instance, "array") || uniqueItems === false) {
      return true;
    }

    const normalizedItems = Instance.map((item) => fastestStableStringify(Instance.value(item)), instance);
    return new Set(normalizedItems).size === normalizedItems.length;
  };

  var uniqueItems = { compile, interpret };
  uniqueItems.compile;
  uniqueItems.interpret;

  const { Keywords } = lib$1;


  var keywords = {
    additionalItems: additionalItems,
    additionalItems6: additionalItems6,
    additionalProperties: additionalProperties,
    additionalProperties6: additionalProperties6,
    allOf: allOf,
    anyOf: anyOf,
    const: _const,
    contains: contains,
    containsMinContainsMaxContains: containsMinContainsMaxContains,
    definitions: definitions,
    dependencies: dependencies,
    dependentRequired: dependentRequired,
    dependentSchemas: dependentSchemas,
    enum: _enum,
    exclusiveMaximum: exclusiveMaximum,
    exclusiveMinimum: exclusiveMinimum,
    if: _if,
    then: then,
    else: _else,
    items: items,
    items202012: items202012,
    maxItems: maxItems,
    maxLength: maxLength,
    maxLength6: maxLength6,
    maxProperties: maxProperties,
    maximumExclusiveMaximum: maximumExclusiveMaximum,
    maximum: maximum,
    metaData: Keywords.metaData,
    minItems: minItems,
    minLength: minLength,
    minLength6: minLength6,
    minProperties: minProperties,
    minimumExclusiveMinimum: minimumExclusiveMinimum,
    minimum: minimum,
    multipleOf: multipleOf,
    not: not,
    oneOf: oneOf,
    pattern: pattern,
    patternProperties: patternProperties,
    properties: properties,
    propertyNames: propertyNames,
    dynamicRef: dynamicRef,
    ref: ref,
    required: required,
    tupleItems: tupleItems,
    type: type,
    unevaluatedItems: unevaluatedItems,
    unevaluatedProperties: unevaluatedProperties,
    uniqueItems: uniqueItems,
    validate: Keywords.validate
  };
  keywords.additionalItems;
  keywords.additionalItems6;
  keywords.additionalProperties;
  keywords.additionalProperties6;
  keywords.allOf;
  keywords.anyOf;
  keywords.contains;
  keywords.containsMinContainsMaxContains;
  keywords.definitions;
  keywords.dependencies;
  keywords.dependentRequired;
  keywords.dependentSchemas;
  keywords.exclusiveMaximum;
  keywords.exclusiveMinimum;
  keywords.then;
  keywords.items;
  keywords.items202012;
  keywords.maxItems;
  keywords.maxLength;
  keywords.maxLength6;
  keywords.maxProperties;
  keywords.maximumExclusiveMaximum;
  keywords.maximum;
  keywords.metaData;
  keywords.minItems;
  keywords.minLength;
  keywords.minLength6;
  keywords.minProperties;
  keywords.minimumExclusiveMinimum;
  keywords.minimum;
  keywords.multipleOf;
  keywords.not;
  keywords.oneOf;
  keywords.pattern;
  keywords.patternProperties;
  keywords.properties;
  keywords.propertyNames;
  keywords.dynamicRef;
  keywords.ref;
  keywords.required;
  keywords.tupleItems;
  keywords.type;
  keywords.unevaluatedItems;
  keywords.unevaluatedProperties;
  keywords.uniqueItems;
  keywords.validate;

  var schema$4 = `{
    "id": "http://json-schema.org/draft-04/schema#",
    "$schema": "http://json-schema.org/draft-04/schema#",
    "description": "Core schema meta-schema",
    "definitions": {
        "schemaArray": {
            "type": "array",
            "minItems": 1,
            "items": { "$ref": "#" }
        },
        "positiveInteger": {
            "type": "integer",
            "minimum": 0
        },
        "positiveIntegerDefault0": {
            "allOf": [ { "$ref": "#/definitions/positiveInteger" }, { "default": 0 } ]
        },
        "simpleTypes": {
            "enum": [ "array", "boolean", "integer", "null", "number", "object", "string" ]
        },
        "stringArray": {
            "type": "array",
            "items": { "type": "string" },
            "minItems": 1,
            "uniqueItems": true
        }
    },
    "type": "object",
    "properties": {
        "id": {
            "type": "string"
        },
        "$schema": {
            "type": "string"
        },
        "title": {
            "type": "string"
        },
        "description": {
            "type": "string"
        },
        "default": {},
        "multipleOf": {
            "type": "number",
            "minimum": 0,
            "exclusiveMinimum": true
        },
        "maximum": {
            "type": "number"
        },
        "exclusiveMaximum": {
            "type": "boolean",
            "default": false
        },
        "minimum": {
            "type": "number"
        },
        "exclusiveMinimum": {
            "type": "boolean",
            "default": false
        },
        "maxLength": { "$ref": "#/definitions/positiveInteger" },
        "minLength": { "$ref": "#/definitions/positiveIntegerDefault0" },
        "pattern": {
            "type": "string",
            "format": "regex"
        },
        "additionalItems": {
            "anyOf": [
                { "type": "boolean" },
                { "$ref": "#" }
            ],
            "default": {}
        },
        "items": {
            "anyOf": [
                { "$ref": "#" },
                { "$ref": "#/definitions/schemaArray" }
            ],
            "default": {}
        },
        "maxItems": { "$ref": "#/definitions/positiveInteger" },
        "minItems": { "$ref": "#/definitions/positiveIntegerDefault0" },
        "uniqueItems": {
            "type": "boolean",
            "default": false
        },
        "maxProperties": { "$ref": "#/definitions/positiveInteger" },
        "minProperties": { "$ref": "#/definitions/positiveIntegerDefault0" },
        "required": { "$ref": "#/definitions/stringArray" },
        "additionalProperties": {
            "anyOf": [
                { "type": "boolean" },
                { "$ref": "#" }
            ],
            "default": {}
        },
        "definitions": {
            "type": "object",
            "additionalProperties": { "$ref": "#" },
            "default": {}
        },
        "properties": {
            "type": "object",
            "additionalProperties": { "$ref": "#" },
            "default": {}
        },
        "patternProperties": {
            "type": "object",
            "additionalProperties": { "$ref": "#" },
            "default": {}
        },
        "dependencies": {
            "type": "object",
            "additionalProperties": {
                "anyOf": [
                    { "$ref": "#" },
                    { "$ref": "#/definitions/stringArray" }
                ]
            }
        },
        "enum": {
            "type": "array",
            "minItems": 1,
            "uniqueItems": true
        },
        "type": {
            "anyOf": [
                { "$ref": "#/definitions/simpleTypes" },
                {
                    "type": "array",
                    "items": { "$ref": "#/definitions/simpleTypes" },
                    "minItems": 1,
                    "uniqueItems": true
                }
            ]
        },
        "format": { "type": "string" },
        "allOf": { "$ref": "#/definitions/schemaArray" },
        "anyOf": { "$ref": "#/definitions/schemaArray" },
        "oneOf": { "$ref": "#/definitions/schemaArray" },
        "not": { "$ref": "#" }
    },
    "dependencies": {
        "exclusiveMaximum": [ "maximum" ],
        "exclusiveMinimum": [ "minimum" ]
    },
    "default": {}
}`;

  const { Core: Core$5, Schema: Schema$5 } = lib$1;




  // JSON Schema Draft-04
  const schemaVersion$4 = "http://json-schema.org/draft-04/schema";

  Schema$5.setConfig(schemaVersion$4, "baseToken", "id");
  Schema$5.setConfig(schemaVersion$4, "embeddedToken", "id");
  Schema$5.setConfig(schemaVersion$4, "anchorToken", "id");
  Schema$5.setConfig(schemaVersion$4, "jrefToken", "$ref");

  Schema$5.add(JSON.parse(schema$4));
  Core$5.defineVocabulary(schemaVersion$4, {
    "validate": keywords.validate,
    "additionalItems": keywords.additionalItems,
    "additionalProperties": keywords.additionalProperties,
    "allOf": keywords.allOf,
    "anyOf": keywords.anyOf,
    "default": keywords.metaData,
    "definitions": keywords.definitions,
    "dependencies": keywords.dependencies,
    "description": keywords.metaData,
    "enum": keywords.enum,
    "format": keywords.metaData,
    "items": keywords.items,
    "maxItems": keywords.maxItems,
    "maxLength": keywords.maxLength,
    "maxProperties": keywords.maxProperties,
    "maximum": keywords.maximumExclusiveMaximum,
    "minItems": keywords.minItems,
    "minLength": keywords.minLength,
    "minProperties": keywords.minProperties,
    "minimum": keywords.minimumExclusiveMinimum,
    "multipleOf": keywords.multipleOf,
    "not": keywords.not,
    "oneOf": keywords.oneOf,
    "pattern": keywords.pattern,
    "patternProperties": keywords.patternProperties,
    "properties": keywords.properties,
    "required": keywords.required,
    "title": keywords.metaData,
    "type": keywords.type,
    "uniqueItems": keywords.uniqueItems
  });

  var schema$3 = `{
    "$schema": "http://json-schema.org/draft-06/schema#",
    "$id": "http://json-schema.org/draft-06/schema#",
    "title": "Core schema meta-schema",
    "definitions": {
        "schemaArray": {
            "type": "array",
            "minItems": 1,
            "items": { "$ref": "#" }
        },
        "nonNegativeInteger": {
            "type": "integer",
            "minimum": 0
        },
        "nonNegativeIntegerDefault0": {
            "allOf": [
                { "$ref": "#/definitions/nonNegativeInteger" },
                { "default": 0 }
            ]
        },
        "simpleTypes": {
            "enum": [
                "array",
                "boolean",
                "integer",
                "null",
                "number",
                "object",
                "string"
            ]
        },
        "stringArray": {
            "type": "array",
            "items": { "type": "string" },
            "uniqueItems": true,
            "default": []
        }
    },
    "type": ["object", "boolean"],
    "properties": {
        "$id": {
            "type": "string",
            "format": "uri-reference"
        },
        "$schema": {
            "type": "string",
            "format": "uri"
        },
        "$ref": {
            "type": "string",
            "format": "uri-reference"
        },
        "title": {
            "type": "string"
        },
        "description": {
            "type": "string"
        },
        "default": {},
        "examples": {
            "type": "array",
            "items": {}
        },
        "multipleOf": {
            "type": "number",
            "exclusiveMinimum": 0
        },
        "maximum": {
            "type": "number"
        },
        "exclusiveMaximum": {
            "type": "number"
        },
        "minimum": {
            "type": "number"
        },
        "exclusiveMinimum": {
            "type": "number"
        },
        "maxLength": { "$ref": "#/definitions/nonNegativeInteger" },
        "minLength": { "$ref": "#/definitions/nonNegativeIntegerDefault0" },
        "pattern": {
            "type": "string",
            "format": "regex"
        },
        "additionalItems": { "$ref": "#" },
        "items": {
            "anyOf": [
                { "$ref": "#" },
                { "$ref": "#/definitions/schemaArray" }
            ],
            "default": {}
        },
        "maxItems": { "$ref": "#/definitions/nonNegativeInteger" },
        "minItems": { "$ref": "#/definitions/nonNegativeIntegerDefault0" },
        "uniqueItems": {
            "type": "boolean",
            "default": false
        },
        "contains": { "$ref": "#" },
        "maxProperties": { "$ref": "#/definitions/nonNegativeInteger" },
        "minProperties": { "$ref": "#/definitions/nonNegativeIntegerDefault0" },
        "required": { "$ref": "#/definitions/stringArray" },
        "additionalProperties": { "$ref": "#" },
        "definitions": {
            "type": "object",
            "additionalProperties": { "$ref": "#" },
            "default": {}
        },
        "properties": {
            "type": "object",
            "additionalProperties": { "$ref": "#" },
            "default": {}
        },
        "patternProperties": {
            "type": "object",
            "additionalProperties": { "$ref": "#" },
            "default": {}
        },
        "dependencies": {
            "type": "object",
            "additionalProperties": {
                "anyOf": [
                    { "$ref": "#" },
                    { "$ref": "#/definitions/stringArray" }
                ]
            }
        },
        "propertyNames": { "$ref": "#" },
        "const": {},
        "enum": {
            "type": "array",
            "minItems": 1,
            "uniqueItems": true
        },
        "type": {
            "anyOf": [
                { "$ref": "#/definitions/simpleTypes" },
                {
                    "type": "array",
                    "items": { "$ref": "#/definitions/simpleTypes" },
                    "minItems": 1,
                    "uniqueItems": true
                }
            ]
        },
        "format": { "type": "string" },
        "allOf": { "$ref": "#/definitions/schemaArray" },
        "anyOf": { "$ref": "#/definitions/schemaArray" },
        "oneOf": { "$ref": "#/definitions/schemaArray" },
        "not": { "$ref": "#" }
    },
    "default": {}
}`;

  const { Core: Core$4, Schema: Schema$4 } = lib$1;




  const schemaVersion$3 = "http://json-schema.org/draft-06/schema";

  Schema$4.setConfig(schemaVersion$3, "baseToken", "$id");
  Schema$4.setConfig(schemaVersion$3, "embeddedToken", "$id");
  Schema$4.setConfig(schemaVersion$3, "anchorToken", "$id");
  Schema$4.setConfig(schemaVersion$3, "jrefToken", "$ref");

  Schema$4.add(JSON.parse(schema$3));
  Core$4.defineVocabulary(schemaVersion$3, {
    "validate": keywords.validate,
    "additionalItems": keywords.additionalItems6,
    "additionalProperties": keywords.additionalProperties6,
    "allOf": keywords.allOf,
    "anyOf": keywords.anyOf,
    "const": keywords.const,
    "contains": keywords.contains,
    "default": keywords.metaData,
    "definitions": keywords.definitions,
    "dependencies": keywords.dependencies,
    "description": keywords.metaData,
    "enum": keywords.enum,
    "examples": keywords.metaData,
    "exclusiveMaximum": keywords.exclusiveMaximum,
    "exclusiveMinimum": keywords.exclusiveMinimum,
    "format": keywords.metaData,
    "items": keywords.items,
    "maxItems": keywords.maxItems,
    "maxLength": keywords.maxLength6,
    "maxProperties": keywords.maxProperties,
    "maximum": keywords.maximum,
    "minItems": keywords.minItems,
    "minLength": keywords.minLength6,
    "minProperties": keywords.minProperties,
    "minimum": keywords.minimum,
    "multipleOf": keywords.multipleOf,
    "not": keywords.not,
    "oneOf": keywords.oneOf,
    "pattern": keywords.pattern,
    "patternProperties": keywords.patternProperties,
    "properties": keywords.properties,
    "propertyNames": keywords.propertyNames,
    "required": keywords.required,
    "title": keywords.metaData,
    "type": keywords.type,
    "uniqueItems": keywords.uniqueItems
  });

  var schema$2 = `{
    "$schema": "http://json-schema.org/draft-07/schema#",
    "$id": "http://json-schema.org/draft-07/schema#",
    "title": "Core schema meta-schema",
    "definitions": {
        "schemaArray": {
            "type": "array",
            "minItems": 1,
            "items": { "$ref": "#" }
        },
        "nonNegativeInteger": {
            "type": "integer",
            "minimum": 0
        },
        "nonNegativeIntegerDefault0": {
            "allOf": [
                { "$ref": "#/definitions/nonNegativeInteger" },
                { "default": 0 }
            ]
        },
        "simpleTypes": {
            "enum": [
                "array",
                "boolean",
                "integer",
                "null",
                "number",
                "object",
                "string"
            ]
        },
        "stringArray": {
            "type": "array",
            "items": { "type": "string" },
            "uniqueItems": true,
            "default": []
        }
    },
    "type": ["object", "boolean"],
    "properties": {
        "$id": {
            "type": "string",
            "format": "uri-reference"
        },
        "$schema": {
            "type": "string",
            "format": "uri"
        },
        "$ref": {
            "type": "string",
            "format": "uri-reference"
        },
        "$comment": {
            "type": "string"
        },
        "title": {
            "type": "string"
        },
        "description": {
            "type": "string"
        },
        "default": true,
        "readOnly": {
            "type": "boolean",
            "default": false
        },
        "writeOnly": {
            "type": "boolean",
            "default": false
        },
        "examples": {
            "type": "array",
            "items": true
        },
        "multipleOf": {
            "type": "number",
            "exclusiveMinimum": 0
        },
        "maximum": {
            "type": "number"
        },
        "exclusiveMaximum": {
            "type": "number"
        },
        "minimum": {
            "type": "number"
        },
        "exclusiveMinimum": {
            "type": "number"
        },
        "maxLength": { "$ref": "#/definitions/nonNegativeInteger" },
        "minLength": { "$ref": "#/definitions/nonNegativeIntegerDefault0" },
        "pattern": {
            "type": "string",
            "format": "regex"
        },
        "additionalItems": { "$ref": "#" },
        "items": {
            "anyOf": [
                { "$ref": "#" },
                { "$ref": "#/definitions/schemaArray" }
            ],
            "default": true
        },
        "maxItems": { "$ref": "#/definitions/nonNegativeInteger" },
        "minItems": { "$ref": "#/definitions/nonNegativeIntegerDefault0" },
        "uniqueItems": {
            "type": "boolean",
            "default": false
        },
        "contains": { "$ref": "#" },
        "maxProperties": { "$ref": "#/definitions/nonNegativeInteger" },
        "minProperties": { "$ref": "#/definitions/nonNegativeIntegerDefault0" },
        "required": { "$ref": "#/definitions/stringArray" },
        "additionalProperties": { "$ref": "#" },
        "definitions": {
            "type": "object",
            "additionalProperties": { "$ref": "#" },
            "default": {}
        },
        "properties": {
            "type": "object",
            "additionalProperties": { "$ref": "#" },
            "default": {}
        },
        "patternProperties": {
            "type": "object",
            "additionalProperties": { "$ref": "#" },
            "propertyNames": { "format": "regex" },
            "default": {}
        },
        "dependencies": {
            "type": "object",
            "additionalProperties": {
                "anyOf": [
                    { "$ref": "#" },
                    { "$ref": "#/definitions/stringArray" }
                ]
            }
        },
        "propertyNames": { "$ref": "#" },
        "const": true,
        "enum": {
            "type": "array",
            "items": true,
            "minItems": 1,
            "uniqueItems": true
        },
        "type": {
            "anyOf": [
                { "$ref": "#/definitions/simpleTypes" },
                {
                    "type": "array",
                    "items": { "$ref": "#/definitions/simpleTypes" },
                    "minItems": 1,
                    "uniqueItems": true
                }
            ]
        },
        "format": { "type": "string" },
        "contentMediaType": { "type": "string" },
        "contentEncoding": { "type": "string" },
        "if": { "$ref": "#" },
        "then": { "$ref": "#" },
        "else": { "$ref": "#" },
        "allOf": { "$ref": "#/definitions/schemaArray" },
        "anyOf": { "$ref": "#/definitions/schemaArray" },
        "oneOf": { "$ref": "#/definitions/schemaArray" },
        "not": { "$ref": "#" }
    },
    "default": true
}`;

  const { Core: Core$3, Schema: Schema$3 } = lib$1;




  const schemaVersion$2 = "http://json-schema.org/draft-07/schema";

  Schema$3.setConfig(schemaVersion$2, "baseToken", "$id");
  Schema$3.setConfig(schemaVersion$2, "embeddedToken", "$id");
  Schema$3.setConfig(schemaVersion$2, "anchorToken", "$id");
  Schema$3.setConfig(schemaVersion$2, "jrefToken", "$ref");

  Schema$3.add(JSON.parse(schema$2));
  Core$3.defineVocabulary(schemaVersion$2, {
    "validate": keywords.validate,
    "additionalItems": keywords.additionalItems6,
    "additionalProperties": keywords.additionalProperties6,
    "allOf": keywords.allOf,
    "anyOf": keywords.anyOf,
    "const": keywords.const,
    "contains": keywords.contains,
    "default": keywords.metaData,
    "definitions": keywords.definitions,
    "dependencies": keywords.dependencies,
    "description": keywords.metaData,
    "enum": keywords.enum,
    "exclusiveMaximum": keywords.exclusiveMaximum,
    "exclusiveMinimum": keywords.exclusiveMinimum,
    "format": keywords.metaData,
    "if": keywords.if,
    "then": keywords.then,
    "else": keywords.else,
    "items": keywords.items,
    "maxItems": keywords.maxItems,
    "maxLength": keywords.maxLength6,
    "maxProperties": keywords.maxProperties,
    "maximum": keywords.maximum,
    "minItems": keywords.minItems,
    "minLength": keywords.minLength6,
    "minProperties": keywords.minProperties,
    "minimum": keywords.minimum,
    "multipleOf": keywords.multipleOf,
    "not": keywords.not,
    "oneOf": keywords.oneOf,
    "pattern": keywords.pattern,
    "patternProperties": keywords.patternProperties,
    "properties": keywords.properties,
    "propertyNames": keywords.propertyNames,
    "readOnly": keywords.metaData,
    "required": keywords.required,
    "title": keywords.metaData,
    "type": keywords.type,
    "uniqueItems": keywords.uniqueItems,
    "writeOnly": keywords.metaData
  });

  var schema$1 = `{
    "$schema": "https://json-schema.org/draft/2019-09/schema",
    "$id": "https://json-schema.org/draft/2019-09/schema",
    "$vocabulary": {
        "https://json-schema.org/draft/2019-09/vocab/core": true,
        "https://json-schema.org/draft/2019-09/vocab/applicator": true,
        "https://json-schema.org/draft/2019-09/vocab/validation": true,
        "https://json-schema.org/draft/2019-09/vocab/meta-data": true,
        "https://json-schema.org/draft/2019-09/vocab/format": false,
        "https://json-schema.org/draft/2019-09/vocab/content": true
    },
    "$recursiveAnchor": true,

    "title": "Core and Validation specifications meta-schema",
    "allOf": [
        {"$ref": "meta/core"},
        {"$ref": "meta/applicator"},
        {"$ref": "meta/validation"},
        {"$ref": "meta/meta-data"},
        {"$ref": "meta/format"},
        {"$ref": "meta/content"}
    ],
    "type": ["object", "boolean"],
    "properties": {
        "definitions": {
            "$comment": "While no longer an official keyword as it is replaced by $defs, this keyword is retained in the meta-schema to prevent incompatible extensions as it remains in common use.",
            "type": "object",
            "additionalProperties": { "$recursiveRef": "#" },
            "default": {}
        },
        "dependencies": {
            "$comment": "\\"dependencies\\" is no longer a keyword, but schema authors should avoid redefining it to facilitate a smooth transition to \\"dependentSchemas\\" and \\"dependentRequired\\"",
            "type": "object",
            "additionalProperties": {
                "anyOf": [
                    { "$recursiveRef": "#" },
                    { "$ref": "meta/validation#/$defs/stringArray" }
                ]
            }
        }
    }
}`;

  var core$1 = `{
    "$id": "https://json-schema.org/draft/2019-09/meta/core",
    "$schema": "https://json-schema.org/draft/2019-09/schema",
    "$vocabulary": {
      "https://json-schema.org/draft/2019-09/vocab/core": true
    },
    "$recursiveAnchor": true,

    "title": "Core vocabulary meta-schema",
    "type": ["object", "boolean"],
    "properties": {
        "$id": {
            "type": "string",
            "format": "uri-reference",
            "$comment": "Non-empty fragments not allowed.",
            "pattern": "^[^#]*#?$"
        },
        "$schema": {
            "type": "string",
            "format": "uri"
        },
        "$anchor": {
            "type": "string",
            "pattern": "^[A-Za-z][-A-Za-z0-9.:_]*$"
        },
        "$ref": {
            "type": "string",
            "format": "uri-reference"
        },
        "$recursiveRef": {
            "type": "string",
            "format": "uri-reference"
        },
        "$recursiveAnchor": {
            "type": "boolean",
            "default": false
        },
        "$vocabulary": {
            "type": "object",
            "propertyNames": {
                "type": "string",
                "format": "uri"
            },
            "additionalProperties": {
                "type": "boolean"
            }
        },
        "$comment": {
            "type": "string"
        },
        "$defs": {
            "type": "object",
            "additionalProperties": { "$recursiveRef": "#" },
            "default": {}
        }
    }
}`;

  var applicator$1 = `{
    "$id": "https://json-schema.org/draft/2019-09/meta/applicator",
    "$schema": "https://json-schema.org/draft/2019-09/schema",
    "$vocabulary": {
        "https://json-schema.org/draft/2019-09/vocab/applicator": true
    },
    "$recursiveAnchor": true,

    "title": "Applicator vocabulary meta-schema",
    "properties": {
        "additionalItems": { "$recursiveRef": "#" },
        "unevaluatedItems": { "$recursiveRef": "#" },
        "items": {
            "anyOf": [
                { "$recursiveRef": "#" },
                { "$ref": "#/$defs/schemaArray" }
            ]
        },
        "contains": { "$recursiveRef": "#" },
        "additionalProperties": { "$recursiveRef": "#" },
        "unevaluatedProperties": { "$recursiveRef": "#" },
        "properties": {
            "type": "object",
            "additionalProperties": { "$recursiveRef": "#" },
            "default": {}
        },
        "patternProperties": {
            "type": "object",
            "additionalProperties": { "$recursiveRef": "#" },
            "propertyNames": { "format": "regex" },
            "default": {}
        },
        "dependentSchemas": {
            "type": "object",
            "additionalProperties": {
                "$recursiveRef": "#"
            }
        },
        "propertyNames": { "$recursiveRef": "#" },
        "if": { "$recursiveRef": "#" },
        "then": { "$recursiveRef": "#" },
        "else": { "$recursiveRef": "#" },
        "allOf": { "$ref": "#/$defs/schemaArray" },
        "anyOf": { "$ref": "#/$defs/schemaArray" },
        "oneOf": { "$ref": "#/$defs/schemaArray" },
        "not": { "$recursiveRef": "#" }
    },
    "$defs": {
        "schemaArray": {
            "type": "array",
            "minItems": 1,
            "items": { "$recursiveRef": "#" }
        }
    }
}`;

  var validation$1 = `{
    "$id": "https://json-schema.org/draft/2019-09/meta/validation",
    "$schema": "https://json-schema.org/draft/2019-09/schema",
    "$vocabulary": {
      "https://json-schema.org/draft/2019-09/vocab/validation": true
    },
    "$recursiveAnchor": true,

    "title": "Validation vocabulary meta-schema",
    "type": ["object", "boolean"],
    "properties": {
        "multipleOf": {
            "type": "number",
            "exclusiveMinimum": 0
        },
        "maximum": {
            "type": "number"
        },
        "exclusiveMaximum": {
            "type": "number"
        },
        "minimum": {
            "type": "number"
        },
        "exclusiveMinimum": {
            "type": "number"
        },
        "maxLength": { "$ref": "#/$defs/nonNegativeInteger" },
        "minLength": { "$ref": "#/$defs/nonNegativeIntegerDefault0" },
        "pattern": {
            "type": "string",
            "format": "regex"
        },
        "maxItems": { "$ref": "#/$defs/nonNegativeInteger" },
        "minItems": { "$ref": "#/$defs/nonNegativeIntegerDefault0" },
        "uniqueItems": {
            "type": "boolean",
            "default": false
        },
        "maxContains": { "$ref": "#/$defs/nonNegativeInteger" },
        "minContains": {
            "$ref": "#/$defs/nonNegativeInteger",
            "default": 1
        },
        "maxProperties": { "$ref": "#/$defs/nonNegativeInteger" },
        "minProperties": { "$ref": "#/$defs/nonNegativeIntegerDefault0" },
        "required": { "$ref": "#/$defs/stringArray" },
        "dependentRequired": {
            "type": "object",
            "additionalProperties": {
                "$ref": "#/$defs/stringArray"
            }
        },
        "const": true,
        "enum": {
            "type": "array",
            "items": true
        },
        "type": {
            "anyOf": [
                { "$ref": "#/$defs/simpleTypes" },
                {
                    "type": "array",
                    "items": { "$ref": "#/$defs/simpleTypes" },
                    "minItems": 1,
                    "uniqueItems": true
                }
            ]
        }
    },
    "$defs": {
        "nonNegativeInteger": {
            "type": "integer",
            "minimum": 0
        },
        "nonNegativeIntegerDefault0": {
            "$ref": "#/$defs/nonNegativeInteger",
            "default": 0
        },
        "simpleTypes": {
            "enum": [
                "array",
                "boolean",
                "integer",
                "null",
                "number",
                "object",
                "string"
            ]
        },
        "stringArray": {
            "type": "array",
            "items": { "type": "string" },
            "uniqueItems": true,
            "default": []
        }
    }
}`;

  var metaData$1 = `{
    "$id": "https://json-schema.org/draft/2019-09/meta/meta-data",
    "$schema": "https://json-schema.org/draft/2019-09/schema",
    "$vocabulary": {
      "https://json-schema.org/draft/2019-09/vocab/meta-data": true
    },
    "$recursiveAnchor": true,

    "title": "Meta-data vocabulary meta-schema",

    "type": ["object", "boolean"],
    "properties": {
        "title": {
            "type": "string"
        },
        "description": {
            "type": "string"
        },
        "default": true,
        "deprecated": {
            "type": "boolean",
            "default": false
        },
        "readOnly": {
            "type": "boolean",
            "default": false
        },
        "writeOnly": {
            "type": "boolean",
            "default": false
        },
        "examples": {
            "type": "array",
            "items": true
        }
    }
}`;

  var format = `{
    "$id": "https://json-schema.org/draft/2019-09/meta/format",
    "$schema": "https://json-schema.org/draft/2019-09/schema",
    "$vocabulary": {
      "https://json-schema.org/draft/2019-09/vocab/format": true
    },
    "$recursiveAnchor": true,

    "title": "Format vocabulary meta-schema",
    "type": ["object", "boolean"],
    "properties": {
        "format": { "type": "string" }
    }
}`;

  var content$1 = `{
    "$id": "https://json-schema.org/draft/2019-09/meta/content",
    "$schema": "https://json-schema.org/draft/2019-09/schema",
    "$vocabulary": {
      "https://json-schema.org/draft/2019-09/vocab/content": true
    },
    "$recursiveAnchor": true,

    "title": "Content vocabulary meta-schema",

    "type": ["object", "boolean"],
    "properties": {
        "contentMediaType": { "type": "string" },
        "contentEncoding": { "type": "string" },
        "contentSchema": { "$recursiveRef": "#" }
    }
}`;

  const { Core: Core$2, Schema: Schema$2 } = lib$1;










  const schemaVersion$1 = "https://json-schema.org/draft/2019-09/schema";

  Schema$2.setConfig(schemaVersion$1, "baseToken", "$id");
  Schema$2.setConfig(schemaVersion$1, "embeddedToken", "$id");
  Schema$2.setConfig(schemaVersion$1, "anchorToken", "$anchor");
  Schema$2.setConfig(schemaVersion$1, "recursiveAnchorToken", "$recursiveAnchor");
  Schema$2.setConfig(schemaVersion$1, "vocabularyToken", "$vocabulary");
  Schema$2.setConfig(schemaVersion$1, "mandatoryVocabularies", ["https://json-schema.org/draft/2019-09/vocab/core"]);

  Schema$2.add(JSON.parse(schema$1));

  Schema$2.add(JSON.parse(core$1));
  Core$2.defineVocabulary("https://json-schema.org/draft/2019-09/vocab/core", {
    "validate": keywords.validate,
    "$defs": keywords.definitions,
    "$recursiveRef": keywords.dynamicRef,
    "$ref": keywords.ref
  });

  Schema$2.add(JSON.parse(applicator$1));
  Core$2.defineVocabulary("https://json-schema.org/draft/2019-09/vocab/applicator", {
    "additionalItems": keywords.additionalItems6,
    "additionalProperties": keywords.additionalProperties6,
    "allOf": keywords.allOf,
    "anyOf": keywords.anyOf,
    "contains": keywords.containsMinContainsMaxContains,
    "dependentSchemas": keywords.dependentSchemas,
    "if": keywords.if,
    "then": keywords.then,
    "else": keywords.else,
    "items": keywords.items,
    "not": keywords.not,
    "oneOf": keywords.oneOf,
    "patternProperties": keywords.patternProperties,
    "properties": keywords.properties,
    "propertyNames": keywords.propertyNames,
    "unevaluatedItems": keywords.unevaluatedItems,
    "unevaluatedProperties": keywords.unevaluatedProperties
  });

  Schema$2.add(JSON.parse(validation$1));
  Core$2.defineVocabulary("https://json-schema.org/draft/2019-09/vocab/validation", {
    "const": keywords.const,
    "dependentRequired": keywords.dependentRequired,
    "enum": keywords.enum,
    "exclusiveMaximum": keywords.exclusiveMaximum,
    "exclusiveMinimum": keywords.exclusiveMinimum,
    "maxItems": keywords.maxItems,
    "maxLength": keywords.maxLength6,
    "maxProperties": keywords.maxProperties,
    "maximum": keywords.maximum,
    "minItems": keywords.minItems,
    "minLength": keywords.minLength6,
    "minProperties": keywords.minProperties,
    "minimum": keywords.minimum,
    "multipleOf": keywords.multipleOf,
    "pattern": keywords.pattern,
    "required": keywords.required,
    "type": keywords.type,
    "uniqueItems": keywords.uniqueItems
  });

  Schema$2.add(JSON.parse(metaData$1));
  Core$2.defineVocabulary("https://json-schema.org/draft/2019-09/vocab/meta-data", {
    "default": keywords.metaData,
    "deprecated": keywords.metaData,
    "description": keywords.metaData,
    "examples": keywords.metaData,
    "readOnly": keywords.metaData,
    "title": keywords.metaData,
    "writeOnly": keywords.metaData
  });

  Schema$2.add(JSON.parse(format));

  Schema$2.add(JSON.parse(content$1));
  Core$2.defineVocabulary("https://json-schema.org/draft/2019-09/vocab/content", {
    "contentEncoding": keywords.metaData,
    "contentMediaType": keywords.metaData,
    "contentSchema": keywords.metaData
  });

  var schema = `{
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://json-schema.org/draft/2020-12/schema",
    "$vocabulary": {
        "https://json-schema.org/draft/2020-12/vocab/core": true,
        "https://json-schema.org/draft/2020-12/vocab/applicator": true,
        "https://json-schema.org/draft/2020-12/vocab/unevaluated": true,
        "https://json-schema.org/draft/2020-12/vocab/validation": true,
        "https://json-schema.org/draft/2020-12/vocab/meta-data": true,
        "https://json-schema.org/draft/2020-12/vocab/format-annotation": true,
        "https://json-schema.org/draft/2020-12/vocab/content": true
    },
    "$dynamicAnchor": "meta",

    "title": "Core and Validation specifications meta-schema",
    "allOf": [
        {"$ref": "meta/core"},
        {"$ref": "meta/applicator"},
        {"$ref": "meta/unevaluated"},
        {"$ref": "meta/validation"},
        {"$ref": "meta/meta-data"},
        {"$ref": "meta/format-annotation"},
        {"$ref": "meta/content"}
    ],
    "type": ["object", "boolean"],
    "properties": {
        "definitions": {
            "$comment": "While no longer an official keyword as it is replaced by $defs, this keyword is retained in the meta-schema to prevent incompatible extensions as it remains in common use.",
            "type": "object",
            "additionalProperties": { "$dynamicRef": "#meta" },
            "default": {}
        },
        "dependencies": {
            "$comment": "\\"dependencies\\" is no longer a keyword, but schema authors should avoid redefining it to facilitate a smooth transition to \\"dependentSchemas\\" and \\"dependentRequired\\"",
            "type": "object",
            "additionalProperties": {
                "anyOf": [
                    { "$dynamicRef": "#meta" },
                    { "$ref": "meta/validation#/$defs/stringArray" }
                ]
            }
        }
    }
}`;

  var core = `{
    "$id": "https://json-schema.org/draft/2020-12/meta/core",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$vocabulary": {
        "https://json-schema.org/draft/2020-12/vocab/core": true
    },
    "$dynamicAnchor": "meta",

    "title": "Core vocabulary meta-schema",
    "type": ["object", "boolean"],
    "properties": {
        "$id": {
            "type": "string",
            "format": "uri-reference",
            "$comment": "Non-empty fragments not allowed.",
            "pattern": "^[^#]*#?$"
        },
        "$schema": {
            "type": "string",
            "format": "uri"
        },
        "$anchor": {
            "type": "string",
            "pattern": "^[A-Za-z_][-A-Za-z0-9._]*$"
        },
        "$ref": {
            "type": "string",
            "format": "uri-reference"
        },
        "$dynamicRef": {
            "type": "string",
            "format": "uri-reference"
        },
        "$dynamicAnchor": {
            "type": "string",
            "pattern": "^[A-Za-z_][-A-Za-z0-9._]*$"
        },
        "$vocabulary": {
            "type": "object",
            "propertyNames": {
                "type": "string",
                "format": "uri"
            },
            "additionalProperties": {
                "type": "boolean"
            }
        },
        "$comment": {
            "type": "string"
        },
        "$defs": {
            "type": "object",
            "additionalProperties": { "$dynamicRef": "#meta" },
            "default": {}
        }
    }
}`;

  var applicator = `{
    "$id": "https://json-schema.org/draft/2020-12/meta/applicator",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$vocabulary": {
        "https://json-schema.org/draft/2020-12/vocab/applicator": true
    },
    "$dynamicAnchor": "meta",

    "title": "Applicator vocabulary meta-schema",
    "type": ["object", "boolean"],
    "properties": {
        "prefixItems": { "$ref": "#/$defs/schemaArray" },
        "items": { "$dynamicRef": "#meta" },
        "contains": { "$dynamicRef": "#meta" },
        "additionalProperties": { "$dynamicRef": "#meta" },
        "properties": {
            "type": "object",
            "additionalProperties": { "$dynamicRef": "#meta" },
            "default": {}
        },
        "patternProperties": {
            "type": "object",
            "additionalProperties": { "$dynamicRef": "#meta" },
            "propertyNames": { "format": "regex" },
            "default": {}
        },
        "dependentSchemas": {
            "type": "object",
            "additionalProperties": {
                "$dynamicRef": "#meta"
            }
        },
        "propertyNames": { "$dynamicRef": "#meta" },
        "if": { "$dynamicRef": "#meta" },
        "then": { "$dynamicRef": "#meta" },
        "else": { "$dynamicRef": "#meta" },
        "allOf": { "$ref": "#/$defs/schemaArray" },
        "anyOf": { "$ref": "#/$defs/schemaArray" },
        "oneOf": { "$ref": "#/$defs/schemaArray" },
        "not": { "$dynamicRef": "#meta" }
    },
    "$defs": {
        "schemaArray": {
            "type": "array",
            "minItems": 1,
            "items": { "$dynamicRef": "#meta" }
        }
    }
}`;

  var validation = `{
    "$id": "https://json-schema.org/draft/2020-12/meta/validation",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$vocabulary": {
        "https://json-schema.org/draft/2020-12/vocab/validation": true
    },
    "$dynamicAnchor": "meta",

    "title": "Validation vocabulary meta-schema",
    "type": ["object", "boolean"],
    "properties": {
        "multipleOf": {
            "type": "number",
            "exclusiveMinimum": 0
        },
        "maximum": {
            "type": "number"
        },
        "exclusiveMaximum": {
            "type": "number"
        },
        "minimum": {
            "type": "number"
        },
        "exclusiveMinimum": {
            "type": "number"
        },
        "maxLength": { "$ref": "#/$defs/nonNegativeInteger" },
        "minLength": { "$ref": "#/$defs/nonNegativeIntegerDefault0" },
        "pattern": {
            "type": "string",
            "format": "regex"
        },
        "maxItems": { "$ref": "#/$defs/nonNegativeInteger" },
        "minItems": { "$ref": "#/$defs/nonNegativeIntegerDefault0" },
        "uniqueItems": {
            "type": "boolean",
            "default": false
        },
        "maxContains": { "$ref": "#/$defs/nonNegativeInteger" },
        "minContains": {
            "$ref": "#/$defs/nonNegativeInteger",
            "default": 1
        },
        "maxProperties": { "$ref": "#/$defs/nonNegativeInteger" },
        "minProperties": { "$ref": "#/$defs/nonNegativeIntegerDefault0" },
        "required": { "$ref": "#/$defs/stringArray" },
        "dependentRequired": {
            "type": "object",
            "additionalProperties": {
                "$ref": "#/$defs/stringArray"
            }
        },
        "const": true,
        "enum": {
            "type": "array",
            "items": true
        },
        "type": {
            "anyOf": [
                { "$ref": "#/$defs/simpleTypes" },
                {
                    "type": "array",
                    "items": { "$ref": "#/$defs/simpleTypes" },
                    "minItems": 1,
                    "uniqueItems": true
                }
            ]
        }
    },
    "$defs": {
        "nonNegativeInteger": {
            "type": "integer",
            "minimum": 0
        },
        "nonNegativeIntegerDefault0": {
            "$ref": "#/$defs/nonNegativeInteger",
            "default": 0
        },
        "simpleTypes": {
            "enum": [
                "array",
                "boolean",
                "integer",
                "null",
                "number",
                "object",
                "string"
            ]
        },
        "stringArray": {
            "type": "array",
            "items": { "type": "string" },
            "uniqueItems": true,
            "default": []
        }
    }
}`;

  var metaData = `{
    "$id": "https://json-schema.org/draft/2020-12/meta/meta-data",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$vocabulary": {
        "https://json-schema.org/draft/2020-12/vocab/meta-data": true
    },
    "$dynamicAnchor": "meta",

    "title": "Meta-data vocabulary meta-schema",

    "type": ["object", "boolean"],
    "properties": {
        "title": {
            "type": "string"
        },
        "description": {
            "type": "string"
        },
        "default": true,
        "deprecated": {
            "type": "boolean",
            "default": false
        },
        "readOnly": {
            "type": "boolean",
            "default": false
        },
        "writeOnly": {
            "type": "boolean",
            "default": false
        },
        "examples": {
            "type": "array",
            "items": true
        }
    }
}`;

  var formatAnnotation = `{
    "$id": "https://json-schema.org/draft/2020-12/meta/format-annotation",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$vocabulary": {
        "https://json-schema.org/draft/2020-12/vocab/format-annotation": true
    },
    "$dynamicAnchor": "meta",

    "title": "Format vocabulary meta-schema for annotation results",
    "type": ["object", "boolean"],
    "properties": {
        "format": { "type": "string" }
    }
}`;

  var formatAssertion = `{
    "$id": "https://json-schema.org/draft/2020-12/meta/format-assertion",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$vocabulary": {
        "https://json-schema.org/draft/2020-12/vocab/format-assertion": true
    },
    "$dynamicAnchor": "meta",

    "title": "Format vocabulary meta-schema for assertion results",
    "type": ["object", "boolean"],
    "properties": {
        "format": { "type": "string" }
    }
}`;

  var content = `{
    "$id": "https://json-schema.org/draft/2020-12/meta/content",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$vocabulary": {
        "https://json-schema.org/draft/2020-12/vocab/content": true
    },
    "$dynamicAnchor": "meta",

    "title": "Content vocabulary meta-schema",

    "type": ["object", "boolean"],
    "properties": {
        "contentMediaType": { "type": "string" },
        "contentEncoding": { "type": "string" },
        "contentSchema": { "$dynamicRef": "#meta" }
    }
}`;

  var unevaluated = `{
    "$id": "https://json-schema.org/draft/2020-12/meta/unevaluated",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$vocabulary": {
        "https://json-schema.org/draft/2020-12/vocab/unevaluated": true
    },
    "$dynamicAnchor": "meta",

    "title": "Unevaluated applicator vocabulary meta-schema",
    "type": ["object", "boolean"],
    "properties": {
        "unevaluatedItems": { "$dynamicRef": "#meta" },
        "unevaluatedProperties": { "$dynamicRef": "#meta" }
    }
}`;

  const { Core: Core$1, Schema: Schema$1 } = lib$1;












  const schemaVersion = "https://json-schema.org/draft/2020-12/schema";

  Schema$1.setConfig(schemaVersion, "baseToken", "$id");
  Schema$1.setConfig(schemaVersion, "embeddedToken", "$id");
  Schema$1.setConfig(schemaVersion, "anchorToken", "$anchor");
  Schema$1.setConfig(schemaVersion, "dynamicAnchorToken", "$dynamicAnchor");
  Schema$1.setConfig(schemaVersion, "vocabularyToken", "$vocabulary");
  Schema$1.setConfig(schemaVersion, "mandatoryVocabularies", ["https://json-schema.org/draft/2020-12/vocab/core"]);

  Schema$1.add(JSON.parse(schema));

  Schema$1.add(JSON.parse(core));
  Core$1.defineVocabulary("https://json-schema.org/draft/2020-12/vocab/core", {
    "validate": keywords.validate,
    "$defs": keywords.definitions,
    "$dynamicRef": keywords.dynamicRef,
    "$ref": keywords.ref
  });

  Schema$1.add(JSON.parse(applicator));
  Core$1.defineVocabulary("https://json-schema.org/draft/2020-12/vocab/applicator", {
    "additionalProperties": keywords.additionalProperties6,
    "allOf": keywords.allOf,
    "anyOf": keywords.anyOf,
    "contains": keywords.containsMinContainsMaxContains,
    "dependentSchemas": keywords.dependentSchemas,
    "if": keywords.if,
    "then": keywords.then,
    "else": keywords.else,
    "items": keywords.items202012,
    "not": keywords.not,
    "oneOf": keywords.oneOf,
    "patternProperties": keywords.patternProperties,
    "prefixItems": keywords.tupleItems,
    "properties": keywords.properties,
    "propertyNames": keywords.propertyNames
  });

  Schema$1.add(JSON.parse(validation));
  Core$1.defineVocabulary("https://json-schema.org/draft/2020-12/vocab/validation", {
    "const": keywords.const,
    "dependentRequired": keywords.dependentRequired,
    "enum": keywords.enum,
    "exclusiveMaximum": keywords.exclusiveMaximum,
    "exclusiveMinimum": keywords.exclusiveMinimum,
    "maxItems": keywords.maxItems,
    "maxLength": keywords.maxLength6,
    "maxProperties": keywords.maxProperties,
    "maximum": keywords.maximum,
    "minItems": keywords.minItems,
    "minLength": keywords.minLength6,
    "minProperties": keywords.minProperties,
    "minimum": keywords.minimum,
    "multipleOf": keywords.multipleOf,
    "pattern": keywords.pattern,
    "required": keywords.required,
    "type": keywords.type,
    "uniqueItems": keywords.uniqueItems
  });

  Schema$1.add(JSON.parse(metaData));
  Core$1.defineVocabulary("https://json-schema.org/draft/2020-12/vocab/meta-data", {
    "default": keywords.metaData,
    "deprecated": keywords.metaData,
    "description": keywords.metaData,
    "examples": keywords.metaData,
    "readOnly": keywords.metaData,
    "title": keywords.metaData,
    "writeOnly": keywords.metaData
  });

  Schema$1.add(JSON.parse(formatAnnotation));
  Core$1.defineVocabulary("https://json-schema.org/draft/2020-12/vocab/format-annotation", {
    "format": keywords.metaData
  });

  Schema$1.add(JSON.parse(formatAssertion));

  Schema$1.add(JSON.parse(content));
  Core$1.defineVocabulary("https://json-schema.org/draft/2020-12/vocab/content", {
    "contentEncoding": keywords.metaData,
    "contentMediaType": keywords.metaData,
    "contentSchema": keywords.metaData
  });

  Schema$1.add(JSON.parse(unevaluated));
  Core$1.defineVocabulary("https://json-schema.org/draft/2020-12/vocab/unevaluated", {
    "unevaluatedItems": keywords.unevaluatedItems,
    "unevaluatedProperties": keywords.unevaluatedProperties
  });

  const { Core, Schema, InvalidSchemaError } = lib$1;









  var lib = {
    add: Core.add,
    get: Schema.get,
    validate: Core.validate,
    compile: Core.compile,
    interpret: Core.interpret,
    setMetaOutputFormat: Core.setMetaOutputFormat,
    setShouldMetaValidate: Core.setShouldMetaValidate,
    FLAG: Core.FLAG,
    BASIC: Core.BASIC,
    DETAILED: Core.DETAILED,
    VERBOSE: Core.VERBOSE,
    Keywords: keywords,
    InvalidSchemaError: InvalidSchemaError
  };
  var lib_1 = lib.add;
  var lib_2 = lib.get;
  var lib_3 = lib.validate;
  var lib_4 = lib.compile;
  var lib_5 = lib.interpret;
  var lib_6 = lib.setMetaOutputFormat;
  var lib_7 = lib.setShouldMetaValidate;
  var lib_8 = lib.FLAG;
  var lib_9 = lib.BASIC;
  var lib_10 = lib.DETAILED;
  var lib_11 = lib.VERBOSE;
  var lib_12 = lib.Keywords;
  var lib_13 = lib.InvalidSchemaError;

  exports.BASIC = lib_9;
  exports.DETAILED = lib_10;
  exports.FLAG = lib_8;
  exports.InvalidSchemaError = lib_13;
  exports.Keywords = lib_12;
  exports.VERBOSE = lib_11;
  exports.add = lib_1;
  exports.compile = lib_4;
  exports["default"] = lib;
  exports.get = lib_2;
  exports.interpret = lib_5;
  exports.setMetaOutputFormat = lib_6;
  exports.setShouldMetaValidate = lib_7;
  exports.validate = lib_3;

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;

})({});
//# sourceMappingURL=json-schema-iife.js.map
