import { Evt, VoidEvt } from "evt";
import * as AstMan from "asterisk-manager";
import * as c from "./Credential";
import * as amiApi from "./amiApi";
import * as agi from "./agi";
import * as path from "path";
import * as tt from "transfer-tools";
import * as util from "util";

const uniqNow = (() => {
    let last = 0;
    return () => {
        let now = Date.now();
        return (now <= last) ? (++last) : (last = now);
    };
})();

export class Ami {

    private static instance: Ami | undefined = undefined;

    public static get hasInstance(): boolean {
        return !!this.instance;
    }

    public static getInstance(asteriskManagerUser?: string, asteriskConfigRoot?: string): Ami;
    public static getInstance(asteriskManagerCredential: c.Credential): Ami;
    public static getInstance(...inputs) {

        if (this.instance) return this.instance;

        this.instance = new this(inputs[0], inputs[1]);

        return this.instance;

    }

    public static generateUniqueActionId(): string {
        return `${uniqNow()}`;
    }

    public async disconnect() {

        if (Ami.instance === this) Ami.instance = undefined;

        await Promise.all([
            new Promise(resolve => this.astManForEvents.disconnect(resolve)),
            new Promise(resolve => this.astManForActions.disconnect(resolve))
        ]);

    }

    public createApiServer(apiId: string): amiApi.Server {
        return new amiApi.Server(this, apiId);
    }

    public createApiClient(apiId: string): amiApi.Client {
        return new amiApi.Client(this, apiId);
    }

    public startAgi(
        scripts: agi.Scripts,
        defaultScript?: (channel: agi.AGIChannel) => Promise<void>,
        onError?: (severity: "ERROR" | "WARNING", message: string, error: Error) => void
    ) {
        return agi.start(this, scripts, defaultScript, onError);
    }

    public readonly astManForActions;
    public readonly astManForEvents;

    public readonly evt = new Evt<Ami.ManagerEvent>();
    public readonly evtUserEvent = new Evt<Ami.UserEvent>();

    /** 
     * Posted when TCP connection with asterisk is lost.
     * Note that we will attempt to recover the connection
     * automatically.
     * */
    public readonly evtTcpConnectionClosed = new VoidEvt();

    private isReady = false;
    private readonly evtFullyBooted = new VoidEvt();

    public readonly credential: Ami.Credential;

    constructor(asteriskManagerUser?: string, asteriskConfigRoot?: string);
    constructor(asteriskManagerCredential: Ami.Credential);
    constructor(...inputs) {

        let credential: Ami.Credential;

        if (c.Credential.match(inputs[0])) {

            credential = inputs[0];

        } else {

            let asteriskManagerUser: string | undefined;
            let asteriskConfigRoot: string;

            let [p1, p2] = inputs;

            if (p1) {
                asteriskManagerUser = p1;
            } else {
                asteriskManagerUser = undefined;
            }

            if (p2) {
                asteriskConfigRoot = p2;
            } else {
                asteriskConfigRoot = path.join("/etc", "asterisk");
            }

            credential = c.Credential.getFromConfigFile(asteriskConfigRoot, asteriskManagerUser);

        }

        this.credential = credential;

        let { port, host, user, secret } = credential;

        this.astManForEvents = new AstMan(port, host, user, secret, true);
        this.astManForActions = new AstMan(port, host, user, secret, false);

        this.astManForActions.setMaxListeners(Infinity);
        this.astManForEvents.setMaxListeners(Infinity);

        this.astManForActions.keepConnected();
        this.astManForEvents.keepConnected();

        this.astManForEvents.on("managerevent", data => {

            switch (data.event) {
                case "FullyBooted":
                    this.isReady = true;
                    this.evtFullyBooted.post();
                    break;
                case "UserEvent":
                    this.evtUserEvent.post(data);
                    break;
            }

            this.evt.post(data);

        });

        this.astManForEvents.on("close", () => { 

            this.isReady = false

            this.evtTcpConnectionClosed.post();

        });

    }

    public get ready(): Promise<void> {

        if (this.isReady) {
            return Promise.resolve();
        } else {
            return this.evtFullyBooted.waitFor()
        }

    }

    public lastActionId: string = "";
    private actionPending: VoidEvt | undefined = undefined;

    public async postAction(
        action: string,
        headers: Ami.Headers
    ) {
        return this._postAction_(action, headers, false);
    }

    private async _postAction_(
        action: string,
        headers: Ami.Headers,
        isRecursion: boolean
    ) {

        let isTemporaryConnection = this.lastActionId === "-1";

        if (!headers.actionid) {
            headers.actionid = Ami.generateUniqueActionId();
        }

        this.lastActionId = headers.actionid as string;

        if (!this.isReady) await this.ready;

        if (!isRecursion && action.toLowerCase() === "originate") {
            return this.postActionOnNewConnection(action, headers);
        }

        while (this.actionPending) {

            try {

                await this.actionPending.waitFor(1500);

            } catch{

                return this.postActionOnNewConnection(action, headers);

            }

        }

        this.actionPending = new VoidEvt();

        if (!this.isReady) await this.ready;

        return await new Promise<any>(
            async (resolve, reject) => this.astManForActions.action(
                { ...headers, action },
                (error, res) => {

                    this.actionPending!.post();
                    this.actionPending = undefined;

                    if (error) {
                        reject(new Ami.ActionError(action, headers, error));
                    } else {
                        resolve(res);
                    }

                }
            )
        );
    }

    private postActionOnNewConnection(
        action: string,
        headers: Ami.Headers
    ): Promise<any> {

        let tmpAmi = new Ami(this.credential);

        let prAction = tmpAmi._postAction_(action, headers, true);

        prAction
            .then(() => tmpAmi.disconnect())
            .catch(() => tmpAmi.disconnect());

        return prAction;

    }

    public async userEvent(userEvent: {
        userevent: Ami.UserEvent['userevent'],
        actionid?: Ami.UserEvent['actionid'],
        [key: string]: string | undefined
    }) {

        let action: any = { ...userEvent };

        for (let key in action) {

            if (action[key] === undefined) delete action[key];

        }

        await this.postAction("UserEvent", action);

    };

    public async messageSend(
        to: string,
        from: string,
        body: string,
        packetHeaders?: Record<string, string>
    ) {

        await this.postAction(
            "MessageSend",
            {
                to,
                from,
                "variable": packetHeaders || {},
                "base64body": tt.stringTransform.safeBufferFromTo(
                    body, "utf8", "base64"
                )
            }
        );

    }

    public async setVar(
        variable: string,
        value: string,
        channel?: string
    ) {

        let headers: Record<string, string> = { variable, value };

        if (channel) headers = { ...headers, channel };

        await this.postAction("SetVar", headers);

    }

    public async getVar(
        variable: string,
        channel?: string
    ): Promise<string> {

        let headers: Record<string, string> = { variable };

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

    /** e.g call with ( "from-sip", "_[+0-9].", [ [ "NoOp", "FOO"], [ "Hangup" ] ] ) */
    public async dialplanAddSetOfExtensions(
        context: string,
        extension: string,
        instructionSet: ([string] | [string, string])[]
    ) {

        await this.dialplanExtensionRemove(context, extension);

        let priority = 1;

        for (let instruction of instructionSet) {

            let application = instruction[0];
            let applicationData = instruction[1];

            await this.dialplanExtensionAdd(context, extension, priority++, application, applicationData);

        }

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

    /** return true if extension removed */
    public async dialplanExtensionRemove(
        context: string,
        extension: string,
        priority?: number | string
    ): Promise<boolean> {

        let headers: Record<string, string> = { context, extension };

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

        let answered: boolean;

        try {

            await this.postAction("Originate", headers);

            answered = true;

        } catch (error) {

            answered = false;

        }

        return answered;

    }

}

export namespace Ami {

    export type Credential = c.Credential;

    export type ManagerEvent = {
        event: string;
        privilege: string;
        [header: string]: string;
    };

    export type UserEvent = {
        userevent: string;
        actionid: string;
        [key: string]: string | undefined;
    };

    export type Headers = Record<string, string | Record<string, string> | string[]>;

    export const asteriskBufferSize = 1024;
    export const headerValueMaxLength =
        (asteriskBufferSize - 1) - ("Variable: A_VERY_LONG_VARIABLE_NAME_TO_BE_REALLY_SAFE=" + "\r\n").length;

    export class ActionError extends Error {
        constructor(
            public readonly action: string,
            public readonly headers: Ami.Headers,
            public readonly asteriskResponse
        ) {
            super(`Asterisk manager error with action: '${action}', ${util.format(asteriskResponse)}`);
            Object.setPrototypeOf(this, new.target.prototype);
        }
    }

}
