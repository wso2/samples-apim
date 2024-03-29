# url-resolve-browser

This module resolves URLs like node.js's `url.resolve` but works in the browser.  Other modules exist to fulfill this purpose but they do so by creating html elements, adding them to the page, then removing them.  This module is purely JavaScript.

### Install:

`npm i url-resolve-browser --save`

### Usage:

```javascript
const urlResolve = require('url-resolve-browser');
urlResolve(base, relative);
```

Where base is a net path (`http://example.com`) with the optional pieces of query (`?query=query&two=....`) and/or hash (`#location`) and relative is a either a net path, absolute path (`/absolute/path`) or a relative path (`relative/path`) and can also contain the query and/or hash like before.

### Details:

This module is NOT the same as node.js' url.resolve as it requires the first argument to be a net path. Also, This module does not do any URL encoding (E.G. { => %7B).

The logic for this module was primarily derived from the following document: [Link](https://tools.ietf.org/html/rfc1808)

### Running tests
1. Clone the repo.
1. Change to directory
1. npm i
1. npm test

### Contributing:

Contributions are welcome, either extending functionality or fixing issues.  In order to contribute please make an issue detailing what you would like to change so we can discuss it then a PR can be made either by the reported or someone else (whomever would like to).
