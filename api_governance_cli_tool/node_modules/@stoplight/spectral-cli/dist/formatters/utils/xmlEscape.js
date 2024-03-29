"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.xmlEscape = void 0;
const xmlEscape = (s) => {
    return `${s}`.replace(/[<>&"'\x00-\x1F\x7F\u0080-\uFFFF]/gu, c => {
        switch (c) {
            case '<':
                return '&lt;';
            case '>':
                return '&gt;';
            case '&':
                return '&amp;';
            case '"':
                return '&quot;';
            case "'":
                return '&apos;';
            default:
                return `&#${c.charCodeAt(0)};`;
        }
    });
};
exports.xmlEscape = xmlEscape;
//# sourceMappingURL=xmlEscape.js.map