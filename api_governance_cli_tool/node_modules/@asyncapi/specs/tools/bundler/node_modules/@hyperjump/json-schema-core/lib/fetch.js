const fs = require("fs");
const fetch = require("node-fetch");
const Url = require("url");


module.exports = (url, options) => {
  if (url.startsWith("file://")) {
    const path = Url.fileURLToPath(url);
    const stream = fs.createReadStream(path);
    return new fetch.Response(stream);
  } else {
    return fetch(url, options);
  }
};
