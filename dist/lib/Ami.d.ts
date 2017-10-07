import { SyncEvent } from "ts-events-extended";
import { Credential } from "./Credential";
import * as api from "./apiTransport";
export declare class Ami {
    private static instance;
    static readonly hasInstance: boolean;
    static getInstance(asteriskManagerUser?: string, asteriskConfigRoot?: string): Ami;
    static getInstance(asteriskManagerCredential: Credential): Ami;
    disconnect(): Promise<void>;
    startApiServer(): api.AmiApiServer;
    startApiClient(): api.AmiApiClient;
    static generateUniqueActionId(): string;
    readonly connection: any;
    readonly evt: SyncEvent<Ami.ManagerEvent>;
    readonly evtUserEvent: SyncEvent<Ami.UserEvent>;
    private isFullyBooted;
    readonly credential: Credential;
    constructor(asteriskManagerUser?: string, asteriskConfigRoot?: string);
    constructor(asteriskManagerCredential: Credential);
    lastActionId: string;
    userEvent(userEvent: {
        userevent: Ami.UserEvent['userevent'];
        actionid?: Ami.UserEvent['actionid'];
        [key: string]: string | undefined;
    }): Promise<void>;
    postAction(action: string, headers: Ami.Headers): Promise<any>;
    messageSend(to: string, from: string, body: string, packetHeaders?: Record<string, string>): Promise<void>;
    setVar(variable: string, value: string, channel?: string): Promise<void>;
    getVar(variable: string, channel?: string): Promise<string>;
    dialplanExtensionAdd(context: string, extension: string, priority: number | string, application: string, applicationData?: string, replace?: boolean): Promise<void>;
    runCliCommand(cliCommand: string): Promise<string>;
    dialplanExtensionRemove(context: string, extension: string, priority?: number | string): Promise<boolean>;
    removeContext(context: string): Promise<string>;
    originateLocalChannel(context: string, extension: string, channelVariables?: Record<string, string>): Promise<boolean>;
}
export declare namespace Ami {
    type ManagerEvent = {
        event: string;
        privilege: string;
        [header: string]: string;
    };
    type UserEvent = {
        userevent: string;
        actionid: string;
        [key: string]: string | undefined;
    };
    type Headers = Record<string, string | Record<string, string> | string[]>;
    class TimeoutError extends Error {
        constructor(method: string, timeout: number);
    }
    class RemoteError extends Error {
        constructor(message: string);
    }
    const asteriskBufferSize = 1024;
    const headerValueMaxLength: number;
    const b64: {
        "split": (text: string) => string[];
        "unsplit": (encodedParts: string[]) => string;
        "enc": (str: string) => string;
        "dec": (enc: string) => string;
        "crop": (text: string) => string;
    };
}
