import { SyncEvent } from "ts-events-extended";
import { Ami } from "./Ami";
export declare class AmiApiServer {
    readonly ami: Ami;
    readonly evtRequest: SyncEvent<{
        method: string;
        params: any;
        resolve(returnValue: any): Promise<void>;
        reject(error: Error): Promise<void>;
    }>;
    constructor(ami: Ami);
    private readonly sendEvent;
    postEvent(name: string, event: any): Promise<void>;
}
export declare class AmiApiClient {
    readonly ami: Ami;
    readonly evtEvent: SyncEvent<{
        name: string;
        event: any;
    }>;
    constructor(ami: Ami);
    private readonly sendRequest;
    private readonly evtResponse;
    makeRequest(method: string, params?: any, timeout?: number): Promise<any>;
}
