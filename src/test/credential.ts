import { Credential } from "../lib/Credential";
import * as path from "path";

export function start() {

    try {

        let asteriskConfigRoot = path.join(__dirname, "..", "..", "res", "no_file");

        Credential.getFromConfigFile(asteriskConfigRoot);

    } catch (error) {
        console.assert(error.message === "NO_FILE");
    }


    try {

        let asteriskConfigRoot = path.join(__dirname, "..", "..", "res", "disabled");

        Credential.getFromConfigFile(asteriskConfigRoot);

    } catch (error) {

        console.assert(error.message === "NOT_ENABLED");

    }

    try {


        let asteriskConfigRoot = path.join(__dirname, "..", "..", "res", "no_user");

        Credential.getFromConfigFile(asteriskConfigRoot);

    } catch (error) {
        console.assert(error.message === "NO_USER");
    }


    let asteriskConfigRoot = path.join(__dirname, "..", "..", "res", "pass");


    let credential = Credential.getFromConfigFile(asteriskConfigRoot);

    console.assert(
        credential.port === 5038 &&
        credential.host === "127.0.0.1" &&
        credential.user === "admin" &&
        credential.secret === "admin"
    );

    credential = Credential.getFromConfigFile(asteriskConfigRoot, "my-user");

    console.assert(
        credential.port === 5038 &&
        credential.host === "127.0.0.1" &&
        credential.user === "my-user" &&
        credential.secret === "my-password"
    );

    console.log("PASS credential");

}
