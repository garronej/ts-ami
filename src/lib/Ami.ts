import { SyncEvent } from "ts-events-extended";
import * as AstMan from "asterisk-manager";
import * as c from "./Credential";
import { b64Split, b64Unsplit, b64Dec, b64Enc, b64crop } from "./textSplit";
import * as api from "./apiTransport";
import * as path from "path";

let counter = Date.now();

export class Ami {

    private static instance: Ami | undefined= undefined;

    public static get hasInstance(): boolean {
        return !!this.instance;
    }

    public static getInstance(asteriskManagerUser?: string, asteriskConfigRoot?: string): Ami;
    public static getInstance(asteriskManagerCredential: c.Credential): Ami;
    public static getInstance(...inputs){

        if( this.instance ) return this.instance;

        this.instance= new this(inputs[0], inputs[1]);

        return this.instance;

    }

    public disconnect(): Promise<void> {

        if( Ami.instance === this ) Ami.instance= undefined;

        return new Promise<void>(
            resolve => this.connection.disconnect(
                () => resolve()
            )
        );

    }


    public startApiServer(): api.AmiApiServer {
        return new api.AmiApiServer(this);
    }

    public startApiClient(): api.AmiApiClient {
        return new api.AmiApiClient(this);
    }



    public static generateUniqueActionId(): string {
        return `${counter++}`;
    }

    public readonly connection: any;

    public readonly evt = new SyncEvent<Ami.ManagerEvent>();
    public readonly evtUserEvent = new SyncEvent<Ami.UserEvent>();

    private isFullyBooted = false;

    public readonly credential: Ami.Credential;

    constructor(asteriskManagerUser?: string, asteriskConfigRoot?: string);
    constructor(asteriskManagerCredential: Ami.Credential);
    constructor(...inputs){

        let credential: Ami.Credential;

        if( c.Credential.match(inputs[0]) ){

            credential= inputs[0];

        }else{

            let asteriskManagerUser: string | undefined;
            let asteriskConfigRoot: string;

            let [ p1, p2 ]= inputs;

            if(p1){
                asteriskManagerUser= p1;
            }else{
                asteriskManagerUser= undefined;
            }

            if( p2 ){
                asteriskConfigRoot= p2;
            }else{
                asteriskConfigRoot= path.join("/etc", "asterisk");
            }

            credential= c.Credential.getFromConfigFile(asteriskConfigRoot, asteriskManagerUser);

        }

        this.credential= credential;

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
        userevent: Ami.UserEvent['userevent'],
        actionid?: Ami.UserEvent['actionid'],
        [key: string]: string | undefined
    }) {

        let action: any = { ...userEvent };

        for (let key of Object.keys(action))
            if (action[key] === undefined)
                delete action[key];

        await this.postAction("UserEvent", action);

    };


    public postAction(
        action: string,
        headers: Ami.Headers
    ): Promise<any> {

        return new Promise<any>(async (resolve, reject) => {

            if (!headers.actionid){
                headers.actionid = Ami.generateUniqueActionId();
            }

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
            { to, from, "variable": packetHeaders || {}, "base64body": b64Enc(body) }
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

}

export namespace Ami {

    export type Credential= c.Credential;

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

    export class TimeoutError extends Error {
        constructor(method: string, timeout: number) {
            super(`Request ${method} timed out after ${timeout} ms`);
            Object.setPrototypeOf(this, new.target.prototype);
        }
    }

    export class RemoteError extends Error {
        constructor(message: string) {
            super(message);
            Object.setPrototypeOf(this, new.target.prototype);
        }
    }


    export const asteriskBufferSize = 1024;
    export const headerValueMaxLength = (asteriskBufferSize - 1) - ("Variable: A_VERY_LONG_VARIABLE_NAME_TO_BE_REALLY_SAFE=" + "\r\n").length;

    export const b64= {
        "split": (text: string)=> b64Split(headerValueMaxLength, text),
        "unsplit": b64Unsplit,
        "enc": b64Enc,
        "dec": b64Dec,
        "crop": (text: string)=> b64crop(headerValueMaxLength, text)
    }

}