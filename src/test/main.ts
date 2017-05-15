require("rejection-tracker").main(__dirname, "..", "..");

import { Ami } from "../lib";


(async function testAddExtension() {

    let ami = Ami.localhost();

    await ami.addDialplanExtension("my-context","my-extension", 1, "NoOp", "Hello Im here");

    let resp = await Ami.localhost().runCliCommand("dialplan show");

    await ami.removeContext("my-context");

    console.log(resp);

})();