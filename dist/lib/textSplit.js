"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function b64Enc(str) {
    return (new Buffer(str, "utf8")).toString("base64");
}
exports.b64Enc = b64Enc;
function b64Dec(enc) {
    return (new Buffer(enc, "base64")).toString("utf8");
}
exports.b64Dec = b64Dec;
/**
 * Assuming there is an index n in [ 0 ... lastIndex ] such as
 * for all i <= n condition(i) is true
 * and for all i > n condition(i) is false
 * this function find n
 */
function findLastIndexFulfilling(condition, lastIndex) {
    if (lastIndex < 0) {
        throw Error("range error");
    }
    if (!condition(0)) {
        throw Error("no index fullfil the condition");
    }
    return (function callee(fromIndex, toIndex) {
        if (fromIndex === toIndex) {
            return fromIndex;
        }
        else if (fromIndex + 1 === toIndex) {
            if (condition(toIndex)) {
                return toIndex;
            }
            else {
                return fromIndex;
            }
        }
        else {
            var length = toIndex - fromIndex + 1;
            var halfLength = Math.floor(length / 2);
            var middleIndex = fromIndex + halfLength;
            if (condition(middleIndex)) {
                return callee(middleIndex, toIndex);
            }
            else {
                return callee(fromIndex, middleIndex);
            }
        }
    })(0, lastIndex);
}
function b64crop(partMaxLength, text) {
    var isNotTooLong = function (index) {
        var part = text.substring(0, index);
        var encPart = b64Enc(part);
        return encPart.length <= partMaxLength;
    };
    //99.9% of the cases for SMS
    if (isNotTooLong(text.length)) {
        return b64Enc(text.substring(0, text.length));
    }
    var index = findLastIndexFulfilling(isNotTooLong, text.length);
    while (true) {
        var part = text.substring(0, index);
        var rest = text.substring(index, text.length);
        if ((b64Dec(b64Enc(part)) + b64Dec(b64Enc(rest))) !== b64Dec(b64Enc(text))) {
            index--;
        }
        else {
            return b64Enc(part + "[...]");
        }
    }
}
exports.b64crop = b64crop;
function textSplit(partMaxLength, text) {
    var parts = [];
    var rest = text;
    while (rest) {
        if (partMaxLength >= rest.length) {
            parts.push(rest);
            rest = "";
        }
        else {
            parts.push(rest.substring(0, partMaxLength));
            rest = rest.substring(partMaxLength, rest.length);
        }
    }
    return parts;
}
exports.textSplit = textSplit;
function b64Split(partMaxLength, text) {
    return textSplit(partMaxLength, b64Enc(text));
}
exports.b64Split = b64Split;
function b64Unsplit(encodedParts) {
    return b64Dec(encodedParts.join(""));
}
exports.b64Unsplit = b64Unsplit;
