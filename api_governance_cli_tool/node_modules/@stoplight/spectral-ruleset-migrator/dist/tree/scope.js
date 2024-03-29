"use strict";
var _Scope_parentScope, _Scope_uniqueIdentifiers, _Scope_aliases;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scope = void 0;
const tslib_1 = require("tslib");
const reserved_1 = (0, tslib_1.__importDefault)(require("reserved"));
const REGISTERED_WORDS = [
    ...reserved_1.default,
    'await',
    'require',
    'module',
    '__dirname',
    '__filename',
    '_interopDefault',
];
let i = 0;
class Scope {
    constructor(parentScope = null) {
        _Scope_parentScope.set(this, void 0);
        _Scope_uniqueIdentifiers.set(this, void 0);
        _Scope_aliases.set(this, void 0);
        this.id = i++;
        (0, tslib_1.__classPrivateFieldSet)(this, _Scope_parentScope, parentScope, "f");
        (0, tslib_1.__classPrivateFieldSet)(this, _Scope_uniqueIdentifiers, parentScope === null ? new Set(REGISTERED_WORDS) : new Set(), "f");
        (0, tslib_1.__classPrivateFieldSet)(this, _Scope_aliases, new Map(), "f");
    }
    get global() {
        return (0, tslib_1.__classPrivateFieldGet)(this, _Scope_parentScope, "f") === null ? this : (0, tslib_1.__classPrivateFieldGet)(this, _Scope_parentScope, "f").global;
    }
    has(local) {
        var _a, _b;
        return (_b = (_a = (0, tslib_1.__classPrivateFieldGet)(this, _Scope_parentScope, "f")) === null || _a === void 0 ? void 0 : _a.has(local)) !== null && _b !== void 0 ? _b : (0, tslib_1.__classPrivateFieldGet)(this, _Scope_uniqueIdentifiers, "f").has(local);
    }
    add(imported) {
        var _a;
        (0, tslib_1.__classPrivateFieldGet)(this, _Scope_uniqueIdentifiers, "f").add(imported);
        (_a = (0, tslib_1.__classPrivateFieldGet)(this, _Scope_parentScope, "f")) === null || _a === void 0 ? void 0 : _a.add(imported);
    }
    store(name, imported) {
        (0, tslib_1.__classPrivateFieldGet)(this, _Scope_aliases, "f").set(name, imported);
    }
    load(name) {
        return (0, tslib_1.__classPrivateFieldGet)(this, _Scope_aliases, "f").get(name);
    }
    fork() {
        return new Scope(this);
    }
}
exports.Scope = Scope;
_Scope_parentScope = new WeakMap(), _Scope_uniqueIdentifiers = new WeakMap(), _Scope_aliases = new WeakMap();
//# sourceMappingURL=scope.js.map