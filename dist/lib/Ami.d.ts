import { SyncEvent } from "ts-events-extended";
import * as c from "./Credential";
import * as amiApi from "./amiApi";
import * as agi from "./agi";
export declare class Ami {
    private static instance;
    static readonly hasInstance: boolean;
    static getInstance(asteriskManagerUser?: string, asteriskConfigRoot?: string): Ami;
    static getInstance(asteriskManagerCredential: c.Credential): Ami;
    static generateUniqueActionId(): string;
    disconnect(): Promise<void>;
    createApiServer(apiId: string): amiApi.Server;
    createApiClient(apiId: string): amiApi.Client;
    startAgi(scripts: agi.Scripts, defaultScript?: (channel: agi.AGIChannel) => Promise<void>): Promise<void>;
    readonly astManForActions: any;
    readonly astManForEvents: any;
    readonly evt: SyncEvent<Ami.ManagerEvent>;
    readonly evtUserEvent: SyncEvent<Ami.UserEvent>;
    private isReady;
    private readonly evtFullyBooted;
    readonly credential: Ami.Credential;
    constructor(asteriskManagerUser?: string, asteriskConfigRoot?: string);
    constructor(asteriskManagerCredential: Ami.Credential);
    readonly ready: Promise<void>;
    lastActionId: string;
    private actionPending;
    postAction(action: string, headers: Ami.Headers): Promise<any>;
    private _postAction_(action, headers, isRecursion);
    private postActionOnNewConnection(action, headers);
    userEvent(userEvent: {
        userevent: Ami.UserEvent['userevent'];
        actionid?: Ami.UserEvent['actionid'];
        [key: string]: string | undefined;
    }): Promise<void>;
    messageSend(to: string, from: string, body: string, packetHeaders?: Record<string, string>): Promise<void>;
    setVar(variable: string, value: string, channel?: string): Promise<void>;
    getVar(variable: string, channel?: string): Promise<string>;
    dialplanExtensionAdd(context: string, extension: string, priority: number | string, application: string, applicationData?: string, replace?: boolean): Promise<void>;
    /** e.g call with ( "from-sip", "_[+0-9].", [ [ "NoOp", "FOO"], [ "Hangup" ] ] ) */
    dialplanAddSetOfExtentions(context: string, extension: string, instructionSet: ([string] | [string, string])[]): Promise<void>;
    runCliCommand(cliCommand: string): Promise<string>;
    /** return true if extention removed */
    dialplanExtensionRemove(context: string, extension: string, priority?: number | string): Promise<boolean>;
    removeContext(context: string): Promise<string>;
    originateLocalChannel(context: string, extension: string, channelVariables?: Record<string, string>): Promise<boolean>;
}
export declare namespace Ami {
    type Credential = c.Credential;
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
    const asteriskBufferSize = 1024;
    const headerValueMaxLength: number;
    const b64: {
        "split": (text: string) => string[];
        "unsplit": (encodedParts: string[]) => string;
        "enc": (str: string) => string;
        "dec": (enc: string) => string;
        "crop": (text: string) => string;
    };
    class ActionError extends Error {
        readonly action: string;
        readonly headers: Ami.Headers;
        readonly asteriskResponse: any;
        constructor(action: string, headers: Ami.Headers, asteriskResponse: any);
    }
}
