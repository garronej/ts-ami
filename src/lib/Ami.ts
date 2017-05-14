import { retrieveCredential, Credential } from "./credential";
import * as AstMan from "asterisk-manager";
import { SyncEvent } from "ts-events-extended";
import * as pr from "ts-promisify";
import { Base64 } from "js-base64";

export interface ManagerEvent {
    event: string;
    privilege: string;
    [header: string]: string;
}

export const lineMaxByteLength= 1024;

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
        variable?: string | { [key: string]: string };
        [key: string]: any;
    }): Promise<any> {

        return new Promise<void>(async (resolve, reject) => {

            let line: string;

            for (let key of Object.keys(action)) {

                if (key === "variable" && typeof(action.variable) === "object" ) {

                    let variable = action.variable;

                    line = `Variable: `;

                    for (let variableKey of Object.keys(variable))
                        line += `${variableKey}=${variable[variableKey]},`;

                    line = line.slice(0, -1) + "\r\n";

                } else line = `${key}: ${action[key]}\r\n`;


                if (Buffer.byteLength(line) > lineMaxByteLength)
                    throw new Error(`Line too long: ${line}`);

            }

            if (!action.actionid)
                action.actionid = generateUniqueActionId();

            this.lastActionId = action.actionid;

            if (!this.isFullyBooted)
                await pr.generic(this.ami, this.ami.once)("fullybooted");

            this.ami.actionExpectSingleResponse(
                action,
                (error, res) => error ? reject(error) : resolve(res)
            );

        });

    }

    public readonly messageSend = (
        to: string,
        from: string,
        body: string,
        headers?: { [header: string]: string; }
    ) => this.postAction({
        "action": "MessageSend",
        to,
        from,
        "variable": headers || {},
        "base64body": Base64.encode(body)
    });




    public async addDialplanExtension(
        extension: string,
        priority: number,
        application: string,
        applicationData: string | undefined,
        context: string,
        replace?: boolean
    ) {

        /*
        Action: DialplanExtensionAdd
        ActionID: <value>
        Context: <value>
        Extension: <value>
        Priority: <value>
        Application: <value>
        [ApplicationData:] <value>
        [Replace:] <value>
        */

        let action = {
            "action": "DialplanExtensionAdd",
            context,
            priority
        };

        if (replace !== false ) action["replace"] = `${true}`;

        if (applicationData) action["applicationdata"] = applicationData;

        await this.postAction(action);

        /*
        let rawCommand = [
            `dialplan add extension ${extension},${priority},${action}`,
            ` into ${context}${(replace !== false) ? " replace" : ""}`
        ].join("");

        await this.postAction({
            "action": "Command",
            "Command": rawCommand
        });
        */

    }

    public async removeExtension(
        extension: string,
        context: string,
        priority?: number
    ) {

        let rawCommand = `dialplan remove extension ${extension}@${context}`;

        if (priority !== undefined)
            rawCommand += ` ${priority}`;

        await this.postAction({
            "action": "Command",
            "Command": rawCommand
        });

    }

    public async removeContext(context: string) {

        let rawCommand = `dialplan remove context ${context}`;

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