
export function b64Enc(str: string): string {
    return (new Buffer(str,"utf8")).toString("base64");
}

export function b64Dec(enc: string): string {
    return (new Buffer(enc,"base64")).toString("utf8");
}

/** 
 * Assuming there is an index n in [ 0 ... lastIndex ] such as
 * for all i <= n condition(i) is true
 * and for all i > n condition(i) is false
 * this function find n
 */
function findLastIndexFulfilling(
    condition: (index: number)=> boolean,
    lastIndex: number
) {

    if( lastIndex < 0 ){
        throw Error("range error");
    }

    if ( !condition(0) ) {
        throw Error("no index fullfil the condition");
    }

    return (function callee(fromIndex, toIndex) {

        if (fromIndex === toIndex) {

            return fromIndex;

        } else if (fromIndex + 1 === toIndex) {

            if( condition(toIndex) ){
                return toIndex;
            }else{
                return fromIndex;
            }

        } else {

            let length = toIndex - fromIndex + 1;
            let halfLength = Math.floor(length / 2);
            let middleIndex = fromIndex + halfLength;

            if (condition(middleIndex)) {

                return callee(middleIndex, toIndex);

            } else {

                return callee(fromIndex, middleIndex);

            }
        }

    })(0, lastIndex);

}

export function b64crop(partMaxLength: number, text: string): string {

    let isNotTooLong = (index: number): boolean => {

        let part = text.substring(0, index);

        let encPart = b64Enc(part);

        return encPart.length <= partMaxLength;

    }

    //99.9% of the cases for SMS
    if (isNotTooLong(text.length)) {
        return b64Enc(text.substring(0, text.length));
    }

    let index = findLastIndexFulfilling(isNotTooLong, text.length);

    while (true) {

        let part = text.substring(0, index);

        let rest = text.substring(index, text.length);

        if ((b64Dec(b64Enc(part)) + b64Dec(b64Enc(rest))) !== b64Dec(b64Enc(text))) {
            index--;
        } else {
            return b64Enc(`${part}[...]`);
        }

    }

}

export function textSplit(partMaxLength: number, text: string): string[] {

    let parts: string[] = [];

    let rest = text;

    while (rest) {

        if (partMaxLength >= rest.length) {
            parts.push(rest);
            rest = "";
        } else {
            parts.push(rest.substring(0, partMaxLength));
            rest = rest.substring(partMaxLength, rest.length);
        }

    }

    return parts;


}

export function b64Split(
    partMaxLength: number,
    text: string,
): string[] {
    return textSplit(partMaxLength, b64Enc(text));
}


export function b64Unsplit(encodedParts: string[]): string {
    return b64Dec(encodedParts.join(""));
}
