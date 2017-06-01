import { Credential } from "./credential";
import { SyncEvent } from "ts-events-extended";
import { textSplit, base64TextSplit } from "./textSplit";
export interface ManagerEvent {
    event: string;
    privilege: string;
    [header: string]: string;
}
export interface UserEvent {
    userevent: string;
    actionid: string;
    [key: string]: string | undefined;
}
export declare type Headers = Record<string, string | Record<string, string> | string[]>;
export declare class Ami {
    readonly credential: Credential;
    static textSplit: typeof textSplit;
    static base64TextSplit: typeof base64TextSplit;
    static generateUniqueActionId: () => string;
    private static localhostInstance;
    static localhost(params?: {
        astConfPath?: string;
        user?: string;
    }): Ami;
    readonly connection: any;
    readonly evt: SyncEvent<ManagerEvent>;
    readonly evtUserEvent: SyncEvent<UserEvent>;
    private isFullyBooted;
    constructor(credential: Credential);
    lastActionId: string;
    userEvent(userEvent: {
        userevent: UserEvent['userevent'];
        actionid?: UserEvent['actionid'];
        [key: string]: string | undefined;
    }): Promise<void>;
    private static checkHeadersLength(headers);
    postAction(action: string, headers: Headers): Promise<any>;
    messageSend(to: string, from: string, body: string, packetHeaders?: Record<string, string>): Promise<void>;
    setVar(variable: string, value: string, channel?: string): Promise<void>;
    getVar(variable: string, channel?: string): Promise<string>;
    dialplanExtensionAdd(context: string, extension: string, priority: number | string, application: string, applicationData?: string, replace?: boolean): Promise<void>;
    runCliCommand(cliCommand: string): Promise<string>;
    dialplanExtensionRemove(context: string, extension: string, priority?: number | string): Promise<boolean>;
    removeContext(context: string): Promise<string>;
    originateLocalChannel(context: string, extension: string, channelVariables?: Record<string, string>): Promise<boolean>;
    disconnect(): Promise<void>;
}
