require("rejection-tracker").main(__dirname, "..", "..");

import { Ami } from "../lib";


(async function testAddExtension() {

    let ami = Ami.localhost();

    await ami.addDialplanExtension("my-context","my-extension", 1, "NoOp", "Hello Im here");

    let resp = await Ami.localhost().runCliCommand("dialplan show");

    await ami.removeContext("my-context");

    console.log(resp);

});

(async function testSetGetVariable() {

    let ami= Ami.localhost();

    let [variable, value ]= ["FOO_BAR", "BAR_BAZ_FOO" ];

    await ami.setVar(variable, value);

    console.assert( ( await ami.getVar(variable) ) === value );

    console.log("PASS");


})();