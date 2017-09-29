import { SyncEvent } from "ts-events-extended";
import { Credential, GetCredentialParams } from "./credential";
import { textSplit, base64TextSplit } from "./textSplit";
export declare class Ami {
    readonly credential: Credential;
    static textSplit: typeof textSplit;
    static base64TextSplit: typeof base64TextSplit;
    static generateUniqueActionId: () => string;
    private static localhostInstance;
    static localhost(params?: GetCredentialParams): Ami;
    readonly connection: any;
    readonly evt: SyncEvent<Ami.ManagerEvent>;
    readonly evtUserEvent: SyncEvent<Ami.UserEvent>;
    private isFullyBooted;
    constructor(credential: Credential);
    lastActionId: string;
    userEvent(userEvent: {
        userevent: Ami.UserEvent['userevent'];
        actionid?: Ami.UserEvent['actionid'];
        [key: string]: string | undefined;
    }): Promise<void>;
    private static checkHeadersLength(headers);
    postAction(action: string, headers: Ami.Headers): Promise<any>;
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
export declare namespace Ami {
    interface ManagerEvent {
        event: string;
        privilege: string;
        [header: string]: string;
    }
    interface UserEvent {
        userevent: string;
        actionid: string;
        [key: string]: string | undefined;
    }
    type Headers = Record<string, string | Record<string, string> | string[]>;
}
