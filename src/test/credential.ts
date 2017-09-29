import { Credential } from "../lib";
import * as path from "path";

try {

    let astConfPath = path.join(__dirname, "..", "..", "res", "no_file");

    Credential.getFromConfigFile({ astConfPath });

} catch (error) {
    console.assert(error.message === "NO_FILE");
}


try {

    let astConfPath = path.join(__dirname, "..", "..", "res", "disabled");

    Credential.getFromConfigFile({ astConfPath });

} catch (error) {
    console.assert(error.message === "NOT_ENABLED");
}


try {


    let astConfPath = path.join(__dirname, "..", "..", "res", "no_user");

    Credential.getFromConfigFile({ astConfPath });

} catch (error) {
    console.assert(error.message === "NO_USER");
}


let astConfPath = path.join(__dirname, "..", "..", "res", "pass");



let credential = Credential.getFromConfigFile({ astConfPath });

console.assert(
    credential.port === 5038 &&
    credential.host === "127.0.0.1" &&
    credential.user === "admin" &&
    credential.secret === "admin"
);

credential = Credential.getFromConfigFile({ astConfPath, "user": "my-user" });

console.assert(
    credential.port === 5038 &&
    credential.host === "127.0.0.1" &&
    credential.user === "my-user" &&
    credential.secret === "my-password"
);

console.log("PASS credential");