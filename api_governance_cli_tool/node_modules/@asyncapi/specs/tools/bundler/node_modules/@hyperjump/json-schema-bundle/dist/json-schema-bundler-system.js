System.register('JSB', [], (function (exports) {
	'use strict';
	return {
		execute: (function () {

			var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

			function getAugmentedNamespace(n) {
				if (n.__esModule) return n;
				var a = Object.defineProperty({}, '__esModule', {value: true});
				Object.keys(n).forEach(function (k) {
					var d = Object.getOwnPropertyDescriptor(n, k);
					Object.defineProperty(a, k, d.get ? d : {
						enumerable: true,
						get: function () {
							return n[k];
						}
					});
				});
				return a;
			}

			// Unique ID creation requires a high quality random # generator. In the browser we therefore
			// require the crypto API and do not support built-in fallback to lower quality random number
			// generators (like Math.random()).
			var getRandomValues;
			var rnds8 = new Uint8Array(16);
			function rng() {
			  // lazy load so that environments that need to polyfill have a chance to do so
			  if (!getRandomValues) {
			    // getRandomValues needs to be invoked in a context where "this" is a Crypto implementation. Also,
			    // find the complete implementation of crypto (msCrypto) on IE11.
			    getRandomValues = typeof crypto !== 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto) || typeof msCrypto !== 'undefined' && typeof msCrypto.getRandomValues === 'function' && msCrypto.getRandomValues.bind(msCrypto);

			    if (!getRandomValues) {
			      throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');
			    }
			  }

			  return getRandomValues(rnds8);
			}

			var REGEX = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;

			function validate$4(uuid) {
			  return typeof uuid === 'string' && REGEX.test(uuid);
			}

			/**
			 * Convert array of 16 byte values to UUID string format of the form:
			 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
			 */

			var byteToHex = [];

			for (var i = 0; i < 256; ++i) {
			  byteToHex.push((i + 0x100).toString(16).substr(1));
			}

			function stringify$1(arr) {
			  var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
			  // Note: Be careful editing this code!  It's been tuned for performance
			  // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
			  var uuid = (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase(); // Consistency check for valid UUID.  If this throws, it's likely due to one
			  // of the following:
			  // - One or more input array values don't map to a hex octet (leading to
			  // "undefined" in the uuid)
			  // - Invalid input values for the RFC `version` or `variant` fields

			  if (!validate$4(uuid)) {
			    throw TypeError('Stringified UUID is invalid');
			  }

			  return uuid;
			}

			//
			// Inspired by https://github.com/LiosK/UUID.js
			// and http://docs.python.org/library/uuid.html

			var _nodeId;

			var _clockseq; // Previous uuid creation time


			var _lastMSecs = 0;
			var _lastNSecs = 0; // See https://github.com/uuidjs/uuid for API details

			function v1(options, buf, offset) {
			  var i = buf && offset || 0;
			  var b = buf || new Array(16);
			  options = options || {};
			  var node = options.node || _nodeId;
			  var clockseq = options.clockseq !== undefined ? options.clockseq : _clockseq; // node and clockseq need to be initialized to random values if they're not
			  // specified.  We do this lazily to minimize issues related to insufficient
			  // system entropy.  See #189

			  if (node == null || clockseq == null) {
			    var seedBytes = options.random || (options.rng || rng)();

			    if (node == null) {
			      // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
			      node = _nodeId = [seedBytes[0] | 0x01, seedBytes[1], seedBytes[2], seedBytes[3], seedBytes[4], seedBytes[5]];
			    }

			    if (clockseq == null) {
			      // Per 4.2.2, randomize (14 bit) clockseq
			      clockseq = _clockseq = (seedBytes[6] << 8 | seedBytes[7]) & 0x3fff;
			    }
			  } // UUID timestamps are 100 nano-second units since the Gregorian epoch,
			  // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
			  // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
			  // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.


			  var msecs = options.msecs !== undefined ? options.msecs : Date.now(); // Per 4.2.1.2, use count of uuid's generated during the current clock
			  // cycle to simulate higher resolution clock

			  var nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1; // Time since last uuid creation (in msecs)

			  var dt = msecs - _lastMSecs + (nsecs - _lastNSecs) / 10000; // Per 4.2.1.2, Bump clockseq on clock regression

			  if (dt < 0 && options.clockseq === undefined) {
			    clockseq = clockseq + 1 & 0x3fff;
			  } // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
			  // time interval


			  if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
			    nsecs = 0;
			  } // Per 4.2.1.2 Throw error if too many uuids are requested


			  if (nsecs >= 10000) {
			    throw new Error("uuid.v1(): Can't create more than 10M uuids/sec");
			  }

			  _lastMSecs = msecs;
			  _lastNSecs = nsecs;
			  _clockseq = clockseq; // Per 4.1.4 - Convert from unix epoch to Gregorian epoch

			  msecs += 12219292800000; // `time_low`

			  var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
			  b[i++] = tl >>> 24 & 0xff;
			  b[i++] = tl >>> 16 & 0xff;
			  b[i++] = tl >>> 8 & 0xff;
			  b[i++] = tl & 0xff; // `time_mid`

			  var tmh = msecs / 0x100000000 * 10000 & 0xfffffff;
			  b[i++] = tmh >>> 8 & 0xff;
			  b[i++] = tmh & 0xff; // `time_high_and_version`

			  b[i++] = tmh >>> 24 & 0xf | 0x10; // include version

			  b[i++] = tmh >>> 16 & 0xff; // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)

			  b[i++] = clockseq >>> 8 | 0x80; // `clock_seq_low`

			  b[i++] = clockseq & 0xff; // `node`

			  for (var n = 0; n < 6; ++n) {
			    b[i + n] = node[n];
			  }

			  return buf || stringify$1(b);
			}

			function parse$1(uuid) {
			  if (!validate$4(uuid)) {
			    throw TypeError('Invalid UUID');
			  }

			  var v;
			  var arr = new Uint8Array(16); // Parse ########-....-....-....-............

			  arr[0] = (v = parseInt(uuid.slice(0, 8), 16)) >>> 24;
			  arr[1] = v >>> 16 & 0xff;
			  arr[2] = v >>> 8 & 0xff;
			  arr[3] = v & 0xff; // Parse ........-####-....-....-............

			  arr[4] = (v = parseInt(uuid.slice(9, 13), 16)) >>> 8;
			  arr[5] = v & 0xff; // Parse ........-....-####-....-............

			  arr[6] = (v = parseInt(uuid.slice(14, 18), 16)) >>> 8;
			  arr[7] = v & 0xff; // Parse ........-....-....-####-............

			  arr[8] = (v = parseInt(uuid.slice(19, 23), 16)) >>> 8;
			  arr[9] = v & 0xff; // Parse ........-....-....-....-############
			  // (Use "/" to avoid 32-bit truncation when bit-shifting high-order bytes)

			  arr[10] = (v = parseInt(uuid.slice(24, 36), 16)) / 0x10000000000 & 0xff;
			  arr[11] = v / 0x100000000 & 0xff;
			  arr[12] = v >>> 24 & 0xff;
			  arr[13] = v >>> 16 & 0xff;
			  arr[14] = v >>> 8 & 0xff;
			  arr[15] = v & 0xff;
			  return arr;
			}

			function stringToBytes(str) {
			  str = unescape(encodeURIComponent(str)); // UTF8 escape

			  var bytes = [];

			  for (var i = 0; i < str.length; ++i) {
			    bytes.push(str.charCodeAt(i));
			  }

			  return bytes;
			}

			var DNS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
			var URL = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';
			function v35 (name, version, hashfunc) {
			  function generateUUID(value, namespace, buf, offset) {
			    if (typeof value === 'string') {
			      value = stringToBytes(value);
			    }

			    if (typeof namespace === 'string') {
			      namespace = parse$1(namespace);
			    }

			    if (namespace.length !== 16) {
			      throw TypeError('Namespace must be array-like (16 iterable integer values, 0-255)');
			    } // Compute hash of namespace and value, Per 4.3
			    // Future: Use spread syntax when supported on all platforms, e.g. `bytes =
			    // hashfunc([...namespace, ... value])`


			    var bytes = new Uint8Array(16 + value.length);
			    bytes.set(namespace);
			    bytes.set(value, namespace.length);
			    bytes = hashfunc(bytes);
			    bytes[6] = bytes[6] & 0x0f | version;
			    bytes[8] = bytes[8] & 0x3f | 0x80;

			    if (buf) {
			      offset = offset || 0;

			      for (var i = 0; i < 16; ++i) {
			        buf[offset + i] = bytes[i];
			      }

			      return buf;
			    }

			    return stringify$1(bytes);
			  } // Function#name is not settable on some platforms (#270)


			  try {
			    generateUUID.name = name; // eslint-disable-next-line no-empty
			  } catch (err) {} // For CommonJS default export support


			  generateUUID.DNS = DNS;
			  generateUUID.URL = URL;
			  return generateUUID;
			}

			/*
			 * Browser-compatible JavaScript MD5
			 *
			 * Modification of JavaScript MD5
			 * https://github.com/blueimp/JavaScript-MD5
			 *
			 * Copyright 2011, Sebastian Tschan
			 * https://blueimp.net
			 *
			 * Licensed under the MIT license:
			 * https://opensource.org/licenses/MIT
			 *
			 * Based on
			 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
			 * Digest Algorithm, as defined in RFC 1321.
			 * Version 2.2 Copyright (C) Paul Johnston 1999 - 2009
			 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
			 * Distributed under the BSD License
			 * See http://pajhome.org.uk/crypt/md5 for more info.
			 */
			function md5(bytes) {
			  if (typeof bytes === 'string') {
			    var msg = unescape(encodeURIComponent(bytes)); // UTF8 escape

			    bytes = new Uint8Array(msg.length);

			    for (var i = 0; i < msg.length; ++i) {
			      bytes[i] = msg.charCodeAt(i);
			    }
			  }

			  return md5ToHexEncodedArray(wordsToMd5(bytesToWords(bytes), bytes.length * 8));
			}
			/*
			 * Convert an array of little-endian words to an array of bytes
			 */


			function md5ToHexEncodedArray(input) {
			  var output = [];
			  var length32 = input.length * 32;
			  var hexTab = '0123456789abcdef';

			  for (var i = 0; i < length32; i += 8) {
			    var x = input[i >> 5] >>> i % 32 & 0xff;
			    var hex = parseInt(hexTab.charAt(x >>> 4 & 0x0f) + hexTab.charAt(x & 0x0f), 16);
			    output.push(hex);
			  }

			  return output;
			}
			/**
			 * Calculate output length with padding and bit length
			 */


			function getOutputLength(inputLength8) {
			  return (inputLength8 + 64 >>> 9 << 4) + 14 + 1;
			}
			/*
			 * Calculate the MD5 of an array of little-endian words, and a bit length.
			 */


			function wordsToMd5(x, len) {
			  /* append padding */
			  x[len >> 5] |= 0x80 << len % 32;
			  x[getOutputLength(len) - 1] = len;
			  var a = 1732584193;
			  var b = -271733879;
			  var c = -1732584194;
			  var d = 271733878;

			  for (var i = 0; i < x.length; i += 16) {
			    var olda = a;
			    var oldb = b;
			    var oldc = c;
			    var oldd = d;
			    a = md5ff(a, b, c, d, x[i], 7, -680876936);
			    d = md5ff(d, a, b, c, x[i + 1], 12, -389564586);
			    c = md5ff(c, d, a, b, x[i + 2], 17, 606105819);
			    b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330);
			    a = md5ff(a, b, c, d, x[i + 4], 7, -176418897);
			    d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426);
			    c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341);
			    b = md5ff(b, c, d, a, x[i + 7], 22, -45705983);
			    a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416);
			    d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417);
			    c = md5ff(c, d, a, b, x[i + 10], 17, -42063);
			    b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162);
			    a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682);
			    d = md5ff(d, a, b, c, x[i + 13], 12, -40341101);
			    c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290);
			    b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329);
			    a = md5gg(a, b, c, d, x[i + 1], 5, -165796510);
			    d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632);
			    c = md5gg(c, d, a, b, x[i + 11], 14, 643717713);
			    b = md5gg(b, c, d, a, x[i], 20, -373897302);
			    a = md5gg(a, b, c, d, x[i + 5], 5, -701558691);
			    d = md5gg(d, a, b, c, x[i + 10], 9, 38016083);
			    c = md5gg(c, d, a, b, x[i + 15], 14, -660478335);
			    b = md5gg(b, c, d, a, x[i + 4], 20, -405537848);
			    a = md5gg(a, b, c, d, x[i + 9], 5, 568446438);
			    d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690);
			    c = md5gg(c, d, a, b, x[i + 3], 14, -187363961);
			    b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501);
			    a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467);
			    d = md5gg(d, a, b, c, x[i + 2], 9, -51403784);
			    c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473);
			    b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734);
			    a = md5hh(a, b, c, d, x[i + 5], 4, -378558);
			    d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463);
			    c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562);
			    b = md5hh(b, c, d, a, x[i + 14], 23, -35309556);
			    a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060);
			    d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353);
			    c = md5hh(c, d, a, b, x[i + 7], 16, -155497632);
			    b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640);
			    a = md5hh(a, b, c, d, x[i + 13], 4, 681279174);
			    d = md5hh(d, a, b, c, x[i], 11, -358537222);
			    c = md5hh(c, d, a, b, x[i + 3], 16, -722521979);
			    b = md5hh(b, c, d, a, x[i + 6], 23, 76029189);
			    a = md5hh(a, b, c, d, x[i + 9], 4, -640364487);
			    d = md5hh(d, a, b, c, x[i + 12], 11, -421815835);
			    c = md5hh(c, d, a, b, x[i + 15], 16, 530742520);
			    b = md5hh(b, c, d, a, x[i + 2], 23, -995338651);
			    a = md5ii(a, b, c, d, x[i], 6, -198630844);
			    d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415);
			    c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905);
			    b = md5ii(b, c, d, a, x[i + 5], 21, -57434055);
			    a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571);
			    d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606);
			    c = md5ii(c, d, a, b, x[i + 10], 15, -1051523);
			    b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799);
			    a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359);
			    d = md5ii(d, a, b, c, x[i + 15], 10, -30611744);
			    c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380);
			    b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649);
			    a = md5ii(a, b, c, d, x[i + 4], 6, -145523070);
			    d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379);
			    c = md5ii(c, d, a, b, x[i + 2], 15, 718787259);
			    b = md5ii(b, c, d, a, x[i + 9], 21, -343485551);
			    a = safeAdd(a, olda);
			    b = safeAdd(b, oldb);
			    c = safeAdd(c, oldc);
			    d = safeAdd(d, oldd);
			  }

			  return [a, b, c, d];
			}
			/*
			 * Convert an array bytes to an array of little-endian words
			 * Characters >255 have their high-byte silently ignored.
			 */


			function bytesToWords(input) {
			  if (input.length === 0) {
			    return [];
			  }

			  var length8 = input.length * 8;
			  var output = new Uint32Array(getOutputLength(length8));

			  for (var i = 0; i < length8; i += 8) {
			    output[i >> 5] |= (input[i / 8] & 0xff) << i % 32;
			  }

			  return output;
			}
			/*
			 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
			 * to work around bugs in some JS interpreters.
			 */


			function safeAdd(x, y) {
			  var lsw = (x & 0xffff) + (y & 0xffff);
			  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
			  return msw << 16 | lsw & 0xffff;
			}
			/*
			 * Bitwise rotate a 32-bit number to the left.
			 */


			function bitRotateLeft(num, cnt) {
			  return num << cnt | num >>> 32 - cnt;
			}
			/*
			 * These functions implement the four basic operations the algorithm uses.
			 */


			function md5cmn(q, a, b, x, s, t) {
			  return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
			}

			function md5ff(a, b, c, d, x, s, t) {
			  return md5cmn(b & c | ~b & d, a, b, x, s, t);
			}

			function md5gg(a, b, c, d, x, s, t) {
			  return md5cmn(b & d | c & ~d, a, b, x, s, t);
			}

			function md5hh(a, b, c, d, x, s, t) {
			  return md5cmn(b ^ c ^ d, a, b, x, s, t);
			}

			function md5ii(a, b, c, d, x, s, t) {
			  return md5cmn(c ^ (b | ~d), a, b, x, s, t);
			}

			var v3 = v35('v3', 0x30, md5);
			var v3$1 = v3;

			function v4(options, buf, offset) {
			  options = options || {};
			  var rnds = options.random || (options.rng || rng)(); // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`

			  rnds[6] = rnds[6] & 0x0f | 0x40;
			  rnds[8] = rnds[8] & 0x3f | 0x80; // Copy bytes to buffer, if provided

			  if (buf) {
			    offset = offset || 0;

			    for (var i = 0; i < 16; ++i) {
			      buf[offset + i] = rnds[i];
			    }

			    return buf;
			  }

			  return stringify$1(rnds);
			}

			// Adapted from Chris Veness' SHA1 code at
			// http://www.movable-type.co.uk/scripts/sha1.html
			function f(s, x, y, z) {
			  switch (s) {
			    case 0:
			      return x & y ^ ~x & z;

			    case 1:
			      return x ^ y ^ z;

			    case 2:
			      return x & y ^ x & z ^ y & z;

			    case 3:
			      return x ^ y ^ z;
			  }
			}

			function ROTL(x, n) {
			  return x << n | x >>> 32 - n;
			}

			function sha1(bytes) {
			  var K = [0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xca62c1d6];
			  var H = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];

			  if (typeof bytes === 'string') {
			    var msg = unescape(encodeURIComponent(bytes)); // UTF8 escape

			    bytes = [];

			    for (var i = 0; i < msg.length; ++i) {
			      bytes.push(msg.charCodeAt(i));
			    }
			  } else if (!Array.isArray(bytes)) {
			    // Convert Array-like to Array
			    bytes = Array.prototype.slice.call(bytes);
			  }

			  bytes.push(0x80);
			  var l = bytes.length / 4 + 2;
			  var N = Math.ceil(l / 16);
			  var M = new Array(N);

			  for (var _i = 0; _i < N; ++_i) {
			    var arr = new Uint32Array(16);

			    for (var j = 0; j < 16; ++j) {
			      arr[j] = bytes[_i * 64 + j * 4] << 24 | bytes[_i * 64 + j * 4 + 1] << 16 | bytes[_i * 64 + j * 4 + 2] << 8 | bytes[_i * 64 + j * 4 + 3];
			    }

			    M[_i] = arr;
			  }

			  M[N - 1][14] = (bytes.length - 1) * 8 / Math.pow(2, 32);
			  M[N - 1][14] = Math.floor(M[N - 1][14]);
			  M[N - 1][15] = (bytes.length - 1) * 8 & 0xffffffff;

			  for (var _i2 = 0; _i2 < N; ++_i2) {
			    var W = new Uint32Array(80);

			    for (var t = 0; t < 16; ++t) {
			      W[t] = M[_i2][t];
			    }

			    for (var _t = 16; _t < 80; ++_t) {
			      W[_t] = ROTL(W[_t - 3] ^ W[_t - 8] ^ W[_t - 14] ^ W[_t - 16], 1);
			    }

			    var a = H[0];
			    var b = H[1];
			    var c = H[2];
			    var d = H[3];
			    var e = H[4];

			    for (var _t2 = 0; _t2 < 80; ++_t2) {
			      var s = Math.floor(_t2 / 20);
			      var T = ROTL(a, 5) + f(s, b, c, d) + e + K[s] + W[_t2] >>> 0;
			      e = d;
			      d = c;
			      c = ROTL(b, 30) >>> 0;
			      b = a;
			      a = T;
			    }

			    H[0] = H[0] + a >>> 0;
			    H[1] = H[1] + b >>> 0;
			    H[2] = H[2] + c >>> 0;
			    H[3] = H[3] + d >>> 0;
			    H[4] = H[4] + e >>> 0;
			  }

			  return [H[0] >> 24 & 0xff, H[0] >> 16 & 0xff, H[0] >> 8 & 0xff, H[0] & 0xff, H[1] >> 24 & 0xff, H[1] >> 16 & 0xff, H[1] >> 8 & 0xff, H[1] & 0xff, H[2] >> 24 & 0xff, H[2] >> 16 & 0xff, H[2] >> 8 & 0xff, H[2] & 0xff, H[3] >> 24 & 0xff, H[3] >> 16 & 0xff, H[3] >> 8 & 0xff, H[3] & 0xff, H[4] >> 24 & 0xff, H[4] >> 16 & 0xff, H[4] >> 8 & 0xff, H[4] & 0xff];
			}

			var v5 = v35('v5', 0x50, sha1);
			var v5$1 = v5;

			var nil$3 = '00000000-0000-0000-0000-000000000000';

			function version(uuid) {
			  if (!validate$4(uuid)) {
			    throw TypeError('Invalid UUID');
			  }

			  return parseInt(uuid.substr(14, 1), 16);
			}

			var esmBrowser = /*#__PURE__*/Object.freeze({
				__proto__: null,
				v1: v1,
				v3: v3$1,
				v4: v4,
				v5: v5$1,
				NIL: nil$3,
				version: version,
				validate: validate$4,
				stringify: stringify$1,
				parse: parse$1
			});

			var require$$0 = /*@__PURE__*/getAugmentedNamespace(esmBrowser);

			var justCurryIt = curry$a;

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

			function curry$a(fn, arity) {
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

			var pubsub = {exports: {}};

			/**
			 * Copyright (c) 2010,2011,2012,2013,2014 Morgan Roderick http://roderick.dk
			 * License: MIT - http://mrgnrdrck.mit-license.org
			 *
			 * https://github.com/mroderick/PubSubJS
			 */

			(function (module, exports) {
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
			}(pubsub, pubsub.exports));

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

			const resolveUrl = urlResolveBrowser;


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
			  const resolvedUrl = resolveUrl(contextUrl, url);
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

			var common$2 = { jsonTypeOf: jsonTypeOf$2, splitUrl: splitUrl$4, safeResolveUrl: safeResolveUrl$1, pathRelative: pathRelative$1 };

			const curry$9 = justCurryIt;


			const nil$2 = "";

			const compile$P = (pointer) => {
			  if (pointer.length > 0 && pointer[0] !== "/") {
			    throw Error("Invalid JSON Pointer");
			  }

			  return pointer.split("/").slice(1).map(unescape$1);
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
			  const fn = curry$9((subject, value) => _set(ptr, subject, value, nil$2));
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
			  const fn = curry$9((subject, value) => _assign(ptr, subject, value, nil$2));
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

			const append = curry$9((segment, pointer) => pointer + "/" + escape(segment));

			const escape = (segment) => segment.toString().replace(/~/g, "~0").replace(/\//g, "~1");
			const unescape$1 = (segment) => segment.toString().replace(/~1/g, "/").replace(/~0/g, "~");
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

			var lib$4 = { nil: nil$2, append, get: get$1, set, assign, unset, remove };

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

			const JsonPointer$2 = lib$4;
			const curry$8 = justCurryIt;
			const { jsonTypeOf: jsonTypeOf$1 } = common$2;
			const Reference$2 = reference;


			const nil$1 = Object.freeze({ id: "", pointer: "", instance: undefined, value: undefined });
			const cons = (instance, id = "") => Object.freeze({ ...nil$1, id, instance, value: instance });
			const uri$1 = (doc) => `${doc.id}#${encodeURI(doc.pointer)}`;
			const value$1 = (doc) => Reference$2.isReference(doc.value) ? Reference$2.value(doc.value) : doc.value;
			const has$1 = (key, doc) => key in value$1(doc);
			const typeOf$1 = curry$8((doc, type) => jsonTypeOf$1(value$1(doc), type));

			const step$1 = (key, doc) => Object.freeze({
			  ...doc,
			  pointer: JsonPointer$2.append(key, doc.pointer),
			  value: value$1(doc)[key]
			});

			const entries$3 = (doc) => Object.keys(value$1(doc))
			  .map((key) => [key, step$1(key, doc)]);

			const keys$1 = (doc) => Object.keys(value$1(doc));

			const map$4 = curry$8((fn, doc) => value$1(doc)
			  .map((item, ndx, array, thisArg) => fn(step$1(ndx, doc), ndx, array, thisArg)));

			const filter$1 = curry$8((fn, doc) => value$1(doc)
			  .map((item, ndx, array, thisArg) => step$1(ndx, doc))
			  .filter((item, ndx, array, thisArg) => fn(item, ndx, array, thisArg)));

			const reduce$3 = curry$8((fn, acc, doc) => value$1(doc)
			  .reduce((acc, item, ndx) => fn(acc, step$1(ndx, doc), ndx), acc));

			const every$1 = curry$8((fn, doc) => value$1(doc)
			  .every((item, ndx, array, thisArg) => fn(step$1(ndx, doc), ndx, array, thisArg)));

			const some$1 = curry$8((fn, doc) => value$1(doc)
			  .some((item, ndx, array, thisArg) => fn(step$1(ndx, doc), ndx, array, thisArg)));

			const length$1 = (doc) => value$1(doc).length;

			var instance = { nil: nil$1, cons, uri: uri$1, value: value$1, has: has$1, typeOf: typeOf$1, step: step$1, entries: entries$3, keys: keys$1, map: map$4, filter: filter$1, reduce: reduce$3, every: every$1, some: some$1, length: length$1 };

			var contentType = {};

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

			contentType.format = format$1;
			contentType.parse = parse;

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

			var entries$2 = async (doc) => Object.entries(await doc);

			const curry$7 = justCurryIt;


			var map$3 = curry$7(async (fn, doc) => (await doc).map(fn));

			const curry$6 = justCurryIt;


			var reduce$2 = curry$6(async (fn, acc, doc) => {
			  return (await doc).reduce(async (acc, item) => fn(await acc, item), acc);
			});

			const curry$5 = justCurryIt;
			const reduce$1 = reduce$2;


			var filter = curry$5(async (fn, doc, options = {}) => {
			  return reduce$1(async (acc, item) => {
			    return (await fn(item)) ? acc.concat([item]) : acc;
			  }, [], doc, options);
			});

			const curry$4 = justCurryIt;
			const map$2 = map$3;


			var some = curry$4(async (fn, doc) => {
			  const results = await map$2(fn, doc);
			  return (await Promise.all(results))
			    .some((a) => a);
			});

			const curry$3 = justCurryIt;
			const map$1 = map$3;


			var every = curry$3(async (fn, doc) => {
			  const results = await map$1(fn, doc);
			  return (await Promise.all(results))
			    .every((a) => a);
			});

			const curry$2 = justCurryIt;


			var pipeline$1 = curry$2((fns, doc) => {
			  return fns.reduce(async (acc, fn) => fn(await acc), doc);
			});

			var all = (doc) => Promise.all(doc);

			const pipeline = pipeline$1;
			const entries$1 = entries$2;
			const reduce = reduce$2;


			var allValues = (doc) => {
			  return pipeline([
			    entries$1,
			    reduce(async (acc, [propertyName, propertyValue]) => {
			      acc[propertyName] = await propertyValue;
			      return acc;
			    }, {})
			  ], doc);
			};

			var lib$3 = {
			  entries: entries$2,
			  map: map$3,
			  filter: filter,
			  reduce: reduce$2,
			  some: some,
			  every: every,
			  pipeline: pipeline$1,
			  all: all,
			  allValues: allValues
			};

			var fetch_browser = fetch;

			const contentTypeParser = contentType;
			const curry$1 = justCurryIt;
			const Pact$a = lib$3;
			const JsonPointer$1 = lib$4;
			const { jsonTypeOf, splitUrl: splitUrl$3, safeResolveUrl, pathRelative } = common$2;
			const fetch$1 = fetch_browser;
			const Reference$1 = reference;


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
			    schema: processSchema(schema, id, schemaVersion, JsonPointer$1.nil, anchors, dynamicAnchors),
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
			      return Reference$1.cons(subject[embeddedEmbeddedToken], subject);
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
			      return Reference$1.cons(subject[jrefToken], subject);
			    }

			    for (const key in subject) {
			      subject[key] = processSchema(subject[key], id, schemaVersion, JsonPointer$1.append(key, pointer), anchors, dynamicAnchors);
			    }

			    return subject;
			  } else if (Array.isArray(subject)) {
			    return subject.map((item, ndx) => processSchema(item, id, schemaVersion, JsonPointer$1.append(ndx, pointer), anchors, dynamicAnchors));
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
			  pointer: JsonPointer$1.nil,
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
			    const response = await fetch$1(id, { headers: { Accept: "application/schema+json" } });
			    if (response.status >= 400) {
			      await response.text(); // Sometimes node hangs without this hack
			      throw Error(`Failed to retrieve schema with id: ${id}`);
			    }

			    if (response.headers.has("content-type")) {
			      const contentType = contentTypeParser.parse(response.headers.get("content-type")).type;
			      if (contentType !== "application/schema+json") {
			        throw Error(`${id} is not a schema. Found a document with media type: ${contentType}`);
			      }
			    }

			    add$1(await response.json(), id);
			  }

			  const storedSchema = getStoredSchema(id);
			  const pointer = fragment[0] !== "/" ? getAnchorPointer(storedSchema, fragment) : fragment;
			  const doc = Object.freeze({
			    ...storedSchema,
			    pointer: pointer,
			    value: JsonPointer$1.get(pointer, storedSchema.schema)
			  });

			  return followReferences$1(doc);
			};

			const followReferences$1 = (doc) => Reference$1.isReference(doc.value) ? get(Reference$1.href(doc.value), doc) : doc;

			const getAnchorPointer = (schema, fragment) => {
			  if (!(fragment in schema.anchors)) {
			    throw Error(`No such anchor '${encodeURI(schema.id)}#${encodeURI(fragment)}'`);
			  }

			  return schema.anchors[fragment];
			};

			// Utility Functions
			const uri = (doc) => `${doc.id}#${encodeURI(doc.pointer)}`;
			const value = (doc) => Reference$1.isReference(doc.value) ? Reference$1.value(doc.value) : doc.value;
			const has = (key, doc) => key in value(doc);
			const typeOf = (doc, type) => jsonTypeOf(value(doc), type);

			const step = (key, doc) => {
			  const storedSchema = getStoredSchema(doc.id);
			  const nextDoc = Object.freeze({
			    ...doc,
			    pointer: JsonPointer$1.append(key, doc.pointer),
			    value: value(doc)[key],
			    validated: storedSchema.validated
			  });
			  return followReferences$1(nextDoc);
			};

			const keys = (doc) => Object.keys(value(doc));

			const entries = (doc) => Pact$a.pipeline([
			  value,
			  Object.keys,
			  Pact$a.map(async (key) => [key, await step(key, doc)]),
			  Pact$a.all
			], doc);

			const map = curry$1((fn, doc) => Pact$a.pipeline([
			  value,
			  Pact$a.map(async (item, ndx) => fn(await step(ndx, doc), ndx)),
			  Pact$a.all
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
			    if (!Reference$1.isReference(value)) {
			      return value;
			    }

			    const refValue = Reference$1.value(value);
			    const embeddedDialect = refValue.$schema || schemaDoc.schemaVersion;
			    const embeddedToken = getConfig(embeddedDialect, "embeddedToken");
			    if (!fullOptions.includeEmbedded && embeddedToken in refValue) {
			      return;
			    } else {
			      return Reference$1.value(value);
			    }
			  }));

			  const dynamicAnchorToken = getConfig(schemaDoc.schemaVersion, "dynamicAnchorToken");
			  Object.entries(schemaDoc.dynamicAnchors)
			    .forEach(([anchor, uri]) => {
			      const pointer = splitUrl$3(uri)[1];
			      JsonPointer$1.assign(pointer, schema, {
			        [dynamicAnchorToken]: anchor,
			        ...JsonPointer$1.get(pointer, schema)
			      });
			    });

			  const anchorToken = getConfig(schemaDoc.schemaVersion, "anchorToken");
			  Object.entries(schemaDoc.anchors)
			    .filter(([anchor]) => anchor !== "")
			    .forEach(([anchor, pointer]) => {
			      JsonPointer$1.assign(pointer, schema, {
			        [anchorToken]: anchor,
			        ...JsonPointer$1.get(pointer, schema)
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

			class InvalidSchemaError$4 extends Error {
			  constructor(output) {
			    super("Invalid Schema");
			    this.name = this.constructor.name;
			    this.output = output;
			  }
			}

			var invalidSchemaError = InvalidSchemaError$4;

			const curry = justCurryIt;
			const PubSub$1 = pubsub.exports;
			const { splitUrl: splitUrl$2 } = common$2;
			const Instance$E = instance;
			const Schema$X = schema$5;
			const InvalidSchemaError$3 = invalidSchemaError;


			const FLAG = "FLAG", BASIC = "BASIC", DETAILED = "DETAILED", VERBOSE = "VERBOSE";

			let metaOutputFormat = DETAILED;
			let shouldMetaValidate = true;

			const validate$3 = async (schema, value = undefined, outputFormat = undefined) => {
			  const compiled = await compile$O(schema);
			  const interpretAst = (value, outputFormat) => interpret$O(compiled, Instance$E.cons(value), outputFormat);

			  return value === undefined ? interpretAst : interpretAst(value, outputFormat);
			};

			const compile$O = async (schema) => {
			  const ast = { metaData: {} };
			  const schemaUri = await compileSchema(schema, ast);
			  return { ast, schemaUri };
			};

			const interpret$O = curry(({ ast, schemaUri }, value, outputFormat = FLAG) => {
			  if (![FLAG, BASIC, DETAILED, VERBOSE].includes(outputFormat)) {
			    throw Error(`The '${outputFormat}' error format is not supported`);
			  }

			  const output = [];
			  const subscriptionToken = PubSub$1.subscribe("result", outputHandler(outputFormat, output));
			  interpretSchema(schemaUri, value, ast, {});
			  PubSub$1.unsubscribe(subscriptionToken);

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
			    const metaSchema = await Schema$X.get(schema.schemaVersion);

			    // Check for mandatory vocabularies
			    const mandatoryVocabularies = Schema$X.getConfig(metaSchema.id, "mandatoryVocabularies") || [];
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
			    Schema$X.markValidated(schema.id);

			    // Compile
			    if (!(schema.schemaVersion in metaValidators)) {
			      const metaSchema = await Schema$X.get(schema.schemaVersion);
			      const compiledSchema = await compile$O(metaSchema);
			      metaValidators[metaSchema.id] = interpret$O(compiledSchema);
			    }

			    // Interpret
			    const schemaInstance = Instance$E.cons(schema.schema, schema.id);
			    const metaResults = metaValidators[schema.schemaVersion](schemaInstance, metaOutputFormat);
			    if (!metaResults.valid) {
			      throw new InvalidSchemaError$3(metaResults);
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
			  return Schema$X.typeOf(doc, "string") ? followReferences(await Schema$X.get(Schema$X.value(doc), doc)) : doc;
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
			  const id = Schema$X.add(schema, url, defaultSchemaVersion);
			  delete metaValidators[id];
			};

			var core$3 = {
			  validate: validate$3, compile: compile$O, interpret: interpret$O,
			  setMetaOutputFormat, setShouldMetaValidate, FLAG, BASIC, DETAILED, VERBOSE,
			  add, getKeyword, hasKeyword, defineVocabulary,
			  compileSchema, interpretSchema, collectEvaluatedProperties: collectEvaluatedProperties$e, collectEvaluatedItems: collectEvaluatedItems$f
			};

			const Schema$W = schema$5;


			const compile$N = (schema) => Schema$W.value(schema);
			const interpret$N = () => true;

			var metaData$3 = { compile: compile$N, interpret: interpret$N };

			const Pact$9 = lib$3;
			const PubSub = pubsub.exports;
			const Core$F = core$3;
			const Instance$D = instance;
			const Schema$V = schema$5;


			const compile$M = async (schema, ast) => {
			  const url = Schema$V.uri(schema);
			  if (!(url in ast)) {
			    ast[url] = false; // Place dummy entry in ast to avoid recursive loops

			    const schemaValue = Schema$V.value(schema);
			    if (!["object", "boolean"].includes(typeof schemaValue)) {
			      throw Error(`No schema found at '${Schema$V.uri(schema)}'`);
			    }

			    ast[url] = [
			      `${schema.schemaVersion}#validate`,
			      Schema$V.uri(schema),
			      typeof schemaValue === "boolean" ? schemaValue : await Pact$9.pipeline([
			        Schema$V.entries,
			        Pact$9.map(([keyword, keywordSchema]) => [`${schema.schemaVersion}#${keyword}`, keywordSchema]),
			        Pact$9.filter(([keywordId]) => Core$F.hasKeyword(keywordId) && keywordId !== `${schema.schemaVersion}#validate`),
			        Pact$9.map(async ([keywordId, keywordSchema]) => {
			          const keywordAst = await Core$F.getKeyword(keywordId).compile(keywordSchema, ast, schema);
			          return [keywordId, Schema$V.uri(keywordSchema), keywordAst];
			        }),
			        Pact$9.all
			      ], schema)
			    ];
			  }

			  return url;
			};

			const interpret$M = (uri, instance, ast, dynamicAnchors) => {
			  const [keywordId, schemaUrl, nodes] = ast[uri];

			  PubSub.publishSync("result.start");
			  const isValid = typeof nodes === "boolean" ? nodes : nodes
			    .every(([keywordId, schemaUrl, keywordValue]) => {
			      PubSub.publishSync("result.start");
			      const isValid = Core$F.getKeyword(keywordId).interpret(keywordValue, instance, ast, dynamicAnchors);

			      PubSub.publishSync("result", {
			        keyword: keywordId,
			        absoluteKeywordLocation: schemaUrl,
			        instanceLocation: Instance$D.uri(instance),
			        valid: isValid,
			        ast: keywordValue
			      });
			      PubSub.publishSync("result.end");
			      return isValid;
			    });

			  PubSub.publishSync("result", {
			    keyword: keywordId,
			    absoluteKeywordLocation: schemaUrl,
			    instanceLocation: Instance$D.uri(instance),
			    valid: isValid,
			    ast: uri
			  });
			  PubSub.publishSync("result.end");
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
			      const propertyNames = acc && Core$F.getKeyword(keywordId).collectEvaluatedProperties(keywordValue, instance, ast, dynamicAnchors);
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
			      const itemIndexes = acc !== false && Core$F.getKeyword(keywordId).collectEvaluatedItems(keywordValue, instance, ast, dynamicAnchors);
			      return itemIndexes !== false && new Set([...acc, ...itemIndexes]);
			    }, new Set());
			};

			var validate$2 = { compile: compile$M, interpret: interpret$M, collectEvaluatedProperties: collectEvaluatedProperties$d, collectEvaluatedItems: collectEvaluatedItems$e };

			const metaData$2 = metaData$3;
			const validate$1 = validate$2;


			var keywords$7 = { metaData: metaData$2, validate: validate$1 };

			const Core$E = core$3;
			const Schema$U = schema$5;
			const Instance$C = instance;
			const Reference = reference;
			const Keywords$7 = keywords$7;
			const InvalidSchemaError$2 = invalidSchemaError;


			var lib$2 = { Core: Core$E, Schema: Schema$U, Instance: Instance$C, Reference, Keywords: Keywords$7, InvalidSchemaError: InvalidSchemaError$2 };

			const { Core: Core$D, Schema: Schema$T, Instance: Instance$B } = lib$2;


			const compile$L = async (schema, ast, parentSchema) => {
			  const items = await Schema$T.step("items", parentSchema);
			  const numberOfItems = Schema$T.typeOf(items, "array") ? Schema$T.length(items) : Number.MAX_SAFE_INTEGER;

			  if (Schema$T.typeOf(schema, "boolean")) {
			    return [numberOfItems, Schema$T.value(schema)];
			  } else {
			    return [numberOfItems, await Core$D.compileSchema(schema, ast)];
			  }
			};

			const interpret$L = ([numberOfItems, additionalItems], instance, ast, dynamicAnchors) => {
			  if (!Instance$B.typeOf(instance, "array")) {
			    return true;
			  }

			  if (typeof additionalItems === "string") {
			    return Instance$B.every((item, ndx) => ndx < numberOfItems || Core$D.interpretSchema(additionalItems, item, ast, dynamicAnchors), instance);
			  } else {
			    return Instance$B.every((item, ndx) => ndx < numberOfItems ? true : additionalItems, instance);
			  }
			};

			var additionalItems$1 = { compile: compile$L, interpret: interpret$L };

			const { Core: Core$C, Schema: Schema$S, Instance: Instance$A } = lib$2;


			const compile$K = async (schema, ast, parentSchema) => {
			  const items = await Schema$S.step("items", parentSchema);
			  const numberOfItems = Schema$S.typeOf(items, "array") ? Schema$S.length(items) : Number.MAX_SAFE_INTEGER;

			  return [numberOfItems, await Core$C.compileSchema(schema, ast)];
			};

			const interpret$K = ([numberOfItems, additionalItems], instance, ast, dynamicAnchors) => {
			  if (!Instance$A.typeOf(instance, "array")) {
			    return true;
			  }

			  return Instance$A.every((item, ndx) => ndx < numberOfItems || Core$C.interpretSchema(additionalItems, item, ast, dynamicAnchors), instance);
			};

			const collectEvaluatedItems$d = (keywordValue, instance, ast, dynamicAnchors) => {
			  return interpret$K(keywordValue, instance, ast, dynamicAnchors) && new Set(Instance$A.map((item, ndx) => ndx, instance));
			};

			var additionalItems6$1 = { compile: compile$K, interpret: interpret$K, collectEvaluatedItems: collectEvaluatedItems$d };

			const { Core: Core$B, Schema: Schema$R, Instance: Instance$z } = lib$2;


			const compile$J = async (schema, ast, parentSchema) => {
			  const properties = await Schema$R.step("properties", parentSchema);
			  const propertyNames = Schema$R.typeOf(properties, "object") ? Schema$R.keys(properties) : [];

			  const patternProperties = await Schema$R.step("patternProperties", parentSchema);
			  const propertyNamePatterns = Schema$R.typeOf(patternProperties, "object") ? Schema$R.keys(patternProperties).map((pattern) => new RegExp(pattern)) : [];

			  if (Schema$R.typeOf(schema, "boolean")) {
			    return [propertyNames, propertyNamePatterns, Schema$R.value(schema)];
			  } else {
			    return [propertyNames, propertyNamePatterns, await Core$B.compileSchema(schema, ast)];
			  }
			};

			const interpret$J = ([propertyNames, propertyNamePatterns, additionalProperties], instance, ast, dynamicAnchors) => {
			  if (!Instance$z.typeOf(instance, "object")) {
			    return true;
			  }

			  const properties = Instance$z.entries(instance)
			    .filter(([propertyName]) => !propertyNames.includes(propertyName) && !propertyNamePatterns.some((pattern) => pattern.test(propertyName)));

			  if (typeof additionalProperties === "string") {
			    return properties.every(([, property]) => Core$B.interpretSchema(additionalProperties, property, ast, dynamicAnchors));
			  } else {
			    return properties.length === 0 || additionalProperties;
			  }
			};

			var additionalProperties$1 = { compile: compile$J, interpret: interpret$J };

			const { Core: Core$A, Schema: Schema$Q, Instance: Instance$y } = lib$2;


			const compile$I = async (schema, ast, parentSchema) => {
			  const propertiesSchema = await Schema$Q.step("properties", parentSchema);
			  const propertyNames = Schema$Q.typeOf(propertiesSchema, "object") ? Schema$Q.keys(propertiesSchema) : [];

			  const patternProperties = await Schema$Q.step("patternProperties", parentSchema);
			  const propertyNamePatterns = Schema$Q.typeOf(patternProperties, "object") ? Schema$Q.keys(patternProperties).map((pattern) => new RegExp(pattern)) : [];

			  return [propertyNames, propertyNamePatterns, await Core$A.compileSchema(schema, ast)];
			};

			const interpret$I = ([propertyNames, propertyNamePatterns, additionalProperties], instance, ast, dynamicAnchors) => {
			  if (!Instance$y.typeOf(instance, "object")) {
			    return true;
			  }

			  return Instance$y.entries(instance)
			    .filter(([propertyName]) => !propertyNames.includes(propertyName) && !propertyNamePatterns.some((pattern) => pattern.test(propertyName)))
			    .every(([, property]) => Core$A.interpretSchema(additionalProperties, property, ast, dynamicAnchors));
			};

			const collectEvaluatedProperties$c = (keywordValue, instance, ast, dynamicAnchors) => {
			  return interpret$I(keywordValue, instance, ast, dynamicAnchors) && [new RegExp("")];
			};

			var additionalProperties6$1 = { compile: compile$I, interpret: interpret$I, collectEvaluatedProperties: collectEvaluatedProperties$c };

			const { Core: Core$z, Schema: Schema$P } = lib$2;
			const Pact$8 = lib$3;


			const compile$H = (schema, ast) => Pact$8.pipeline([
			  Schema$P.map(async (itemSchema) => Core$z.compileSchema(await itemSchema, ast)),
			  Pact$8.all
			], schema);

			const interpret$H = (allOf, instance, ast, dynamicAnchors) => {
			  return allOf.every((schemaUrl) => Core$z.interpretSchema(schemaUrl, instance, ast, dynamicAnchors));
			};

			const collectEvaluatedProperties$b = (allOf, instance, ast, dynamicAnchors) => {
			  return allOf.reduce((acc, schemaUrl) => {
			    const propertyNames = acc && Core$z.collectEvaluatedProperties(schemaUrl, instance, ast, dynamicAnchors);
			    return propertyNames !== false && [...acc, ...propertyNames];
			  }, []);
			};

			const collectEvaluatedItems$c = (allOf, instance, ast, dynamicAnchors) => {
			  return allOf.reduce((acc, schemaUrl) => {
			    const itemIndexes = acc !== false && Core$z.collectEvaluatedItems(schemaUrl, instance, ast, dynamicAnchors);
			    return itemIndexes !== false && new Set([...acc, ...itemIndexes]);
			  }, new Set());
			};

			var allOf$1 = { compile: compile$H, interpret: interpret$H, collectEvaluatedProperties: collectEvaluatedProperties$b, collectEvaluatedItems: collectEvaluatedItems$c };

			const { Core: Core$y, Schema: Schema$O } = lib$2;
			const Pact$7 = lib$3;


			const compile$G = (schema, ast) => Pact$7.pipeline([
			  Schema$O.map(async (itemSchema) => Core$y.compileSchema(await itemSchema, ast)),
			  Pact$7.all
			], schema);

			const interpret$G = (anyOf, instance, ast, dynamicAnchors) => {
			  const matches = anyOf.filter((schemaUrl) => Core$y.interpretSchema(schemaUrl, instance, ast, dynamicAnchors));
			  return matches.length > 0;
			};

			const collectEvaluatedProperties$a = (anyOf, instance, ast, dynamicAnchors) => {
			  return anyOf.reduce((acc, schemaUrl) => {
			    const propertyNames = Core$y.collectEvaluatedProperties(schemaUrl, instance, ast, dynamicAnchors);
			    return propertyNames !== false ? [...acc || [], ...propertyNames] : acc;
			  }, false);
			};

			const collectEvaluatedItems$b = (anyOf, instance, ast, dynamicAnchors) => {
			  return anyOf.reduce((acc, schemaUrl) => {
			    const itemIndexes = Core$y.collectEvaluatedItems(schemaUrl, instance, ast, dynamicAnchors);
			    return itemIndexes !== false ? new Set([...acc || [], ...itemIndexes]) : acc;
			  }, false);
			};

			var anyOf$1 = { compile: compile$G, interpret: interpret$G, collectEvaluatedProperties: collectEvaluatedProperties$a, collectEvaluatedItems: collectEvaluatedItems$b };

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

			const { Schema: Schema$N, Instance: Instance$x } = lib$2;
			const jsonStringify$2 = fastestStableStringify;


			const compile$F = (schema) => jsonStringify$2(Schema$N.value(schema));
			const interpret$F = (const_, instance) => jsonStringify$2(Instance$x.value(instance)) === const_;

			var _const = { compile: compile$F, interpret: interpret$F };

			const { Core: Core$x, Instance: Instance$w } = lib$2;


			const compile$E = (schema, ast) => Core$x.compileSchema(schema, ast);

			const interpret$E = (contains, instance, ast, dynamicAnchors) => {
			  return !Instance$w.typeOf(instance, "array") || Instance$w.some((item) => Core$x.interpretSchema(contains, item, ast, dynamicAnchors), instance);
			};

			var contains$1 = { compile: compile$E, interpret: interpret$E };

			const { Core: Core$w, Schema: Schema$M, Instance: Instance$v } = lib$2;


			const compile$D = async (schema, ast, parentSchema) => {
			  const contains = await Core$w.compileSchema(schema, ast);

			  const minContainsSchema = await Schema$M.step("minContains", parentSchema);
			  const minContains = Schema$M.typeOf(minContainsSchema, "number") ? Schema$M.value(minContainsSchema) : 1;

			  const maxContainsSchema = await Schema$M.step("maxContains", parentSchema);
			  const maxContains = Schema$M.typeOf(maxContainsSchema, "number") ? Schema$M.value(maxContainsSchema) : Number.MAX_SAFE_INTEGER;

			  return { contains, minContains, maxContains };
			};

			const interpret$D = ({ contains, minContains, maxContains }, instance, ast, dynamicAnchors) => {
			  if (!Instance$v.typeOf(instance, "array")) {
			    return true;
			  }

			  const matches = Instance$v.reduce((matches, item) => {
			    return Core$w.interpretSchema(contains, item, ast, dynamicAnchors) ? matches + 1 : matches;
			  }, 0, instance);
			  return matches >= minContains && matches <= maxContains;
			};

			const collectEvaluatedItems$a = (keywordValue, instance, ast, dynamicAnchors) => {
			  return interpret$D(keywordValue, instance, ast, dynamicAnchors) && Instance$v.reduce((matchedIndexes, item, itemIndex) => {
			    return Core$w.interpretSchema(keywordValue.contains, item, ast, dynamicAnchors) ? matchedIndexes.add(itemIndex) : matchedIndexes;
			  }, new Set(), instance);
			};

			var containsMinContainsMaxContains$1 = { compile: compile$D, interpret: interpret$D, collectEvaluatedItems: collectEvaluatedItems$a };

			const { Core: Core$v, Schema: Schema$L } = lib$2;
			const Pact$6 = lib$3;


			const compile$C = async (schema, ast) => {
			  await Pact$6.pipeline([
			    Schema$L.entries,
			    Pact$6.map(([, definitionSchema]) => Core$v.compileSchema(definitionSchema, ast)),
			    Pact$6.all
			  ], schema);
			};

			const interpret$C = () => true;

			var definitions = { compile: compile$C, interpret: interpret$C };

			const { Core: Core$u, Schema: Schema$K, Instance: Instance$u } = lib$2;
			const Pact$5 = lib$3;


			const compile$B = (schema, ast) => Pact$5.pipeline([
			  Schema$K.entries,
			  Pact$5.map(async ([key, dependency]) => {
			    return [key, Schema$K.typeOf(dependency, "array") ? Schema$K.value(dependency) : await Core$u.compileSchema(dependency, ast)];
			  }),
			  Pact$5.all
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
			      return Core$u.interpretSchema(dependency, instance, ast, dynamicAnchors);
			    }
			  });
			};

			var dependencies$1 = { compile: compile$B, interpret: interpret$B };

			const { Schema: Schema$J, Instance: Instance$t } = lib$2;
			const Pact$4 = lib$3;


			const compile$A = (schema) => Pact$4.pipeline([
			  Schema$J.entries,
			  Pact$4.map(([key, dependentRequired]) => [key, Schema$J.value(dependentRequired)]),
			  Pact$4.all
			], schema);

			const interpret$A = (dependentRequired, instance) => {
			  const value = Instance$t.value(instance);

			  return !Instance$t.typeOf(instance, "object") || dependentRequired.every(([propertyName, required]) => {
			    return !(propertyName in value) || required.every((key) => key in value);
			  });
			};

			var dependentRequired = { compile: compile$A, interpret: interpret$A };

			const { Core: Core$t, Schema: Schema$I, Instance: Instance$s } = lib$2;
			const Pact$3 = lib$3;


			const compile$z = (schema, ast) => Pact$3.pipeline([
			  Schema$I.entries,
			  Pact$3.map(async ([key, dependentSchema]) => [key, await Core$t.compileSchema(dependentSchema, ast)]),
			  Pact$3.all
			], schema);

			const interpret$z = (dependentSchemas, instance, ast, dynamicAnchors) => {
			  const value = Instance$s.value(instance);

			  return !Instance$s.typeOf(instance, "object") || dependentSchemas.every(([propertyName, dependentSchema]) => {
			    return !(propertyName in value) || Core$t.interpretSchema(dependentSchema, instance, ast, dynamicAnchors);
			  });
			};

			const collectEvaluatedProperties$9 = (dependentSchemas, instance, ast, dynamicAnchors) => {
			  return dependentSchemas.reduce((acc, [propertyName, dependentSchema]) => {
			    if (!acc || !Instance$s.has(propertyName, instance)) {
			      return acc;
			    }

			    const propertyNames = Core$t.collectEvaluatedProperties(dependentSchema, instance, ast, dynamicAnchors);
			    return propertyNames !== false && acc.concat(propertyNames);
			  }, []);
			};

			var dependentSchemas$1 = { compile: compile$z, interpret: interpret$z, collectEvaluatedProperties: collectEvaluatedProperties$9 };

			const { Schema: Schema$H, Instance: Instance$r } = lib$2;
			const jsonStringify$1 = fastestStableStringify;


			const compile$y = (schema) => Schema$H.value(schema).map(jsonStringify$1);
			const interpret$y = (enum_, instance) => enum_.some((enumValue) => jsonStringify$1(Instance$r.value(instance)) === enumValue);

			var _enum = { compile: compile$y, interpret: interpret$y };

			const { Schema: Schema$G, Instance: Instance$q } = lib$2;


			const compile$x = async (schema) => Schema$G.value(schema);
			const interpret$x = (exclusiveMaximum, instance) => !Instance$q.typeOf(instance, "number") || Instance$q.value(instance) < exclusiveMaximum;

			var exclusiveMaximum = { compile: compile$x, interpret: interpret$x };

			const { Schema: Schema$F, Instance: Instance$p } = lib$2;


			const compile$w = async (schema) => Schema$F.value(schema);
			const interpret$w = (exclusiveMinimum, instance) => !Instance$p.typeOf(instance, "number") || Instance$p.value(instance) > exclusiveMinimum;

			var exclusiveMinimum = { compile: compile$w, interpret: interpret$w };

			const { Core: Core$s } = lib$2;


			const compile$v = (schema, ast) => Core$s.compileSchema(schema, ast);

			const interpret$v = (ifSchema, instance, ast, dynamicAnchors) => {
			  Core$s.interpretSchema(ifSchema, instance, ast, dynamicAnchors);
			  return true;
			};

			const collectEvaluatedProperties$8 = (ifSchema, instance, ast, dynamicAnchors) => {
			  return Core$s.collectEvaluatedProperties(ifSchema, instance, ast, dynamicAnchors) || [];
			};

			const collectEvaluatedItems$9 = (ifSchema, instance, ast, dynamicAnchors) => {
			  return Core$s.collectEvaluatedItems(ifSchema, instance, ast, dynamicAnchors) || new Set();
			};

			var _if = { compile: compile$v, interpret: interpret$v, collectEvaluatedProperties: collectEvaluatedProperties$8, collectEvaluatedItems: collectEvaluatedItems$9 };

			const { Core: Core$r, Schema: Schema$E } = lib$2;


			const compile$u = async (schema, ast, parentSchema) => {
			  if (Schema$E.has("if", parentSchema)) {
			    const ifSchema = await Schema$E.step("if", parentSchema);
			    return [await Core$r.compileSchema(ifSchema, ast), await Core$r.compileSchema(schema, ast)];
			  } else {
			    return [];
			  }
			};

			const interpret$u = ([guard, block], instance, ast, dynamicAnchors) => {
			  return guard === undefined || !quietInterpretSchema$1(guard, instance, ast, dynamicAnchors) || Core$r.interpretSchema(block, instance, ast, dynamicAnchors);
			};

			// Interpret a schema without events being emitted
			const quietInterpretSchema$1 = (uri, instance, ast, dynamicAnchors) => {
			  const nodes = ast[uri][2];

			  return typeof nodes === "boolean" ? nodes : nodes
			    .every(([keywordId, , keywordValue]) => {
			      return Core$r.getKeyword(keywordId).interpret(keywordValue, instance, ast, dynamicAnchors);
			    });
			};

			const collectEvaluatedProperties$7 = ([guard, block], instance, ast, dynamicAnchors) => {
			  if (guard === undefined || !quietInterpretSchema$1(guard, instance, ast, dynamicAnchors)) {
			    return [];
			  }

			  return Core$r.collectEvaluatedProperties(block, instance, ast, dynamicAnchors);
			};

			const collectEvaluatedItems$8 = ([guard, block], instance, ast, dynamicAnchors) => {
			  if (guard === undefined || !quietInterpretSchema$1(guard, instance, ast, dynamicAnchors)) {
			    return new Set();
			  }

			  return Core$r.collectEvaluatedItems(block, instance, ast, dynamicAnchors);
			};

			var then$1 = { compile: compile$u, interpret: interpret$u, collectEvaluatedProperties: collectEvaluatedProperties$7, collectEvaluatedItems: collectEvaluatedItems$8 };

			const { Core: Core$q, Schema: Schema$D } = lib$2;


			const compile$t = async (schema, ast, parentSchema) => {
			  if (Schema$D.has("if", parentSchema)) {
			    const ifSchema = await Schema$D.step("if", parentSchema);
			    return [await Core$q.compileSchema(ifSchema, ast), await Core$q.compileSchema(schema, ast)];
			  } else {
			    return [];
			  }
			};

			const interpret$t = ([guard, block], instance, ast, dynamicAnchors) => {
			  return guard === undefined || quietInterpretSchema(guard, instance, ast, dynamicAnchors) || Core$q.interpretSchema(block, instance, ast, dynamicAnchors);
			};

			// Interpret a schema without events being emitted
			const quietInterpretSchema = (uri, instance, ast, dynamicAnchors) => {
			  const nodes = ast[uri][2];

			  return typeof nodes === "boolean" ? nodes : nodes
			    .every(([keywordId, , keywordValue]) => {
			      return Core$q.getKeyword(keywordId).interpret(keywordValue, instance, ast, dynamicAnchors);
			    });
			};

			const collectEvaluatedProperties$6 = ([guard, block], instance, ast, dynamicAnchors) => {
			  if (guard === undefined || quietInterpretSchema(guard, instance, ast, dynamicAnchors)) {
			    return [];
			  }

			  return Core$q.collectEvaluatedProperties(block, instance, ast, dynamicAnchors);
			};

			const collectEvaluatedItems$7 = ([guard, block], instance, ast, dynamicAnchors) => {
			  if (guard === undefined || quietInterpretSchema(guard, instance, ast, dynamicAnchors)) {
			    return new Set();
			  }

			  return Core$q.collectEvaluatedItems(block, instance, ast, dynamicAnchors);
			};

			var _else = { compile: compile$t, interpret: interpret$t, collectEvaluatedProperties: collectEvaluatedProperties$6, collectEvaluatedItems: collectEvaluatedItems$7 };

			const { Core: Core$p, Schema: Schema$C, Instance: Instance$o } = lib$2;


			const compile$s = async (schema, ast) => {
			  if (Schema$C.typeOf(schema, "array")) {
			    const tupleItems = await Schema$C.map((itemSchema) => Core$p.compileSchema(itemSchema, ast), schema);
			    return Promise.all(tupleItems);
			  } else {
			    return Core$p.compileSchema(schema, ast);
			  }
			};

			const interpret$s = (items, instance, ast, dynamicAnchors) => {
			  if (!Instance$o.typeOf(instance, "array")) {
			    return true;
			  }

			  if (typeof items === "string") {
			    return Instance$o.every((itemValue) => Core$p.interpretSchema(items, itemValue, ast, dynamicAnchors), instance);
			  } else {
			    return Instance$o.every((item, ndx) => !(ndx in items) || Core$p.interpretSchema(items[ndx], item, ast, dynamicAnchors), instance);
			  }
			};

			const collectEvaluatedItems$6 = (items, instance, ast, dynamicAnchors) => {
			  return interpret$s(items, instance, ast, dynamicAnchors) && (typeof items === "string"
			    ? new Set(Instance$o.map((item, itemIndex) => itemIndex, instance))
			    : new Set(items.map((item, itemIndex) => itemIndex)));
			};

			var items$1 = { compile: compile$s, interpret: interpret$s, collectEvaluatedItems: collectEvaluatedItems$6 };

			const { Core: Core$o, Schema: Schema$B, Instance: Instance$n } = lib$2;


			const compile$r = async (schema, ast, parentSchema) => {
			  const items = await Schema$B.step("prefixItems", parentSchema);
			  const numberOfPrefixItems = Schema$B.typeOf(items, "array") ? Schema$B.length(items) : 0;

			  return [numberOfPrefixItems, await Core$o.compileSchema(schema, ast)];
			};

			const interpret$r = ([numberOfPrefixItems, items], instance, ast, dynamicAnchors) => {
			  if (!Instance$n.typeOf(instance, "array")) {
			    return true;
			  }

			  return Instance$n.every((item, ndx) => ndx < numberOfPrefixItems || Core$o.interpretSchema(items, item, ast, dynamicAnchors), instance);
			};

			const collectEvaluatedItems$5 = (keywordValue, instance, ast, dynamicAnchors) => {
			  return interpret$r(keywordValue, instance, ast, dynamicAnchors) && new Set(Instance$n.map((item, ndx) => ndx, instance));
			};

			var items202012$1 = { compile: compile$r, interpret: interpret$r, collectEvaluatedItems: collectEvaluatedItems$5 };

			const { Schema: Schema$A, Instance: Instance$m } = lib$2;


			const compile$q = (schema) => Schema$A.value(schema);
			const interpret$q = (maxItems, instance) => !Instance$m.typeOf(instance, "array") || Instance$m.length(instance) <= maxItems;

			var maxItems = { compile: compile$q, interpret: interpret$q };

			const { Schema: Schema$z, Instance: Instance$l } = lib$2;


			const compile$p = (schema) => Schema$z.value(schema);
			const interpret$p = (maxLength, instance) => !Instance$l.typeOf(instance, "string") || Instance$l.length(instance) <= maxLength;

			var maxLength = { compile: compile$p, interpret: interpret$p };

			const { Schema: Schema$y, Instance: Instance$k } = lib$2;


			const compile$o = (schema) => Schema$y.value(schema);
			const interpret$o = (maxLength, instance) => !Instance$k.typeOf(instance, "string") || [...Instance$k.value(instance)].length <= maxLength;

			var maxLength6 = { compile: compile$o, interpret: interpret$o };

			const { Schema: Schema$x, Instance: Instance$j } = lib$2;


			const compile$n = (schema) => Schema$x.value(schema);
			const interpret$n = (maxProperties, instance) => !Instance$j.typeOf(instance, "object") || Instance$j.keys(instance).length <= maxProperties;

			var maxProperties = { compile: compile$n, interpret: interpret$n };

			const { Schema: Schema$w, Instance: Instance$i } = lib$2;


			const compile$m = async (schema, ast, parentSchema) => {
			  const exclusiveMaximum = await Schema$w.step("exclusiveMaximum", parentSchema);
			  const isExclusive = Schema$w.value(exclusiveMaximum);

			  return [Schema$w.value(schema), isExclusive];
			};

			const interpret$m = ([maximum, isExclusive], instance) => {
			  if (!Instance$i.typeOf(instance, "number")) {
			    return true;
			  }

			  const value = Instance$i.value(instance);
			  return isExclusive ? value < maximum : value <= maximum;
			};

			var maximumExclusiveMaximum = { compile: compile$m, interpret: interpret$m };

			const { Schema: Schema$v, Instance: Instance$h } = lib$2;


			const compile$l = async (schema) => Schema$v.value(schema);
			const interpret$l = (maximum, instance) => !Instance$h.typeOf(instance, "number") || Instance$h.value(instance) <= maximum;

			var maximum = { compile: compile$l, interpret: interpret$l };

			const { Schema: Schema$u, Instance: Instance$g } = lib$2;


			const compile$k = (schema) => Schema$u.value(schema);
			const interpret$k = (minItems, instance) => !Instance$g.typeOf(instance, "array") || Instance$g.length(instance) >= minItems;

			var minItems = { compile: compile$k, interpret: interpret$k };

			const { Schema: Schema$t, Instance: Instance$f } = lib$2;


			const compile$j = (schema) => Schema$t.value(schema);
			const interpret$j = (minLength, instance) => !Instance$f.typeOf(instance, "string") || Instance$f.length(instance) >= minLength;

			var minLength = { compile: compile$j, interpret: interpret$j };

			const { Schema: Schema$s, Instance: Instance$e } = lib$2;


			const compile$i = (schema) => Schema$s.value(schema);
			const interpret$i = (minLength, instance) => !Instance$e.typeOf(instance, "string") || [...Instance$e.value(instance)].length >= minLength;

			var minLength6 = { compile: compile$i, interpret: interpret$i };

			const { Schema: Schema$r, Instance: Instance$d } = lib$2;


			const compile$h = (schema) => Schema$r.value(schema);
			const interpret$h = (minProperties, instance) => !Instance$d.typeOf(instance, "object") || Instance$d.keys(instance).length >= minProperties;

			var minProperties = { compile: compile$h, interpret: interpret$h };

			const { Schema: Schema$q, Instance: Instance$c } = lib$2;


			const compile$g = async (schema, ast, parentSchema) => {
			  const exclusiveMinimum = await Schema$q.step("exclusiveMinimum", parentSchema);
			  const isExclusive = Schema$q.value(exclusiveMinimum);

			  return [Schema$q.value(schema), isExclusive];
			};

			const interpret$g = ([minimum, isExclusive], instance) => {
			  if (!Instance$c.typeOf(instance, "number")) {
			    return true;
			  }

			  const value = Instance$c.value(instance);
			  return isExclusive ? value > minimum : value >= minimum;
			};

			var minimumExclusiveMinimum = { compile: compile$g, interpret: interpret$g };

			const { Schema: Schema$p, Instance: Instance$b } = lib$2;


			const compile$f = async (schema) => Schema$p.value(schema);
			const interpret$f = (minimum, instance) => !Instance$b.typeOf(instance, "number") || Instance$b.value(instance) >= minimum;

			var minimum = { compile: compile$f, interpret: interpret$f };

			const { Schema: Schema$o, Instance: Instance$a } = lib$2;


			const compile$e = (schema) => Schema$o.value(schema);

			const interpret$e = (multipleOf, instance) => {
			  if (!Instance$a.typeOf(instance, "number")) {
			    return true;
			  }

			  const remainder = Instance$a.value(instance) % multipleOf;
			  return numberEqual(0, remainder) || numberEqual(multipleOf, remainder);
			};

			const numberEqual = (a, b) => Math.abs(a - b) < 1.19209290e-7;

			var multipleOf = { compile: compile$e, interpret: interpret$e };

			const { Core: Core$n } = lib$2;


			const compile$d = Core$n.compileSchema;
			const interpret$d = (not, instance, ast, dynamicAnchors) => !Core$n.interpretSchema(not, instance, ast, dynamicAnchors);

			var not$1 = { compile: compile$d, interpret: interpret$d };

			const { Core: Core$m, Schema: Schema$n } = lib$2;


			const compile$c = async (schema, ast) => {
			  const oneOf = await Schema$n.map((itemSchema) => Core$m.compileSchema(itemSchema, ast), schema);
			  return Promise.all(oneOf);
			};

			const interpret$c = (oneOf, instance, ast, dynamicAnchors) => {
			  let validCount = 0;
			  for (const schemaUrl of oneOf) {
			    if (Core$m.interpretSchema(schemaUrl, instance, ast, dynamicAnchors)) {
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

			    const propertyNames = Core$m.collectEvaluatedProperties(schemaUrl, instance, ast, dynamicAnchors);
			    return propertyNames ? validCount++ === 0 && propertyNames : acc;
			  }, false);
			};

			const collectEvaluatedItems$4 = (oneOf, instance, ast, dynamicAnchors) => {
			  let validCount = 0;
			  return oneOf.reduce((acc, schemaUrl) => {
			    if (validCount > 1) {
			      return false;
			    }

			    const itemIndexes = Core$m.collectEvaluatedItems(schemaUrl, instance, ast, dynamicAnchors);
			    return itemIndexes ? validCount++ === 0 && itemIndexes : acc;
			  }, false);
			};

			var oneOf$1 = { compile: compile$c, interpret: interpret$c, collectEvaluatedProperties: collectEvaluatedProperties$5, collectEvaluatedItems: collectEvaluatedItems$4 };

			const { Schema: Schema$m, Instance: Instance$9 } = lib$2;


			const compile$b = (schema) => new RegExp(Schema$m.value(schema), "u");
			const interpret$b = (pattern, instance) => !Instance$9.typeOf(instance, "string") || pattern.test(Instance$9.value(instance));

			var pattern = { compile: compile$b, interpret: interpret$b };

			const { Core: Core$l, Schema: Schema$l, Instance: Instance$8 } = lib$2;
			const Pact$2 = lib$3;


			const compile$a = (schema, ast) => Pact$2.pipeline([
			  Schema$l.entries,
			  Pact$2.map(async ([pattern, propertySchema]) => [new RegExp(pattern, "u"), await Core$l.compileSchema(propertySchema, ast)]),
			  Pact$2.all
			], schema);

			const interpret$a = (patternProperties, instance, ast, dynamicAnchors) => {
			  return !Instance$8.typeOf(instance, "object") || patternProperties.every(([pattern, schemaUrl]) => {
			    return Instance$8.entries(instance)
			      .filter(([propertyName]) => pattern.test(propertyName))
			      .every(([, propertyValue]) => Core$l.interpretSchema(schemaUrl, propertyValue, ast, dynamicAnchors));
			  });
			};

			const collectEvaluatedProperties$4 = (patternProperties, instance, ast, dynamicAnchors) => {
			  return interpret$a(patternProperties, instance, ast, dynamicAnchors) && patternProperties.map(([pattern]) => pattern);
			};

			var patternProperties$1 = { compile: compile$a, interpret: interpret$a, collectEvaluatedProperties: collectEvaluatedProperties$4 };

			const isObject = (value) => typeof value === "object" && !Array.isArray(value) && value !== null;
			const escapeRegExp$1 = (string) => string.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&");

			const splitUrl$1 = (url) => {
			  const indexOfHash = url.indexOf("#");
			  const ndx = indexOfHash === -1 ? url.length : indexOfHash;
			  const urlReference = url.slice(0, ndx);
			  const urlFragment = url.slice(ndx + 1);

			  return [decodeURI(urlReference), decodeURI(urlFragment)];
			};

			var common$1 = { isObject, escapeRegExp: escapeRegExp$1, splitUrl: splitUrl$1 };

			const { Core: Core$k, Schema: Schema$k, Instance: Instance$7 } = lib$2;
			const Pact$1 = lib$3;
			const { escapeRegExp } = common$1;


			const compile$9 = (schema, ast) => Pact$1.pipeline([
			  Schema$k.entries,
			  Pact$1.reduce(async (acc, [propertyName, propertySchema]) => {
			    acc[propertyName] = await Core$k.compileSchema(propertySchema, ast);
			    return acc;
			  }, Object.create(null))
			], schema);

			const interpret$9 = (properties, instance, ast, dynamicAnchors) => {
			  return !Instance$7.typeOf(instance, "object") || Instance$7.entries(instance)
			    .filter(([propertyName]) => propertyName in properties)
			    .every(([propertyName, schemaUrl]) => Core$k.interpretSchema(properties[propertyName], schemaUrl, ast, dynamicAnchors));
			};

			const collectEvaluatedProperties$3 = (properties, instance, ast, dynamicAnchors) => {
			  return interpret$9(properties, instance, ast, dynamicAnchors) && Object.keys(properties)
			    .map((propertyName) => new RegExp(`^${escapeRegExp(propertyName)}$`));
			};

			var properties$1 = { compile: compile$9, interpret: interpret$9, collectEvaluatedProperties: collectEvaluatedProperties$3 };

			const { Core: Core$j, Instance: Instance$6 } = lib$2;


			const compile$8 = (schema, ast) => Core$j.compileSchema(schema, ast);

			const interpret$8 = (propertyNames, instance, ast, dynamicAnchors) => {
			  return !Instance$6.typeOf(instance, "object") || Instance$6.keys(instance)
			    .every((key) => Core$j.interpretSchema(propertyNames, Instance$6.cons(key), ast, dynamicAnchors));
			};

			var propertyNames$1 = { compile: compile$8, interpret: interpret$8 };

			const { Core: Core$i, Schema: Schema$j } = lib$2;
			const { splitUrl } = common$1;


			const compile$7 = async (dynamicRef, ast) => {
			  const [, fragment] = splitUrl(Schema$j.value(dynamicRef));
			  const referencedSchema = await Schema$j.get(Schema$j.value(dynamicRef), dynamicRef);
			  await Core$i.compileSchema(referencedSchema, ast);
			  return [referencedSchema.id, fragment];
			};

			const interpret$7 = ([id, fragment], instance, ast, dynamicAnchors) => {
			  if (fragment in ast.metaData[id].dynamicAnchors) {
			    return Core$i.interpretSchema(dynamicAnchors[fragment], instance, ast, dynamicAnchors);
			  } else {
			    const pointer = Schema$j.getAnchorPointer(ast.metaData[id], fragment);
			    return Core$i.interpretSchema(`${id}#${encodeURI(pointer)}`, instance, ast, dynamicAnchors);
			  }
			};

			const collectEvaluatedProperties$2 = Core$i.collectEvaluatedProperties;
			const collectEvaluatedItems$3 = Core$i.collectEvaluatedItems;

			var dynamicRef = { compile: compile$7, interpret: interpret$7, collectEvaluatedProperties: collectEvaluatedProperties$2, collectEvaluatedItems: collectEvaluatedItems$3 };

			const { Core: Core$h, Schema: Schema$i } = lib$2;


			const compile$6 = async (ref, ast) => {
			  const referencedSchema = await Schema$i.get(Schema$i.value(ref), ref);
			  return Core$h.compileSchema(referencedSchema, ast);
			};

			const interpret$6 = Core$h.interpretSchema;
			const collectEvaluatedProperties$1 = Core$h.collectEvaluatedProperties;
			const collectEvaluatedItems$2 = Core$h.collectEvaluatedItems;

			var ref$1 = { compile: compile$6, interpret: interpret$6, collectEvaluatedProperties: collectEvaluatedProperties$1, collectEvaluatedItems: collectEvaluatedItems$2 };

			const { Schema: Schema$h, Instance: Instance$5 } = lib$2;


			const compile$5 = (schema) => Schema$h.value(schema);

			const interpret$5 = (required, instance) => {
			  return !Instance$5.typeOf(instance, "object") || required.every((propertyName) => Object.prototype.hasOwnProperty.call(Instance$5.value(instance), propertyName));
			};

			var required = { compile: compile$5, interpret: interpret$5 };

			const { Core: Core$g, Schema: Schema$g, Instance: Instance$4 } = lib$2;
			const Pact = lib$3;


			const compile$4 = (schema, ast) => {
			  return Pact.pipeline([
			    Schema$g.map((itemSchema) => Core$g.compileSchema(itemSchema, ast)),
			    Pact.all
			  ], schema);
			};

			const interpret$4 = (items, instance, ast, dynamicAnchors) => {
			  if (!Instance$4.typeOf(instance, "array")) {
			    return true;
			  }

			  return Instance$4.every((item, ndx) => !(ndx in items) || Core$g.interpretSchema(items[ndx], item, ast, dynamicAnchors), instance);
			};

			const collectEvaluatedItems$1 = (items, instance, ast, dynamicAnchors) => {
			  return interpret$4(items, instance, ast, dynamicAnchors) && new Set(items.map((item, ndx) => ndx));
			};

			var tupleItems$1 = { compile: compile$4, interpret: interpret$4, collectEvaluatedItems: collectEvaluatedItems$1 };

			const { Schema: Schema$f, Instance: Instance$3 } = lib$2;


			const compile$3 = (schema) => Schema$f.value(schema);
			const interpret$3 = (type, instance) => typeof type === "string" ? Instance$3.typeOf(instance, type) : type.some(Instance$3.typeOf(instance));

			var type = { compile: compile$3, interpret: interpret$3 };

			const { Core: Core$f, Schema: Schema$e, Instance: Instance$2 } = lib$2;


			const compile$2 = async (schema, ast, parentSchema) => {
			  return [Schema$e.uri(parentSchema), await Core$f.compileSchema(schema, ast)];
			};

			const interpret$2 = ([schemaUrl, unevaluatedItems], instance, ast, dynamicAnchors) => {
			  if (!Instance$2.typeOf(instance, "array")) {
			    return true;
			  }

			  const itemIndexes = Core$f.collectEvaluatedItems(schemaUrl, instance, ast, dynamicAnchors, true);
			  return itemIndexes === false || Instance$2.every((item, itemIndex) => {
			    return itemIndexes.has(itemIndex) || Core$f.interpretSchema(unevaluatedItems, Instance$2.step(itemIndex, instance), ast, dynamicAnchors);
			  }, instance);
			};

			const collectEvaluatedItems = (keywordValue, instance, ast, dynamicAnchors) => {
			  return interpret$2(keywordValue, instance, ast, dynamicAnchors) && new Set(Instance$2.map((item, ndx) => ndx, instance));
			};

			var unevaluatedItems$1 = { compile: compile$2, interpret: interpret$2, collectEvaluatedItems };

			const { Core: Core$e, Schema: Schema$d, Instance: Instance$1 } = lib$2;


			const compile$1 = async (schema, ast, parentSchema) => {
			  return [Schema$d.uri(parentSchema), await Core$e.compileSchema(schema, ast)];
			};

			const interpret$1 = ([schemaUrl, unevaluatedProperties], instance, ast, dynamicAnchors) => {
			  if (!Instance$1.typeOf(instance, "object")) {
			    return true;
			  }

			  const evaluatedPropertyNames = Core$e.collectEvaluatedProperties(schemaUrl, instance, ast, dynamicAnchors, true);

			  return !evaluatedPropertyNames || Instance$1.entries(instance)
			    .filter(([propertyName]) => !evaluatedPropertyNames.some((pattern) => propertyName.match(pattern)))
			    .every(([, property]) => Core$e.interpretSchema(unevaluatedProperties, property, ast, dynamicAnchors));
			};

			const collectEvaluatedProperties = (keywordValue, instance, ast, dynamicAnchors) =>{
			  return interpret$1(keywordValue, instance, ast, dynamicAnchors) && [new RegExp("")];
			};

			var unevaluatedProperties$1 = { compile: compile$1, interpret: interpret$1, collectEvaluatedProperties };

			const { Schema: Schema$c, Instance } = lib$2;
			const jsonStringify = fastestStableStringify;


			const compile = (schema) => Schema$c.value(schema);

			const interpret = (uniqueItems, instance) => {
			  if (!Instance.typeOf(instance, "array") || uniqueItems === false) {
			    return true;
			  }

			  const normalizedItems = Instance.map((item) => jsonStringify(Instance.value(item)), instance);
			  return new Set(normalizedItems).size === normalizedItems.length;
			};

			var uniqueItems = { compile, interpret };

			const { Keywords: Keywords$6 } = lib$2;


			var keywords$6 = {
			  additionalItems: additionalItems$1,
			  additionalItems6: additionalItems6$1,
			  additionalProperties: additionalProperties$1,
			  additionalProperties6: additionalProperties6$1,
			  allOf: allOf$1,
			  anyOf: anyOf$1,
			  const: _const,
			  contains: contains$1,
			  containsMinContainsMaxContains: containsMinContainsMaxContains$1,
			  definitions: definitions,
			  dependencies: dependencies$1,
			  dependentRequired: dependentRequired,
			  dependentSchemas: dependentSchemas$1,
			  enum: _enum,
			  exclusiveMaximum: exclusiveMaximum,
			  exclusiveMinimum: exclusiveMinimum,
			  if: _if,
			  then: then$1,
			  else: _else,
			  items: items$1,
			  items202012: items202012$1,
			  maxItems: maxItems,
			  maxLength: maxLength,
			  maxLength6: maxLength6,
			  maxProperties: maxProperties,
			  maximumExclusiveMaximum: maximumExclusiveMaximum,
			  maximum: maximum,
			  metaData: Keywords$6.metaData,
			  minItems: minItems,
			  minLength: minLength,
			  minLength6: minLength6,
			  minProperties: minProperties,
			  minimumExclusiveMinimum: minimumExclusiveMinimum,
			  minimum: minimum,
			  multipleOf: multipleOf,
			  not: not$1,
			  oneOf: oneOf$1,
			  pattern: pattern,
			  patternProperties: patternProperties$1,
			  properties: properties$1,
			  propertyNames: propertyNames$1,
			  dynamicRef: dynamicRef,
			  ref: ref$1,
			  required: required,
			  tupleItems: tupleItems$1,
			  type: type,
			  unevaluatedItems: unevaluatedItems$1,
			  unevaluatedProperties: unevaluatedProperties$1,
			  uniqueItems: uniqueItems,
			  validate: Keywords$6.validate
			};

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

			const { Core: Core$d, Schema: Schema$b } = lib$2;
			const keywords$5 = keywords$6;
			const metaSchema$4 = schema$4;


			// JSON Schema Draft-04
			const schemaVersion$4 = "http://json-schema.org/draft-04/schema";

			Schema$b.setConfig(schemaVersion$4, "baseToken", "id");
			Schema$b.setConfig(schemaVersion$4, "embeddedToken", "id");
			Schema$b.setConfig(schemaVersion$4, "anchorToken", "id");
			Schema$b.setConfig(schemaVersion$4, "jrefToken", "$ref");

			Schema$b.add(JSON.parse(metaSchema$4));
			Core$d.defineVocabulary(schemaVersion$4, {
			  "validate": keywords$5.validate,
			  "additionalItems": keywords$5.additionalItems,
			  "additionalProperties": keywords$5.additionalProperties,
			  "allOf": keywords$5.allOf,
			  "anyOf": keywords$5.anyOf,
			  "default": keywords$5.metaData,
			  "definitions": keywords$5.definitions,
			  "dependencies": keywords$5.dependencies,
			  "description": keywords$5.metaData,
			  "enum": keywords$5.enum,
			  "format": keywords$5.metaData,
			  "items": keywords$5.items,
			  "maxItems": keywords$5.maxItems,
			  "maxLength": keywords$5.maxLength,
			  "maxProperties": keywords$5.maxProperties,
			  "maximum": keywords$5.maximumExclusiveMaximum,
			  "minItems": keywords$5.minItems,
			  "minLength": keywords$5.minLength,
			  "minProperties": keywords$5.minProperties,
			  "minimum": keywords$5.minimumExclusiveMinimum,
			  "multipleOf": keywords$5.multipleOf,
			  "not": keywords$5.not,
			  "oneOf": keywords$5.oneOf,
			  "pattern": keywords$5.pattern,
			  "patternProperties": keywords$5.patternProperties,
			  "properties": keywords$5.properties,
			  "required": keywords$5.required,
			  "title": keywords$5.metaData,
			  "type": keywords$5.type,
			  "uniqueItems": keywords$5.uniqueItems
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

			const { Core: Core$c, Schema: Schema$a } = lib$2;
			const keywords$4 = keywords$6;
			const metaSchema$3 = schema$3;


			const schemaVersion$3 = "http://json-schema.org/draft-06/schema";

			Schema$a.setConfig(schemaVersion$3, "baseToken", "$id");
			Schema$a.setConfig(schemaVersion$3, "embeddedToken", "$id");
			Schema$a.setConfig(schemaVersion$3, "anchorToken", "$id");
			Schema$a.setConfig(schemaVersion$3, "jrefToken", "$ref");

			Schema$a.add(JSON.parse(metaSchema$3));
			Core$c.defineVocabulary(schemaVersion$3, {
			  "validate": keywords$4.validate,
			  "additionalItems": keywords$4.additionalItems6,
			  "additionalProperties": keywords$4.additionalProperties6,
			  "allOf": keywords$4.allOf,
			  "anyOf": keywords$4.anyOf,
			  "const": keywords$4.const,
			  "contains": keywords$4.contains,
			  "default": keywords$4.metaData,
			  "definitions": keywords$4.definitions,
			  "dependencies": keywords$4.dependencies,
			  "description": keywords$4.metaData,
			  "enum": keywords$4.enum,
			  "examples": keywords$4.metaData,
			  "exclusiveMaximum": keywords$4.exclusiveMaximum,
			  "exclusiveMinimum": keywords$4.exclusiveMinimum,
			  "format": keywords$4.metaData,
			  "items": keywords$4.items,
			  "maxItems": keywords$4.maxItems,
			  "maxLength": keywords$4.maxLength6,
			  "maxProperties": keywords$4.maxProperties,
			  "maximum": keywords$4.maximum,
			  "minItems": keywords$4.minItems,
			  "minLength": keywords$4.minLength6,
			  "minProperties": keywords$4.minProperties,
			  "minimum": keywords$4.minimum,
			  "multipleOf": keywords$4.multipleOf,
			  "not": keywords$4.not,
			  "oneOf": keywords$4.oneOf,
			  "pattern": keywords$4.pattern,
			  "patternProperties": keywords$4.patternProperties,
			  "properties": keywords$4.properties,
			  "propertyNames": keywords$4.propertyNames,
			  "required": keywords$4.required,
			  "title": keywords$4.metaData,
			  "type": keywords$4.type,
			  "uniqueItems": keywords$4.uniqueItems
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

			const { Core: Core$b, Schema: Schema$9 } = lib$2;
			const keywords$3 = keywords$6;
			const metaSchema$2 = schema$2;


			const schemaVersion$2 = "http://json-schema.org/draft-07/schema";

			Schema$9.setConfig(schemaVersion$2, "baseToken", "$id");
			Schema$9.setConfig(schemaVersion$2, "embeddedToken", "$id");
			Schema$9.setConfig(schemaVersion$2, "anchorToken", "$id");
			Schema$9.setConfig(schemaVersion$2, "jrefToken", "$ref");

			Schema$9.add(JSON.parse(metaSchema$2));
			Core$b.defineVocabulary(schemaVersion$2, {
			  "validate": keywords$3.validate,
			  "additionalItems": keywords$3.additionalItems6,
			  "additionalProperties": keywords$3.additionalProperties6,
			  "allOf": keywords$3.allOf,
			  "anyOf": keywords$3.anyOf,
			  "const": keywords$3.const,
			  "contains": keywords$3.contains,
			  "default": keywords$3.metaData,
			  "definitions": keywords$3.definitions,
			  "dependencies": keywords$3.dependencies,
			  "description": keywords$3.metaData,
			  "enum": keywords$3.enum,
			  "exclusiveMaximum": keywords$3.exclusiveMaximum,
			  "exclusiveMinimum": keywords$3.exclusiveMinimum,
			  "format": keywords$3.metaData,
			  "if": keywords$3.if,
			  "then": keywords$3.then,
			  "else": keywords$3.else,
			  "items": keywords$3.items,
			  "maxItems": keywords$3.maxItems,
			  "maxLength": keywords$3.maxLength6,
			  "maxProperties": keywords$3.maxProperties,
			  "maximum": keywords$3.maximum,
			  "minItems": keywords$3.minItems,
			  "minLength": keywords$3.minLength6,
			  "minProperties": keywords$3.minProperties,
			  "minimum": keywords$3.minimum,
			  "multipleOf": keywords$3.multipleOf,
			  "not": keywords$3.not,
			  "oneOf": keywords$3.oneOf,
			  "pattern": keywords$3.pattern,
			  "patternProperties": keywords$3.patternProperties,
			  "properties": keywords$3.properties,
			  "propertyNames": keywords$3.propertyNames,
			  "readOnly": keywords$3.metaData,
			  "required": keywords$3.required,
			  "title": keywords$3.metaData,
			  "type": keywords$3.type,
			  "uniqueItems": keywords$3.uniqueItems,
			  "writeOnly": keywords$3.metaData
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

			var core$2 = `{
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

			const { Core: Core$a, Schema: Schema$8 } = lib$2;
			const keywords$2 = keywords$6;
			const metaSchema$1 = schema$1;
			const coreMetaSchema$1 = core$2;
			const applicatorMetaSchema$1 = applicator$1;
			const validationMetaSchema$1 = validation$1;
			const metaDataMetaSchema$1 = metaData$1;
			const formatMetaSchema = format;
			const contentMetaSchema$1 = content$1;


			const schemaVersion$1 = "https://json-schema.org/draft/2019-09/schema";

			Schema$8.setConfig(schemaVersion$1, "baseToken", "$id");
			Schema$8.setConfig(schemaVersion$1, "embeddedToken", "$id");
			Schema$8.setConfig(schemaVersion$1, "anchorToken", "$anchor");
			Schema$8.setConfig(schemaVersion$1, "recursiveAnchorToken", "$recursiveAnchor");
			Schema$8.setConfig(schemaVersion$1, "vocabularyToken", "$vocabulary");
			Schema$8.setConfig(schemaVersion$1, "mandatoryVocabularies", ["https://json-schema.org/draft/2019-09/vocab/core"]);

			Schema$8.add(JSON.parse(metaSchema$1));

			Schema$8.add(JSON.parse(coreMetaSchema$1));
			Core$a.defineVocabulary("https://json-schema.org/draft/2019-09/vocab/core", {
			  "validate": keywords$2.validate,
			  "$defs": keywords$2.definitions,
			  "$recursiveRef": keywords$2.dynamicRef,
			  "$ref": keywords$2.ref
			});

			Schema$8.add(JSON.parse(applicatorMetaSchema$1));
			Core$a.defineVocabulary("https://json-schema.org/draft/2019-09/vocab/applicator", {
			  "additionalItems": keywords$2.additionalItems6,
			  "additionalProperties": keywords$2.additionalProperties6,
			  "allOf": keywords$2.allOf,
			  "anyOf": keywords$2.anyOf,
			  "contains": keywords$2.containsMinContainsMaxContains,
			  "dependentSchemas": keywords$2.dependentSchemas,
			  "if": keywords$2.if,
			  "then": keywords$2.then,
			  "else": keywords$2.else,
			  "items": keywords$2.items,
			  "not": keywords$2.not,
			  "oneOf": keywords$2.oneOf,
			  "patternProperties": keywords$2.patternProperties,
			  "properties": keywords$2.properties,
			  "propertyNames": keywords$2.propertyNames,
			  "unevaluatedItems": keywords$2.unevaluatedItems,
			  "unevaluatedProperties": keywords$2.unevaluatedProperties
			});

			Schema$8.add(JSON.parse(validationMetaSchema$1));
			Core$a.defineVocabulary("https://json-schema.org/draft/2019-09/vocab/validation", {
			  "const": keywords$2.const,
			  "dependentRequired": keywords$2.dependentRequired,
			  "enum": keywords$2.enum,
			  "exclusiveMaximum": keywords$2.exclusiveMaximum,
			  "exclusiveMinimum": keywords$2.exclusiveMinimum,
			  "maxItems": keywords$2.maxItems,
			  "maxLength": keywords$2.maxLength6,
			  "maxProperties": keywords$2.maxProperties,
			  "maximum": keywords$2.maximum,
			  "minItems": keywords$2.minItems,
			  "minLength": keywords$2.minLength6,
			  "minProperties": keywords$2.minProperties,
			  "minimum": keywords$2.minimum,
			  "multipleOf": keywords$2.multipleOf,
			  "pattern": keywords$2.pattern,
			  "required": keywords$2.required,
			  "type": keywords$2.type,
			  "uniqueItems": keywords$2.uniqueItems
			});

			Schema$8.add(JSON.parse(metaDataMetaSchema$1));
			Core$a.defineVocabulary("https://json-schema.org/draft/2019-09/vocab/meta-data", {
			  "default": keywords$2.metaData,
			  "deprecated": keywords$2.metaData,
			  "description": keywords$2.metaData,
			  "examples": keywords$2.metaData,
			  "readOnly": keywords$2.metaData,
			  "title": keywords$2.metaData,
			  "writeOnly": keywords$2.metaData
			});

			Schema$8.add(JSON.parse(formatMetaSchema));

			Schema$8.add(JSON.parse(contentMetaSchema$1));
			Core$a.defineVocabulary("https://json-schema.org/draft/2019-09/vocab/content", {
			  "contentEncoding": keywords$2.metaData,
			  "contentMediaType": keywords$2.metaData,
			  "contentSchema": keywords$2.metaData
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

			var core$1 = `{
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

			const { Core: Core$9, Schema: Schema$7 } = lib$2;
			const keywords$1 = keywords$6;
			const metaSchema = schema;
			const coreMetaSchema = core$1;
			const applicatorMetaSchema = applicator;
			const validationMetaSchema = validation;
			const metaDataMetaSchema = metaData;
			const formatAnnotationMetaSchema = formatAnnotation;
			const formatAssertionMetaSchema = formatAssertion;
			const contentMetaSchema = content;
			const unevaluatedMetaSchema = unevaluated;


			const schemaVersion = "https://json-schema.org/draft/2020-12/schema";

			Schema$7.setConfig(schemaVersion, "baseToken", "$id");
			Schema$7.setConfig(schemaVersion, "embeddedToken", "$id");
			Schema$7.setConfig(schemaVersion, "anchorToken", "$anchor");
			Schema$7.setConfig(schemaVersion, "dynamicAnchorToken", "$dynamicAnchor");
			Schema$7.setConfig(schemaVersion, "vocabularyToken", "$vocabulary");
			Schema$7.setConfig(schemaVersion, "mandatoryVocabularies", ["https://json-schema.org/draft/2020-12/vocab/core"]);

			Schema$7.add(JSON.parse(metaSchema));

			Schema$7.add(JSON.parse(coreMetaSchema));
			Core$9.defineVocabulary("https://json-schema.org/draft/2020-12/vocab/core", {
			  "validate": keywords$1.validate,
			  "$defs": keywords$1.definitions,
			  "$dynamicRef": keywords$1.dynamicRef,
			  "$ref": keywords$1.ref
			});

			Schema$7.add(JSON.parse(applicatorMetaSchema));
			Core$9.defineVocabulary("https://json-schema.org/draft/2020-12/vocab/applicator", {
			  "additionalProperties": keywords$1.additionalProperties6,
			  "allOf": keywords$1.allOf,
			  "anyOf": keywords$1.anyOf,
			  "contains": keywords$1.containsMinContainsMaxContains,
			  "dependentSchemas": keywords$1.dependentSchemas,
			  "if": keywords$1.if,
			  "then": keywords$1.then,
			  "else": keywords$1.else,
			  "items": keywords$1.items202012,
			  "not": keywords$1.not,
			  "oneOf": keywords$1.oneOf,
			  "patternProperties": keywords$1.patternProperties,
			  "prefixItems": keywords$1.tupleItems,
			  "properties": keywords$1.properties,
			  "propertyNames": keywords$1.propertyNames
			});

			Schema$7.add(JSON.parse(validationMetaSchema));
			Core$9.defineVocabulary("https://json-schema.org/draft/2020-12/vocab/validation", {
			  "const": keywords$1.const,
			  "dependentRequired": keywords$1.dependentRequired,
			  "enum": keywords$1.enum,
			  "exclusiveMaximum": keywords$1.exclusiveMaximum,
			  "exclusiveMinimum": keywords$1.exclusiveMinimum,
			  "maxItems": keywords$1.maxItems,
			  "maxLength": keywords$1.maxLength6,
			  "maxProperties": keywords$1.maxProperties,
			  "maximum": keywords$1.maximum,
			  "minItems": keywords$1.minItems,
			  "minLength": keywords$1.minLength6,
			  "minProperties": keywords$1.minProperties,
			  "minimum": keywords$1.minimum,
			  "multipleOf": keywords$1.multipleOf,
			  "pattern": keywords$1.pattern,
			  "required": keywords$1.required,
			  "type": keywords$1.type,
			  "uniqueItems": keywords$1.uniqueItems
			});

			Schema$7.add(JSON.parse(metaDataMetaSchema));
			Core$9.defineVocabulary("https://json-schema.org/draft/2020-12/vocab/meta-data", {
			  "default": keywords$1.metaData,
			  "deprecated": keywords$1.metaData,
			  "description": keywords$1.metaData,
			  "examples": keywords$1.metaData,
			  "readOnly": keywords$1.metaData,
			  "title": keywords$1.metaData,
			  "writeOnly": keywords$1.metaData
			});

			Schema$7.add(JSON.parse(formatAnnotationMetaSchema));
			Core$9.defineVocabulary("https://json-schema.org/draft/2020-12/vocab/format-annotation", {
			  "format": keywords$1.metaData
			});

			Schema$7.add(JSON.parse(formatAssertionMetaSchema));

			Schema$7.add(JSON.parse(contentMetaSchema));
			Core$9.defineVocabulary("https://json-schema.org/draft/2020-12/vocab/content", {
			  "contentEncoding": keywords$1.metaData,
			  "contentMediaType": keywords$1.metaData,
			  "contentSchema": keywords$1.metaData
			});

			Schema$7.add(JSON.parse(unevaluatedMetaSchema));
			Core$9.defineVocabulary("https://json-schema.org/draft/2020-12/vocab/unevaluated", {
			  "unevaluatedItems": keywords$1.unevaluatedItems,
			  "unevaluatedProperties": keywords$1.unevaluatedProperties
			});

			const { Core: Core$8, Schema: Schema$6, InvalidSchemaError: InvalidSchemaError$1 } = lib$2;
			const Keywords$5 = keywords$6;








			var lib$1 = {
			  add: Core$8.add,
			  get: Schema$6.get,
			  validate: Core$8.validate,
			  compile: Core$8.compile,
			  interpret: Core$8.interpret,
			  setMetaOutputFormat: Core$8.setMetaOutputFormat,
			  setShouldMetaValidate: Core$8.setShouldMetaValidate,
			  FLAG: Core$8.FLAG,
			  BASIC: Core$8.BASIC,
			  DETAILED: Core$8.DETAILED,
			  VERBOSE: Core$8.VERBOSE,
			  Keywords: Keywords$5,
			  InvalidSchemaError: InvalidSchemaError$1
			};

			const splitUri$2 = (url) => {
			  const indexOfHash = url.indexOf("#");
			  const ndx = indexOfHash === -1 ? url.length : indexOfHash;
			  const urlReference = url.slice(0, ndx);
			  const urlFragment = url.slice(ndx + 1);

			  return [decodeURI(urlReference), decodeURI(urlFragment)];
			};

			var common = { splitUri: splitUri$2 };

			const { Core: Core$7 } = lib$2;
			const { splitUri: splitUri$1 } = common;


			const collectExternalIds = (schemaUri, externalIds, ast, dynamicAnchors) => {
			  const keywordId = ast[schemaUri][0];
			  const id = splitUri$1(schemaUri)[0];
			  Core$7.getKeyword(keywordId).collectExternalIds(schemaUri, externalIds, ast, { ...ast.metaData[id].dynamicAnchors, ...dynamicAnchors });
			};

			var core = { collectExternalIds };

			const JsonSchema$6 = lib$1;
			const { Core: Core$6 } = lib$2;
			const Bundle$1 = core;


			const validate = {
			  ...JsonSchema$6.Keywords.validate,
			  collectExternalIds: (schemaUri, externalIds, ast, dynamicAnchors) => {
			    const nodes = ast[schemaUri][2];
			    if (externalIds.has(schemaUri) || typeof nodes === "boolean") {
			      return;
			    }
			    externalIds.add(schemaUri);

			    for (const [keywordId, , keywordValue] of nodes) {
			      const keyword = Core$6.getKeyword(keywordId);

			      if (keyword.collectExternalIds) {
			        keyword.collectExternalIds(keywordValue, externalIds, ast, dynamicAnchors);
			      }
			    }
			  }
			};

			const ref = {
			  ...JsonSchema$6.Keywords.ref,
			  collectExternalIds: Bundle$1.collectExternalIds
			};

			const additionalItems = {
			  ...JsonSchema$6.Keywords.additionalItems,
			  collectExternalIds: ([, additionalItems], externalIds, ast, dynamicAnchors) => {
			    if (typeof additionalItems === "string") {
			      Bundle$1.collectExternalIds(additionalItems, externalIds, ast, dynamicAnchors);
			    }
			  }
			};

			const additionalProperties = {
			  ...JsonSchema$6.Keywords.additionalProperties,
			  collectExternalIds: ([, , additionalProperties], externalIds, ast, dynamicAnchors) => {
			    if (typeof additionalProperties === "string") {
			      Bundle$1.collectExternalIds(additionalProperties, externalIds, ast, dynamicAnchors);
			    }
			  }
			};

			const additionalItems6 = {
			  ...JsonSchema$6.Keywords.additionalItems6,
			  collectExternalIds: ([, additionalItems], externalIds, ast, dynamicAnchors) => {
			    Bundle$1.collectExternalIds(additionalItems, externalIds, ast, dynamicAnchors);
			  }
			};

			const additionalProperties6 = {
			  ...JsonSchema$6.Keywords.additionalProperties6,
			  collectExternalIds: ([, , additionalProperties], externalIds, ast, dynamicAnchors) => {
			    Bundle$1.collectExternalIds(additionalProperties, externalIds, ast, dynamicAnchors);
			  }
			};

			const allOf = {
			  ...JsonSchema$6.Keywords.allOf,
			  collectExternalIds: (allOf, externalIds, ast, dynamicAnchors) => {
			    allOf.forEach((schemaUri) => Bundle$1.collectExternalIds(schemaUri, externalIds, ast, dynamicAnchors));
			  }
			};

			const anyOf = {
			  ...JsonSchema$6.Keywords.anyOf,
			  collectExternalIds: (anyOf, externalIds, ast, dynamicAnchors) => {
			    anyOf.forEach((schemaUri) => Bundle$1.collectExternalIds(schemaUri, externalIds, ast, dynamicAnchors));
			  }
			};

			const contains = {
			  ...JsonSchema$6.Keywords.contains,
			  collectExternalIds: Bundle$1.collectExternalIds
			};

			const containsMinContainsMaxContains = {
			  ...JsonSchema$6.Keywords.containsMinContainsMaxContains,
			  collectExternalIds: ({ contains }, externalIds, ast, dynamicAnchors) => {
			    Bundle$1.collectExternalIds(contains, externalIds, ast, dynamicAnchors);
			  }
			};

			const dependencies = {
			  ...JsonSchema$6.Keywords.dependencies,
			  collectExternalIds: (dependentSchemas, externalIds, ast, dynamicAnchors) => {
			    Object.values(dependentSchemas).forEach(([, dependency]) => {
			      if (typeof dependency === "string") {
			        Bundle$1.collectExternalIds(dependency, externalIds, ast, dynamicAnchors);
			      }
			    });
			  }
			};

			const dependentSchemas = {
			  ...JsonSchema$6.Keywords.dependentSchemas,
			  collectExternalIds: (dependentSchemas, externalIds, ast, dynamicAnchors) => {
			    Object.values(dependentSchemas).forEach(([, schemaUri]) => Bundle$1.collectExternalIds(schemaUri, externalIds, ast, dynamicAnchors));
			  }
			};

			const if_ = {
			  ...JsonSchema$6.Keywords.if,
			  collectExternalIds: Bundle$1.collectExternalIds
			};

			const then = {
			  ...JsonSchema$6.Keywords.then,
			  collectExternalIds: ([, then], externalIds, ast, dynamicAnchors) => {
			    Bundle$1.collectExternalIds(then, externalIds, ast, dynamicAnchors);
			  }
			};

			const else_ = {
			  ...JsonSchema$6.Keywords.else,
			  collectExternalIds: ([, elseSchema], externalIds, ast, dynamicAnchors) => {
			    Bundle$1.collectExternalIds(elseSchema, externalIds, ast, dynamicAnchors);
			  }
			};

			const items = {
			  ...JsonSchema$6.Keywords.items,
			  collectExternalIds: (items, externalIds, ast, dynamicAnchors) => {
			    if (typeof items === "string") {
			      Bundle$1.collectExternalIds(items, externalIds, ast, dynamicAnchors);
			    } else {
			      items.forEach((schemaUri) => Bundle$1.collectExternalIds(schemaUri, externalIds, ast, dynamicAnchors));
			    }
			  }
			};

			const items202012 = {
			  ...JsonSchema$6.Keywords.items202012,
			  collectExternalIds: ([, items], externalIds, ast, dynamicAnchors) => {
			    Bundle$1.collectExternalIds(items, externalIds, ast, dynamicAnchors);
			  }
			};

			const not = {
			  ...JsonSchema$6.Keywords.not,
			  collectExternalIds: Bundle$1.collectExternalIds
			};

			const oneOf = {
			  ...JsonSchema$6.Keywords.oneOf,
			  collectExternalIds: (oneOf, externalIds, ast, dynamicAnchors) => {
			    oneOf.forEach((schemaUri) => Bundle$1.collectExternalIds(schemaUri, externalIds, ast, dynamicAnchors));
			  }
			};

			const patternProperties = {
			  ...JsonSchema$6.Keywords.patternProperties,
			  collectExternalIds: (patternProperties, externalIds, ast, dynamicAnchors) => {
			    patternProperties.forEach(([, schemaUri]) => Bundle$1.collectExternalIds(schemaUri, externalIds, ast, dynamicAnchors));
			  }
			};

			const tupleItems = {
			  ...JsonSchema$6.Keywords.tupleItems,
			  collectExternalIds: (tupleItems, externalIds, ast, dynamicAnchors) => {
			    tupleItems.forEach((schemaUri) => Bundle$1.collectExternalIds(schemaUri, externalIds, ast, dynamicAnchors));
			  }
			};

			const properties = {
			  ...JsonSchema$6.Keywords.properties,
			  collectExternalIds: (properties, externalIds, ast, dynamicAnchors) => {
			    Object.values(properties).forEach((schemaUri) => Bundle$1.collectExternalIds(schemaUri, externalIds, ast, dynamicAnchors));
			  }
			};

			const propertyNames = {
			  ...JsonSchema$6.Keywords.propertyNames,
			  collectExternalIds: Bundle$1.collectExternalIds
			};

			const unevaluatedItems = {
			  ...JsonSchema$6.Keywords.unevaluatedItems,
			  collectExternalIds: ([, unevaluatedItems], externalIds, ast, dynamicAnchors) => {
			    Bundle$1.collectExternalIds(unevaluatedItems, externalIds, ast, dynamicAnchors);
			  }
			};

			const unevaluatedProperties = {
			  ...JsonSchema$6.Keywords.unevaluatedProperties,
			  collectExternalIds: ([, unevaluatedProperties], externalIds, ast, dynamicAnchors) => {
			    Bundle$1.collectExternalIds(unevaluatedProperties, externalIds, ast, dynamicAnchors);
			  }
			};

			var keywords = {
			  validate,
			  ref,
			  additionalItems,
			  additionalItems6,
			  additionalProperties,
			  additionalProperties6,
			  allOf,
			  anyOf,
			  contains,
			  containsMinContainsMaxContains,
			  dependencies,
			  dependentSchemas,
			  if: if_,
			  then,
			  else: else_,
			  items,
			  items202012,
			  not,
			  oneOf,
			  patternProperties,
			  tupleItems,
			  properties,
			  propertyNames,
			  unevaluatedItems,
			  unevaluatedProperties
			};

			const JsonSchema$5 = lib$1;
			const { Core: Core$5, Schema: Schema$5 } = lib$2;
			const Keywords$4 = keywords;


			Schema$5.setConfig("http://json-schema.org/draft-04/schema", "bundlingLocation", "/definitions");

			Core$5.defineVocabulary("http://json-schema.org/draft-04/schema", {
			  "validate": Keywords$4.validate,
			  "additionalItems": Keywords$4.additionalItems,
			  "additionalProperties": Keywords$4.additionalProperties,
			  "allOf": Keywords$4.allOf,
			  "anyOf": Keywords$4.anyOf,
			  "default": JsonSchema$5.Keywords.metaData,
			  "definitions": JsonSchema$5.Keywords.definitions,
			  "dependencies": Keywords$4.dependencies,
			  "description": JsonSchema$5.Keywords.metaData,
			  "enum": JsonSchema$5.Keywords.enum,
			  "format": JsonSchema$5.Keywords.metaData,
			  "items": Keywords$4.items,
			  "maxItems": JsonSchema$5.Keywords.maxItems,
			  "maxLength": JsonSchema$5.Keywords.maxLength,
			  "maxProperties": JsonSchema$5.Keywords.maxProperties,
			  "maximum": JsonSchema$5.Keywords.maximumExclusiveMaximum,
			  "minItems": JsonSchema$5.Keywords.minItems,
			  "minLength": JsonSchema$5.Keywords.minLength,
			  "minProperties": JsonSchema$5.Keywords.minProperties,
			  "minimum": JsonSchema$5.Keywords.minimumExclusiveMinimum,
			  "multipleOf": JsonSchema$5.Keywords.multipleOf,
			  "not": Keywords$4.not,
			  "oneOf": Keywords$4.oneOf,
			  "pattern": JsonSchema$5.Keywords.pattern,
			  "patternProperties": Keywords$4.patternProperties,
			  "properties": Keywords$4.properties,
			  "required": JsonSchema$5.Keywords.required,
			  "title": JsonSchema$5.Keywords.metaData,
			  "type": JsonSchema$5.Keywords.type,
			  "uniqueItems": JsonSchema$5.Keywords.uniqueItems
			});

			const JsonSchema$4 = lib$1;
			const { Core: Core$4, Schema: Schema$4 } = lib$2;
			const Keywords$3 = keywords;


			Schema$4.setConfig("http://json-schema.org/draft-06/schema", "bundlingLocation", "/definitions");

			Core$4.defineVocabulary("http://json-schema.org/draft-06/schema", {
			  "validate": Keywords$3.validate,
			  "additionalItems": Keywords$3.additionalItems6,
			  "additionalProperties": Keywords$3.additionalProperties6,
			  "allOf": Keywords$3.allOf,
			  "anyOf": Keywords$3.anyOf,
			  "const": JsonSchema$4.Keywords.const,
			  "contains": Keywords$3.contains,
			  "default": JsonSchema$4.Keywords.metaData,
			  "definitions": JsonSchema$4.Keywords.definitions,
			  "dependencies": Keywords$3.dependencies,
			  "description": JsonSchema$4.Keywords.metaData,
			  "enum": JsonSchema$4.Keywords.enum,
			  "examples": JsonSchema$4.Keywords.metaData,
			  "exclusiveMaximum": JsonSchema$4.Keywords.exclusiveMaximum,
			  "exclusiveMinimum": JsonSchema$4.Keywords.exclusiveMinimum,
			  "format": JsonSchema$4.Keywords.metaData,
			  "items": Keywords$3.items,
			  "maxItems": JsonSchema$4.Keywords.maxItems,
			  "maxLength": JsonSchema$4.Keywords.maxLength6,
			  "maxProperties": JsonSchema$4.Keywords.maxProperties,
			  "maximum": JsonSchema$4.Keywords.maximum,
			  "minItems": JsonSchema$4.Keywords.minItems,
			  "minLength": JsonSchema$4.Keywords.minLength6,
			  "minProperties": JsonSchema$4.Keywords.minProperties,
			  "minimum": JsonSchema$4.Keywords.minimum,
			  "multipleOf": JsonSchema$4.Keywords.multipleOf,
			  "not": Keywords$3.not,
			  "oneOf": Keywords$3.oneOf,
			  "pattern": JsonSchema$4.Keywords.pattern,
			  "patternProperties": Keywords$3.patternProperties,
			  "properties": Keywords$3.properties,
			  "propertyNames": Keywords$3.propertyNames,
			  "required": JsonSchema$4.Keywords.required,
			  "title": JsonSchema$4.Keywords.metaData,
			  "type": JsonSchema$4.Keywords.type,
			  "uniqueItems": JsonSchema$4.Keywords.uniqueItems
			});

			const JsonSchema$3 = lib$1;
			const { Core: Core$3, Schema: Schema$3 } = lib$2;
			const Keywords$2 = keywords;


			Schema$3.setConfig("http://json-schema.org/draft-07/schema", "bundlingLocation", "/definitions");

			Core$3.defineVocabulary("http://json-schema.org/draft-07/schema", {
			  "validate": Keywords$2.validate,
			  "additionalItems": Keywords$2.additionalItems6,
			  "additionalProperties": Keywords$2.additionalProperties6,
			  "allOf": Keywords$2.allOf,
			  "anyOf": Keywords$2.anyOf,
			  "const": JsonSchema$3.Keywords.const,
			  "contains": Keywords$2.contains,
			  "default": JsonSchema$3.Keywords.metaData,
			  "definitions": JsonSchema$3.Keywords.definitions,
			  "dependencies": Keywords$2.dependencies,
			  "description": JsonSchema$3.Keywords.metaData,
			  "enum": JsonSchema$3.Keywords.enum,
			  "exclusiveMaximum": JsonSchema$3.Keywords.exclusiveMaximum,
			  "exclusiveMinimum": JsonSchema$3.Keywords.exclusiveMinimum,
			  "format": JsonSchema$3.Keywords.metaData,
			  "if": Keywords$2.if,
			  "then": Keywords$2.then,
			  "else": Keywords$2.else,
			  "items": Keywords$2.items,
			  "maxItems": JsonSchema$3.Keywords.maxItems,
			  "maxLength": JsonSchema$3.Keywords.maxLength6,
			  "maxProperties": JsonSchema$3.Keywords.maxProperties,
			  "maximum": JsonSchema$3.Keywords.maximum,
			  "minItems": JsonSchema$3.Keywords.minItems,
			  "minLength": JsonSchema$3.Keywords.minLength6,
			  "minProperties": JsonSchema$3.Keywords.minProperties,
			  "minimum": JsonSchema$3.Keywords.minimum,
			  "multipleOf": JsonSchema$3.Keywords.multipleOf,
			  "not": Keywords$2.not,
			  "oneOf": Keywords$2.oneOf,
			  "pattern": JsonSchema$3.Keywords.pattern,
			  "patternProperties": Keywords$2.patternProperties,
			  "properties": Keywords$2.properties,
			  "propertyNames": Keywords$2.propertyNames,
			  "readOnly": JsonSchema$3.Keywords.metaData,
			  "required": JsonSchema$3.Keywords.required,
			  "title": JsonSchema$3.Keywords.metaData,
			  "type": JsonSchema$3.Keywords.type,
			  "uniqueItems": JsonSchema$3.Keywords.uniqueItems,
			  "writeOnly": JsonSchema$3.Keywords.metaData
			});

			const JsonSchema$2 = lib$1;
			const { Core: Core$2, Schema: Schema$2 } = lib$2;
			const Keywords$1 = keywords;


			Schema$2.setConfig("https://json-schema.org/draft/2019-09/schema", "bundlingLocation", "/$defs");

			Core$2.defineVocabulary("https://json-schema.org/draft/2019-09/vocab/core", {
			  "validate": Keywords$1.validate,
			  "$defs": JsonSchema$2.Keywords.definitions,
			  "$recursiveRef": JsonSchema$2.Keywords.dynamicRef,
			  "$ref": Keywords$1.ref
			});

			Core$2.defineVocabulary("https://json-schema.org/draft/2019-09/vocab/applicator", {
			  "additionalItems": Keywords$1.additionalItems6,
			  "additionalProperties": Keywords$1.additionalProperties6,
			  "allOf": Keywords$1.allOf,
			  "anyOf": Keywords$1.anyOf,
			  "contains": Keywords$1.containsMinContainsMaxContains,
			  "dependentSchemas": Keywords$1.dependentSchemas,
			  "if": Keywords$1.if,
			  "then": Keywords$1.then,
			  "else": Keywords$1.else,
			  "items": Keywords$1.items,
			  "not": Keywords$1.not,
			  "oneOf": Keywords$1.oneOf,
			  "patternProperties": Keywords$1.patternProperties,
			  "properties": Keywords$1.properties,
			  "propertyNames": Keywords$1.propertyNames,
			  "unevaluatedItems": Keywords$1.unevaluatedItems,
			  "unevaluatedProperties": Keywords$1.unevaluatedProperties
			});

			const JsonSchema$1 = lib$1;
			const { Core: Core$1, Schema: Schema$1 } = lib$2;
			const Keywords = keywords;


			Schema$1.setConfig("https://json-schema.org/draft/2020-12/schema", "bundlingLocation", "/$defs");

			Core$1.defineVocabulary("https://json-schema.org/draft/2020-12/vocab/core", {
			  "validate": Keywords.validate,
			  "$defs": JsonSchema$1.Keywords.definitions,
			  "$dynamicRef": JsonSchema$1.Keywords.dynamicRef,
			  "$ref": Keywords.ref
			});

			Core$1.defineVocabulary("https://json-schema.org/draft/2020-12/vocab/applicator", {
			  "additionalProperties": Keywords.additionalProperties6,
			  "allOf": Keywords.allOf,
			  "anyOf": Keywords.anyOf,
			  "contains": Keywords.containsMinContainsMaxContains,
			  "dependentSchemas": Keywords.dependentSchemas,
			  "if": Keywords.if,
			  "then": Keywords.then,
			  "else": Keywords.else,
			  "items": Keywords.items202012,
			  "not": Keywords.not,
			  "oneOf": Keywords.oneOf,
			  "patternProperties": Keywords.patternProperties,
			  "prefixItems": Keywords.tupleItems,
			  "properties": Keywords.properties,
			  "propertyNames": Keywords.propertyNames
			});

			Core$1.defineVocabulary("https://json-schema.org/draft/2020-12/vocab/unevaluated", {
			  "unevaluatedItems": Keywords.unevaluatedItems,
			  "unevaluatedProperties": Keywords.unevaluatedProperties
			});

			const { v4: uuid } = require$$0;
			const JsonSchema = lib$1;
			const JsonPointer = lib$4;
			const { Core, Schema, InvalidSchemaError } = lib$2;
			const Bundle = core;
			const { splitUri } = common;








			const FULL = "full";
			const FLAT = "flat";
			const URI = "uri";
			const UUID = "uuid";

			const defaultOptions = {
			  alwaysIncludeDialect: false,
			  bundleMode: FLAT,
			  definitionNamingStrategy: URI
			};

			const bundle = async (schemaDoc, options = {}) => {
			  const fullOptions = { ...defaultOptions, ...options };

			  const { ast, schemaUri } = await Core.compile(schemaDoc);
			  const subSchemaUris = new Set();
			  Bundle.collectExternalIds(schemaUri, subSchemaUris, ast, {});
			  const externalIds = new Set([...subSchemaUris].map((uri) => splitUri(uri)[0]));
			  externalIds.delete(schemaDoc.id);

			  const bundled = Schema.toSchema(schemaDoc, {
			    includeEmbedded: fullOptions.bundleMode === FULL
			  });

			  const bundlingLocation = Schema.getConfig(schemaDoc.schemaVersion, "bundlingLocation");
			  if (JsonPointer.get(bundlingLocation, bundled) === undefined && externalIds.size > 0) {
			    JsonPointer.assign(bundlingLocation, bundled, {});
			  }

			  for (const uri of externalIds.values()) {
			    const externalSchema = await JsonSchema.get(uri);
			    const embeddedSchema = Schema.toSchema(externalSchema, {
			      parentId: schemaDoc.id,
			      parentDialect: fullOptions.alwaysIncludeDialect ? "" : schemaDoc.schemaVersion,
			      includeEmbedded: fullOptions.bundleMode === FULL
			    });
			    let id;
			    if (fullOptions.definitionNamingStrategy === URI) {
			      const embeddedToken = Schema.getConfig(externalSchema.schemaVersion, "embeddedToken");
			      id = embeddedSchema[embeddedToken];
			    } else if (fullOptions.definitionNamingStrategy === UUID) {
			      id = uuid();
			    } else {
			      throw Error(`Unknown definition naming stragety: ${fullOptions.definitionNamingStrategy}`);
			    }
			    const pointer = JsonPointer.append(id, bundlingLocation);
			    JsonPointer.assign(pointer, bundled, embeddedSchema);
			  }

			  return bundled;
			};

			var lib = exports('default', {
			  add: JsonSchema.add,
			  get: Schema.get,
			  bundle: bundle,
			  FULL: FULL,
			  FLAT: FLAT,
			  URI: URI,
			  UUID: UUID,
			  setMetaOutputFormat: Core.setMetaOutputFormat,
			  setShouldMetaValidate: Core.setShouldMetaValidate,
			  FLAG: Core.FLAG,
			  BASIC: Core.BASIC,
			  DETAILED: Core.DETAILED,
			  VERBOSE: Core.VERBOSE,
			  InvalidSchemaError: InvalidSchemaError
			});

		})
	};
}));
//# sourceMappingURL=json-schema-bundler-system.js.map
