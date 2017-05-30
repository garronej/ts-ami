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

    private isFullyBooted = false;

    constructor(public readonly credential: Credential) {

        let { port, host, user, secret } = credential;

        this.connection = new AstMan(port, host, user, secret, true);

        this.connection.setMaxListeners(Infinity);

        this.connection.keepConnected();

        this.connection.on("managerevent", evt => this.evt.post(evt));
        this.connection.on("fullybooted", () => { this.isFullyBooted = true; });
        this.connection.on("close", () => { this.isFullyBooted = false; });

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

                line = `${key}: ${action[key]}\r\n`;

                if (Buffer.byteLength(line) > lineMaxByteLength)
                    throw new Error(`Line too long: ${line}`);

            }

            if (!action.actionid)
                action.actionid = generateUniqueActionId();

            this.lastActionId = action.actionid;

            if (!this.isFullyBooted)
                await pr.generic(this.connection, this.connection.once)("fullybooted");

            this.connection.action(
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

    public async setVar(
        variable: string,
        value: string,
        channel?: string
    ){

        let action = { "action": "SetVar", variable, value };

        if( channel ) action= { ...action, channel };

        await this.postAction(action);

    }

    public async getVar(
        variable: string,
        channel?: string
    ): Promise<string> {

        let action= { "action": "GetVar", variable };

        if( channel ) action= { ...action, channel };

        return (await this.postAction(action)).value;

    }




    public async dialplanExtensionAdd(
        context: string,
        extension: string,
        priority: number | string,
        application: string,
        applicationData?: string,
        replace?: boolean
    ) {

        let action = {
            "action": "DialplanExtensionAdd",
            extension,
            "priority": `${priority}`,
            context,
            application
        };

        if (applicationData) action["applicationdata"] = applicationData;

        if (replace !== false ) action["replace"] = `${true}`;

        let res= await this.postAction(action);


    }

    public async runCliCommand(cliCommand: string): Promise<string> {

        try {

            let resp = await this.postAction({
                "action": "Command",
                "Command": cliCommand
            });

            if( "content" in resp ) return resp.content;
            else{

                let { output } = resp;

                return (typeof output === "string" )?output:output.join("\n");

            }


        } catch (errorResp) {

            if( "output" in errorResp ) return errorResp.output.join("\n");

            throw errorResp;

        }

    }

    public async dialplanExtensionRemove(
        context: string,
        extension: string,
        priority?: number | string
    ): Promise<boolean> {


        let action = { "action": "DialplanExtensionRemove", context, extension };

        if (priority !== undefined) action = { ...action, "priority": `${priority}` };

        try {

            await this.postAction(action);

            return true;

        } catch (error) {

            return false;
        }


    }

    public async removeContext(context: string): Promise<string> {

        return await this.runCliCommand(
            `dialplan remove context ${context}`
        );

    }

    public async originateLocalChannel(
        context: string,
        extension: string,
        variable?: { [key: string]: string; }
    ): Promise<boolean> {

        variable= variable || {};

        let action = {
            "action": "originate",
            "channel": `Local/${extension}@${context}`,
            "application": "Wait",
            "data": "2000",
            variable
        };

        let newInstance = new Ami(this.credential);

        let answered: boolean;

        try {

            await newInstance.postAction(action);

            answered= true;

        } catch (error) {

            answered= false;

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