"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
var js_base64_1 = require("js-base64");
var lineMaxByteLength = 1024;
function splitStep(nByte, text, encodeFunction) {
    for (var index = 0; index < text.length; index++) {
        if (Buffer.byteLength(encodeFunction(text.substring(0, index + 1))) > nByte) {
            if (index === 0)
                throw new Error("nByte to small to split this string with this encoding");
            return [encodeFunction(text.substring(0, index)), text.substring(index, text.length)];
        }
    }
    return [encodeFunction(text), ""];
}
function performSplit(maxByte, text, encodingFunction) {
    function callee(state, rest) {
        if (!rest)
            return state;
        var _a = __read(splitStep(maxByte, rest, encodingFunction), 2), encodedPart = _a[0], newRest = _a[1];
        state.push(encodedPart);
        return callee(state, newRest);
    }
    return callee([], text);
}
function textSplitWithByteOffset(text, encodeFunction, maxBytePerPart, offsetByte) {
    if (typeof (offsetByte) === "number")
        maxBytePerPart = maxBytePerPart - offsetByte;
    return performSplit(maxBytePerPart, text, encodeFunction);
}
function textSplit(text, encodeFunction, key) {
    return textSplitWithByteOffset(text, encodeFunction, lineMaxByteLength - 1, Buffer.byteLength(key + ": \r\n"));
}
exports.textSplit = textSplit;
function base64TextSplit(text, key) {
    return textSplit(text, js_base64_1.Base64.encode, key);
}
exports.base64TextSplit = base64TextSplit;
//# sourceMappingURL=textSplit.js.map