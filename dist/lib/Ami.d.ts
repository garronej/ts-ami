import { Credential } from "./credential";
import { SyncEvent } from "ts-events-extended";
export interface ManagerEvent {
    event: string;
    privilege: string;
    [header: string]: string;
}
export declare const generateUniqueActionId: () => string;
export declare class Ami {
    private static localClient;
    static localhost(params?: {
        astConfPath?: string;
        user?: string;
    }): Ami;
    readonly ami: any;
    readonly evtAmi: SyncEvent<ManagerEvent>;
    private isFullyBooted;
    constructor(credential: Credential);
    lastAttributedActionId: string;
    postAction(action: {
        action: string;
        [key: string]: string;
    }): Promise<any>;
    addDialplanExtension(extension: string, priority: number, action: string, context: string, replace?: boolean): Promise<void>;
    originateLocalChannel(context: string, extension: string): Promise<void>;
    disconnect(): void;
}
