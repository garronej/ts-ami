import { Base64 } from "js-base64";

const lineMaxByteLength= 1024;
const safeOffsetBytes= Buffer.byteLength("Variable: A_VERY_LONG_VARIABLE_NAME_TO_BE_REALLY_SAFE=" + "\r\n")

function splitStep(
    nByte: number,
    text: string,
    encodeFunction: (str: string) => string
): [string, string] {

    for (let index = 0; index < text.length; index++) {

        if (Buffer.byteLength(encodeFunction(text.substring(0, index + 1))) > nByte) {

            if (index === 0) throw new Error("nByte to small to split this string with this encoding");

            return [encodeFunction(text.substring(0, index)), text.substring(index, text.length)];

        }

    }

    return [encodeFunction(text), ""];

}


function performSplit(
    maxByte: number,
    text: string,
    encodingFunction: (str: string) => string
): string[] {

    function callee(state: string[], rest: string): string[] {

        if (!rest) return state;

        let [encodedPart, newRest] = splitStep(maxByte, rest, encodingFunction);

        state.push(encodedPart);

        return callee(state, newRest);

    }

    return callee([], text);

}



function textSplitWithByteOffset(
    text: string,
    encodeFunction: (str: string) => string,
    maxBytePerPart: number,
    offsetBytes?: number
): string[] {

    if (typeof (offsetBytes) === "number")
        maxBytePerPart = maxBytePerPart - offsetBytes;

    return performSplit(maxBytePerPart, text, encodeFunction);

}


export function textSplit(
    text: string,
    encodeFunction: (str: string) => string
): string[] {

    return textSplitWithByteOffset(
        text,
        encodeFunction,
        lineMaxByteLength - 1,
        safeOffsetBytes
    );

}

export function base64TextSplit( text: string ): string[] {

    return textSplit( text, Base64.encode );

}