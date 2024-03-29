# Hyperjump - JSON Schema Bundle

JSON Schema Bundle (JSB) is an implementation of the official JSON Schema
bundling process introduced in the Draft 2020-12 specification. Given a schema
with external references, any external schemas will be embedded in the schema
resulting in a Compound Schema Document with all the schemas necessary to
evaluate the given schema.

The bundling process allows schemas to be embedded without needing to modify any
references which means you get the same output details whether you validate the
bundle or the original unbundled schemas.

JSON Schema Bundle (JSB) is built on [JSON Schema Core](https://github.com/hyperjump-io/json-schema-core).

* Supported JSON Schema Dialects
  * draft-04 | draft-06 | draft-07 | Draft 2019-09 | Draft 2020-12
  * Support for custom dialects can be configured
* Schemas can reference other schemas using a different draft
* Load schemas from filesystem (file://), network (http(s)://), or JavaScript

## Install
JSB includes support for node.js JavaScript (CommonJS and ES Modules),
TypeScript, and browsers.

### Node.js
```bash
npm install @hyperjump/json-schema-bundle
```

### Browser
When in a browser context, JSB is designed to use the browser's `fetch`
implementation instead of a node.js fetch clone. The Webpack bundler does this
properly without any extra configuration, but if you are using the Rollup
bundler you will need to include the `browser: true` option in your Rollup
configuration.

```javascript
  plugins: [
    resolve({
      browser: true
    }),
    commonjs()
  ]
```

### Versioning
This project is in beta and there may be breaking changes at any time. When it's
stable enough, I'll publish v1.0.0 and follow semantic versioning from there on
out.

## Usage
```javascript
const Bundler = require("@hyperjump/json-schema-bundle");


// Optionally load schema manually
Bundler.add({
  "$id": "https://json-schema.hyperjump.io/schemas/string",
  "$schema": "https://json-schema.org/draft/2020-12/schema",

  "type": "string"
});

// Get the initial schema to pass to the bundler
const main = await Bundler.get(`file://${__dirname}/schemas/main.schema.json`);

// The bundler will fetch from the file system, network, or internal schemas as
// needed to build to bundle.
const bundle = await Bundler.bundle(main);
```

## TypeScript
Although the package is written in JavaScript, type definitions are included for
TypeScript support. The following example shows the types you might want to
know.

```typescript
import Bundler from "@hyperjump/json-schema-bundle";
import type { SchemaDocument, Draft202012Schema, InvalidSchemaError } from "@hyperjump/json-schema-bundle";


(async function () {
  const schemaJson: Draft202012Schema = {
    "$id": "https://json-schema.hyperjump.io/schemas/string",
    "$schema": "https://json-schema.org/draft/2020-12/schema",

    "type": "string"
  };
  Bundler.add(schemaJson);

  try {
    const main: SchemaDocument = await Bundler.get(`file://${__dirname}/schemas/main.schema.json`);
    const bundle: Draft202012Schema = await Bundler.bundle(main);
    console.log(JSON.stringify(bundle, null, "  "));
  } catch (error: unknown) {
    if (error instanceof InvalidSchemaError) {
      console.log(error.output);
    } else {
      console.log(error);
    }
  }
}());
```

## API
* **add**: (schema: object, url?: URI, schemaVersion?: string) => SDoc

    Load a schema. See [JSC - $id](https://github.com/hyperjump-io/json-schema-core#id)
    and [JSC - $schema](https://github.com/hyperjump-io/json-schema-core#schema-1)
    for more information.
* **get**: (url: URI, contextDoc?: SDoc, recursive: boolean = false) => Promise\<SDoc>

    Fetch a schema. Schemas can come from an HTTP request, a file, or a schema
    that was added with `add`.
* **bundle**: (schema: SDoc, options: Options) => Promise\<SchemaObject>

    Create a bundled schema starting with the given schema. External schemas
    will be fetched from the filesystem, the network, or internally as needed.

    Options:
     * alwaysIncludeDialect: boolean (default: false) -- Include dialect even
       when it isn't strictly needed
     * bundleMode: "flat" | "full" (default: "flat") -- When bundling schemas
       that already contain bundled schemas, "flat" mode with remove nested
       embedded schemas and put them all in the top level `$defs`. When using
       "full" mode, it will keep the already embedded schemas around, which will
       result in some embedded schema duplication.
     * definitionNamingStrategy: "uri" | "uuid" (default: "uri") -- By default
       the name used in definitions for embedded schemas will match the
       identifier of the embedded schema. This naming is unlikely to collide
       with actual definitions, but if you want to be sure, you can use the
       "uuid" strategy instead to be sure you get a unique name.
* **setMetaOutputFormat**: (outputFormat: OutputFormat = DETAILED) => undefined

    Set the output format for meta-validation. Meta-validation output is only
    returned if meta-validation results in an error.
* **setShouldMetaValidate**: (isEnabled: boolean) => undefined

    Enable or disable meta-validation.
* **OutputFormat**: [**FLAG** | **BASIC** | **DETAILED** | **VERBOSE**]

    See [JSC - Output](https://github.com/hyperjump-io/json-schema-core#output)
    for more information on output formats.

## Contributing

### Tests

Run the tests

```bash
npm test
```

Run the tests with a continuous test runner

```bash
npm test -- --watch
```
