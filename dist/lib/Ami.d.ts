import { Credential } from "./credential";
import { SyncEvent } from "ts-events-extended";
export interface ManagerEvent {
    event: string;
    privilege: string;
    [header: string]: string;
}
export declare const lineMaxByteLength = 1024;
export declare const generateUniqueActionId: () => string;
export declare class Ami {
    private static localClient;
    static localhost(params?: {
        astConfPath?: string;
        user?: string;
    }): Ami;
    readonly ami: any;
    readonly evt: SyncEvent<ManagerEvent>;
    private isFullyBooted;
    constructor(credential: Credential);
    lastActionId: string;
    postAction(action: {
        action: string;
        variable?: string | {
            [key: string]: string;
        };
        [key: string]: any;
    }): Promise<any>;
    readonly messageSend: (to: string, from: string, body: string, headers?: {
        [header: string]: string;
    } | undefined) => Promise<any>;
    setVar(variable: string, value: string, channel?: string): Promise<void>;
    getVar(variable: string, channel?: string): Promise<string>;
    dialplanExtensionAdd(context: string, extension: string, priority: number | string, application: string, applicationData?: string, replace?: boolean): Promise<void>;
    runCliCommand(cliCommand: string): Promise<string>;
    dialplanExtensionRemove(context: string, extension: string, priority?: number | string): Promise<boolean>;
    removeContext(context: string): Promise<boolean>;
    originateLocalChannel(context: string, extension: string): Promise<void>;
    disconnect(): void;
}
