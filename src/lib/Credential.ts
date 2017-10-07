import { ini } from "ini-extended";
import { readFileSync, existsSync } from "fs";
import * as path from "path";

export type Credential = {
    port: number;
    host: string;
    user: string;
    secret: string;
};


export namespace Credential {

    export function match(input: any): input is Credential {

        try{
            return !!(input as Credential).port;
        }catch{
            return false;
        }

    }

    export function getFromConfigFile(
        asteriskConfigRoot: string, 
        user?: string
    ): Credential {

        let filePath = path.join(asteriskConfigRoot, "manager.conf");

        if (!existsSync(filePath)) throw new Error("NO_FILE");

        let config = ini.parseStripWhitespace(readFileSync(filePath, "utf8"))

        let general: {
            enabled?: "yes" | "no";
            port?: string;
            bindaddr?: string;
        } = config.general || {};


        let port: number = general.port ? parseInt(general.port) : 5038;
        let host: string =
            (general.bindaddr && general.bindaddr !== "0.0.0.0") ? general.bindaddr : "127.0.0.1";

        delete config.general;


        if (user && !config[user])
            throw new Error(`User ${user} not found in config file`);

        let usersToTest = user ? [user] : Object.keys(config);

        for (let userName of usersToTest) {

            let userConfig: {
                secret?: string;
                read?: string;
                write?: string;
            } = config[userName];

            if (
                !userConfig.secret ||
                !userConfig.write ||
                !userConfig.read
            ) continue;

            if (
                isGranted(getListAuthority(userConfig.read!)) &&
                isGranted(getListAuthority(userConfig.write!))
            ) {

                if (general.enabled !== "yes")
                    throw new Error("NOT_ENABLED");

                return {
                    port,
                    host,
                    "user": userName,
                    "secret": userConfig.secret
                };

            }

        }

        throw Error("NO_USER");

    }

    function getListAuthority(strList: string): string[] {

        strList = strList.replace(/\ /g, "");

        return strList.split(",");

    }

    function isGranted(list: string[]): boolean {

        return true;

        /*
     
        let hasUser = false;
        let hasSystem = false;
        let hasConfig = false;
     
        for (let authority of list) {
     
            if (authority.toLowerCase() === "all")
                return true;
     
            if (authority.toLocaleLowerCase() === "user")
                hasUser = true;
     
            if (authority.toLocaleLowerCase() === "system")
                hasSystem = true;
     
            if (authority.toLocaleLowerCase() === "config")
                hasConfig = true;
     
        }
     
        return hasUser && (hasSystem || hasConfig);
     
        */

    }


}



