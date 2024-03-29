"use strict";
var _Tree_importDeclarations, _Tree_npmRegistry, _Tree_module, _Tree_resolvedPaths;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tree = exports.Scope = void 0;
const tslib_1 = require("tslib");
const ast_types_1 = require("ast-types");
const path = (0, tslib_1.__importStar)(require("@stoplight/path"));
const astring = (0, tslib_1.__importStar)(require("astring"));
const commonjs_1 = require("./commonjs");
const esm_1 = require("./esm");
const requireResolve_1 = (0, tslib_1.__importDefault)(require("../requireResolve"));
const scope_1 = require("./scope");
Object.defineProperty(exports, "Scope", { enumerable: true, get: function () { return scope_1.Scope; } });
const isPackageImport_1 = require("../utils/isPackageImport");
const isKnownNpmRegistry_1 = require("../utils/isKnownNpmRegistry");
function sortImports([sourceA], [sourceB]) {
    if (sourceA.startsWith('@stoplight/')) {
        return sourceB.startsWith('@stoplight/') ? sourceA.localeCompare(sourceB) : -1;
    }
    else if (sourceB.startsWith('@stoplight/')) {
        return 1;
    }
    return sourceA.localeCompare(sourceB);
}
function sortMembers({ imported: importedA }, { imported: importedB }) {
    return importedA.name.localeCompare(importedB.name);
}
class Tree {
    constructor({ format, npmRegistry, scope }) {
        _Tree_importDeclarations.set(this, new Map());
        _Tree_npmRegistry.set(this, void 0);
        _Tree_module.set(this, void 0);
        _Tree_resolvedPaths.set(this, new Set());
        this.scope = scope;
        (0, tslib_1.__classPrivateFieldSet)(this, _Tree_npmRegistry, npmRegistry !== null && npmRegistry !== void 0 ? npmRegistry : null, "f");
        (0, tslib_1.__classPrivateFieldSet)(this, _Tree_module, format === 'commonjs' ? commonjs_1.commonjs : esm_1.esm, "f");
        if (format === 'commonjs' && (0, tslib_1.__classPrivateFieldGet)(this, _Tree_npmRegistry, "f") !== null) {
            throw new Error(`'npmRegistry' option must not be used with commonjs output format.`);
        }
    }
    addImport(specifier, source, _default = false) {
        const existingImportDeclaration = (0, tslib_1.__classPrivateFieldGet)(this, _Tree_importDeclarations, "f").get(source);
        const scope = source.startsWith('@stoplight/') ? this.scope.global : this.scope;
        if (existingImportDeclaration === void 0) {
            const identifier = Tree.identifier(specifier, scope);
            (0, tslib_1.__classPrivateFieldGet)(this, _Tree_importDeclarations, "f").set(source, [
                { imported: ast_types_1.builders.identifier(specifier), local: identifier, default: _default },
            ]);
            return identifier;
        }
        else {
            for (const declaration of existingImportDeclaration) {
                if (declaration.imported.name === specifier) {
                    return declaration.local;
                }
            }
            const identifier = Tree.identifier(specifier, scope);
            existingImportDeclaration.push({ imported: ast_types_1.builders.identifier(specifier), local: identifier, default: _default });
            return identifier;
        }
    }
    toString() {
        if (this.ruleset === void 0) {
            throw new ReferenceError('Ruleset not assigned');
        }
        (0, tslib_1.__classPrivateFieldGet)(this, _Tree_module, "f").dependencies.clear();
        return astring.generate(ast_types_1.builders.program([
            ...Array.from((0, tslib_1.__classPrivateFieldGet)(this, _Tree_importDeclarations, "f").entries())
                .sort(sortImports)
                .flatMap(([source, identifiers]) => {
                const resolvedSource = (0, tslib_1.__classPrivateFieldGet)(this, _Tree_npmRegistry, "f") !== null && !(0, tslib_1.__classPrivateFieldGet)(this, _Tree_resolvedPaths, "f").has(source) && !source.startsWith((0, tslib_1.__classPrivateFieldGet)(this, _Tree_npmRegistry, "f"))
                    ? path.join((0, tslib_1.__classPrivateFieldGet)(this, _Tree_npmRegistry, "f"), source)
                    : source;
                const nonDefault = identifiers.filter(({ default: _default }) => !_default).sort(sortMembers);
                return [
                    ...(nonDefault.length > 0
                        ? [
                            (0, tslib_1.__classPrivateFieldGet)(this, _Tree_module, "f").importDeclaration(nonDefault.map(({ imported, local }) => [imported, local]), resolvedSource),
                        ]
                        : []),
                    ...identifiers
                        .filter(({ default: _default }) => _default)
                        .flatMap(({ local }) => (0, tslib_1.__classPrivateFieldGet)(this, _Tree_module, "f").importDefaultDeclaration(local, resolvedSource)),
                ];
            }),
            (0, tslib_1.__classPrivateFieldGet)(this, _Tree_module, "f").exportDefaultDeclaration(this.ruleset),
            ...(0, tslib_1.__classPrivateFieldGet)(this, _Tree_module, "f").dependencies,
        ]));
    }
    static identifier(name, scope) {
        const baseName = name.replace(/[^$_0-9A-Za-z]/g, '').replace(/^([0-9])/, '_$1');
        let uniqName = baseName;
        let i = 0;
        while (scope.has(uniqName)) {
            uniqName = `${baseName}$${i++}`;
        }
        scope.add(uniqName);
        return ast_types_1.builders.identifier(uniqName);
    }
    resolveModule(identifier, ctx, kind) {
        var _a;
        let resolved;
        if (path.isURL(identifier) || path.isAbsolute(identifier)) {
            resolved = identifier;
            (0, tslib_1.__classPrivateFieldGet)(this, _Tree_resolvedPaths, "f").add(identifier);
        }
        else if ((ctx.npmRegistry !== null && ctx.filepath.startsWith(ctx.npmRegistry)) ||
            (0, isKnownNpmRegistry_1.isKnownNpmRegistry)(ctx.filepath)) {
            resolved = path.join(ctx.filepath, identifier);
        }
        else if (kind === 'ruleset' && !path.isURL(ctx.filepath) && (0, isPackageImport_1.isPackageImport)(identifier)) {
            resolved =
                ctx.npmRegistry !== null
                    ? path.join(ctx.npmRegistry, identifier)
                    : (_a = requireResolve_1.default === null || requireResolve_1.default === void 0 ? void 0 : (0, requireResolve_1.default)(identifier, { paths: [ctx.cwd] })) !== null && _a !== void 0 ? _a : path.join(ctx.cwd, identifier);
        }
        else {
            resolved = path.join(ctx.filepath, '..', identifier);
            (0, tslib_1.__classPrivateFieldGet)(this, _Tree_resolvedPaths, "f").add(resolved);
        }
        return resolved;
    }
    fork() {
        const scope = this.scope.fork();
        return new Proxy(this, {
            get: (target, prop) => {
                if (prop === 'scope') {
                    return scope;
                }
                const value = Reflect.get(target, prop, target);
                if (typeof value === 'function') {
                    return value.bind(target);
                }
                return value;
            },
        });
    }
}
exports.Tree = Tree;
_Tree_importDeclarations = new WeakMap(), _Tree_npmRegistry = new WeakMap(), _Tree_module = new WeakMap(), _Tree_resolvedPaths = new WeakMap();
//# sourceMappingURL=index.js.map