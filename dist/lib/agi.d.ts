import { Ami } from "./Ami";
import { AGIChannel as _AGIChannel_ } from "ts-async-agi";
export declare type AGIChannel = _AGIChannel_;
/** Like { "from-sip": { "_[+0-9].": ...}} */
export declare type Scripts = {
    [context: string]: {
        [extensionPattern: string]: (channel: AGIChannel) => Promise<void>;
    };
};
export declare function start(ami: Ami, scripts: Scripts, defaultScript?: (channel: AGIChannel) => Promise<void>, onError?: (severity: "ERROR" | "WARNING", message: string, error: Error) => void): Promise<void>;
