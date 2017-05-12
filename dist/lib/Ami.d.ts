import { Credential } from "./credential";
import { SyncEvent } from "ts-events-extended";
export interface ManagerEvent {
    event: string;
    privilege: string;
    [header: string]: string;
}
export declare const lineMaxLength = 1024;
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
    addDialplanExtension(extension: string, priority: number, action: string, context: string, replace?: boolean): Promise<void>;
    removeExtension(extension: string, context: string, priority?: number): Promise<void>;
    removeContext(context: string): Promise<void>;
    originateLocalChannel(context: string, extension: string): Promise<void>;
    disconnect(): void;
}
