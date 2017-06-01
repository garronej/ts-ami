import { retrieveCredential, Credential } from "./credential";
import * as AstMan from "asterisk-manager";
import { SyncEvent } from "ts-events-extended";
import { Base64 } from "js-base64";
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

export type Headers = Record<string, string | Record<string, string> | string[]>;




export class Ami {

    public static textSplit= textSplit;

    public static base64TextSplit= base64TextSplit;

    public static generateUniqueActionId: () => string = (() => {

        let counter = Date.now();

        return (): string => (counter++).toString();

    })();

    private static localhostInstance: Ami | undefined = undefined;

    public static localhost(params?: {
        astConfPath?: string;
        user?: string;
    }): Ami {

        if (this.localhostInstance) return this.localhostInstance;

        return this.localhostInstance = new this(retrieveCredential(params));

    };

    public readonly connection: any;

    public readonly evt = new SyncEvent<ManagerEvent>();
    public readonly evtUserEvent = new SyncEvent<UserEvent>();

    private isFullyBooted = false;

    constructor(public readonly credential: Credential) {

        let { port, host, user, secret } = credential;

        this.connection = new AstMan(port, host, user, secret, true);

        this.connection.setMaxListeners(Infinity);

        this.connection.keepConnected();

        this.connection.on("managerevent", evt => this.evt.post(evt));
        this.connection.on("userevent", evt => this.evtUserEvent.post(evt));
        this.connection.on("fullybooted", () => { this.isFullyBooted = true; });
        this.connection.on("close", () => { this.isFullyBooted = false; });

    }


    public lastActionId: string = "";

    public async userEvent(userEvent: {
        userevent: UserEvent['userevent'],
        actionid?: UserEvent['actionid'],
        [key: string]: string | undefined
    }) {

        let action: any = { ...userEvent };

        for (let key of Object.keys(action))
            if (action[key] === undefined)
                delete action[key];

        await this.postAction("UserEvent", action);

    };


    private static checkHeadersLength(headers: Headers): void {

        let check = (text: string, key: string) => {
            if (textSplit(text, str => str, key).length !== 1)
                throw new Error("Line too long");
        };

        for (let key of Object.keys(headers)) {

            let value = headers[key];

            if (typeof value === "string")
                check(value, key);
            else if (value instanceof Array)
                check(value.join(","), key);
            else
                this.checkHeadersLength(value);

        }

    }

    public postAction(
        action: string,
        headers: Headers
    ): Promise<any> {

        Ami.checkHeadersLength(headers);

        return new Promise<any>(async (resolve, reject) => {

            if (!headers.actionid)
                headers.actionid = Ami.generateUniqueActionId();

            this.lastActionId = headers.actionid as string;

            if (!this.isFullyBooted)
                await new Promise<void>(
                    resolve => this.connection.once("fullybooted", () => resolve())
                );

            this.connection.action(
                { ...headers, action },
                (error, res) => error ? reject(error) : resolve(res)
            );

        });

    }

    public async messageSend(
        to: string,
        from: string,
        body: string,
        packetHeaders?: Record<string, string>
    ) {

        await this.postAction(
            "MessageSend",
            { to, from, "variable": packetHeaders || {}, "base64body": Base64.encode(body) }
        );

    }



    public async setVar(
        variable: string,
        value: string,
        channel?: string
    ) {

        let headers = { variable, value };

        if (channel) headers = { ...headers, channel };

        await this.postAction("SetVar", headers);

    }

    public async getVar(
        variable: string,
        channel?: string
    ): Promise<string> {

        let headers = { variable };

        if (channel) headers = { ...headers, channel };

        return (await this.postAction("GetVar", headers)).value;

    }




    public async dialplanExtensionAdd(
        context: string,
        extension: string,
        priority: number | string,
        application: string,
        applicationData?: string,
        replace?: boolean
    ) {

        let headers = {
            extension,
            "priority": `${priority}`,
            context,
            application
        };

        if (applicationData) headers["applicationdata"] = applicationData;

        if (replace !== false) headers["replace"] = `${true}`;

        let res = await this.postAction("DialplanExtensionAdd", headers);


    }

    public async runCliCommand(cliCommand: string): Promise<string> {

        try {

            let resp = await this.postAction("Command", { "Command": cliCommand });

            if ("content" in resp) return resp.content;
            else {

                let { output } = resp;

                return (typeof output === "string") ? output : output.join("\n");

            }


        } catch (errorResp) {

            if ("output" in errorResp) return errorResp.output.join("\n");

            throw errorResp;

        }

    }

    public async dialplanExtensionRemove(
        context: string,
        extension: string,
        priority?: number | string
    ): Promise<boolean> {


        let headers = { context, extension };

        if (priority !== undefined) headers = { ...headers, "priority": `${priority}` };

        try {

            await this.postAction("DialplanExtensionRemove", headers);

            return true;

        } catch (error) {

            return false;
        }


    }

    public async removeContext(context: string): Promise<string> {

        return await this.runCliCommand(`dialplan remove context ${context}`);

    }

    public async originateLocalChannel(
        context: string,
        extension: string,
        channelVariables?: Record<string, string>
    ): Promise<boolean> {

        channelVariables = channelVariables || {};

        let headers = {
            "channel": `Local/${extension}@${context}`,
            "application": "Wait",
            "data": "2000",
            "variable": channelVariables
        };

        let newInstance = new Ami(this.credential);

        let answered: boolean;

        try {

            await newInstance.postAction("originate", headers);

            answered = true;

        } catch (error) {

            answered = false;

        }

        await newInstance.disconnect();

        return answered;

    }


    public disconnect(): Promise<void> {

        return new Promise<void>(
            resolve => this.connection.disconnect(
                () => resolve()
            )
        );

    }

}