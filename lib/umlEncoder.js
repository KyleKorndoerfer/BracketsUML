/*jslint bitwise: true, vars: true */
/* Taken from http://plantuml.sourceforge.net/codejavascript2.html */
/* Wrapped as a require module for easier use */
define(function (require, exports, module) {
    "use strict";

    var zipDeflate = require("./zipDeflate");

    var encode6bit = function (b) {
        if (b < 10) {
            return String.fromCharCode(48 + b);
        }

        b -= 10;
        if (b < 26) {
            return String.fromCharCode(65 + b);
        }

        b -= 26;
        if (b < 26) {
            return String.fromCharCode(97 + b);
        }

        b -= 26;
        if (b === 0) {
            return '-';
        }

        if (b === 1) {
            return '_';
        }

        return '?';
    };// encode6bit(b)

    var append3bytes = function (b1, b2, b3) {
        var c1 = b1 >> 2,
            c2 = ((b1 & 0x3) << 4) | (b2 >> 4),
            c3 = ((b2 & 0xF) << 2) | (b3 >> 6),
            c4 = b3 & 0x3F,
            r = "";

        r += encode6bit(c1 & 0x3F);
        r += encode6bit(c2 & 0x3F);
        r += encode6bit(c3 & 0x3F);
        r += encode6bit(c4 & 0x3F);

        return r;
    };// append3bytes(b1,b2,b3)

    var encode64 = function (data) {
        var r = "",
            i;

        for (i = 0; i < data.length; i += 3) {
            if (i + 2 === data.length) {
                r += append3bytes(data.charCodeAt(i), data.charCodeAt(i + 1), 0);
            } else if (i + 1 === data.length) {
                r += append3bytes(data.charCodeAt(i), 0, 0);
            } else {
                r += append3bytes(data.charCodeAt(i), data.charCodeAt(i + 1), data.charCodeAt(i + 2));
            }
        }

        return r;
    };// encode64(data)

    var compress = function (s) {
        s = unescape(encodeURIComponent(s)); //UTF8
        return encode64(zipDeflate.deflate(s, 9));
    };// compress(s)

    // Exports only the ompress function
    exports.compress = compress;
});
