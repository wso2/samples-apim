"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPackageImport = void 0;
const tslib_1 = require("tslib");
const validate_npm_package_name_1 = (0, tslib_1.__importDefault)(require("validate-npm-package-name"));
const isValidPackageName = (packageName) => (0, validate_npm_package_name_1.default)(packageName).validForNewPackages;
const isPackageImport = (packageName) => {
    const fragments = packageName.split('/');
    if (packageName.startsWith('@') && fragments.length >= 2) {
        fragments.splice(0, 2, `${fragments[0]}/${fragments[1]}`);
    }
    return fragments.every(isValidPackageName);
};
exports.isPackageImport = isPackageImport;
//# sourceMappingURL=isPackageImport.js.map