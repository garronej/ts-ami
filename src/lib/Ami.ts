import { retrieveCredential, Credential } from "./credential";
import * as AstMan from "asterisk-manager";
import { SyncEvent } from "ts-events-extended";
import * as pr from "ts-promisify";

export interface ManagerEvent {
    event: string;
    privilege: string;
    [header: string]: string;
}

export const generateUniqueActionId = (() => {

    let counter = Date.now();

    return (): string => (counter++).toString();

})();

export class Ami {

    private static localClient: Ami | undefined = undefined;

    public static localhost(params?: {
        astConfPath?: string;
        user?: string;
    }): Ami {

        if (this.localClient) return this.localClient;

        return this.localClient = new this(retrieveCredential(params));

    };

    public readonly ami: any;

    public readonly evt = new SyncEvent<ManagerEvent>();

    private isFullyBooted = false;

    constructor(credential: Credential) {

        let { port, host, user, secret } = credential;

        this.ami = new AstMan(port, host, user, secret, true);

        this.ami.keepConnected();

        this.ami.on("managerevent", evt => this.evt.post(evt));
        this.ami.on("fullybooted", () => { this.isFullyBooted = true; });
        this.ami.on("close", () => { this.isFullyBooted = false; });

    }


    public lastActionId: string = "";

    public postAction(action: {
        action: string;
        [key: string]: string
    }): Promise<any> {

        if (!action.actionid)
            action.actionid = generateUniqueActionId();

        this.lastActionId = action.actionid;

        return new Promise<void>(async (resolve, reject) => {

            if (!this.isFullyBooted)
                await pr.generic(this.ami, this.ami.once)("fullybooted");

            this.ami.actionExpectSingleResponse(
                action,
                (error, res) => error ? reject(error) : resolve(res)
            );

        });

    }

    public async addDialplanExtension(
        extension: string,
        priority: number,
        action: string,
        context: string,
        replace?: boolean
    ) {

        let rawCommand = [
            `dialplan add extension ${extension},${priority},${action}`,
            ` into ${context}${(replace !== false) ? " replace" : ""}`
        ].join("");

        await this.postAction({
            "action": "Command",
            "Command": rawCommand
        });

    }

    public async originateLocalChannel(
        context: string,
        extension: string
    ) {

        await this.postAction({
            "action": "originate",
            "channel": `Local/${extension}@${context}`,
            "application": "Wait",
            "data": "2000"
        });

    }


    public disconnect(): void {
        this.ami.disconnect();
    }

}