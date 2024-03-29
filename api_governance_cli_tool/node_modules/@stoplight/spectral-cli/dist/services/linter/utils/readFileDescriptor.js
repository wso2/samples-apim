"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readFileDescriptor = void 0;
const tslib_1 = require("tslib");
const fs = (0, tslib_1.__importStar)(require("fs"));
async function readFileDescriptor(fd, opts) {
    let result = '';
    const stream = fs.createReadStream('', { fd });
    stream.setEncoding(opts.encoding);
    stream.on('readable', () => {
        let chunk;
        while ((chunk = stream.read()) !== null) {
            result += chunk;
        }
    });
    return new Promise((resolve, reject) => {
        stream.on('error', reject);
        stream.on('end', () => {
            resolve(result);
        });
    });
}
exports.readFileDescriptor = readFileDescriptor;
//# sourceMappingURL=readFileDescriptor.js.map