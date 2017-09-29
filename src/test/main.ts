require("rejection-tracker").main(__dirname, "..", "..");

import { Ami } from "../lib";

import "./credential";

(async () => {

    await (async function testSetGetVariable() {

        let ami = Ami.localhost();

        let [variable, value] = ["FOO_BAR", "BAR_BAZ_FOO"];

        await ami.setVar(variable, value);

        console.assert((await ami.getVar(variable)) === value);

        console.log("PASS");

    })();

    await (async function testEdgeCaseTextSplit() {

        console.assert(JSON.stringify(Ami.base64TextSplit("")) === '[""]');

        console.log("PASS");

    })();


    await (async function testOriginate() {

        let ami = Ami.localhost();

        let context = "foo-context";
        let extension = "bar-extension";

        let value = "BAR_VALUE";


        let pr= ami.evt.waitFor(
            evt => (
                evt.event === "Newexten" &&
                evt.context === context &&
                evt.exten === extension &&
                evt.application === "NoOp"
            ),
            6000
        );

        await ami.removeContext(context);

        let priority = 1;
        await ami.dialplanExtensionAdd(context, extension, priority++, "NoOp", "${FOO_VARIABLE}");
        await ami.dialplanExtensionAdd(context, extension, priority++, "Wait", "3");
        await ami.dialplanExtensionAdd(context, extension, priority++, "Answer");

        let answered = await ami.originateLocalChannel(context, extension, { "FOO_VARIABLE": value });

        //console.log({ answered });

        console.assert(answered === true);

        let { appdata } = await pr;

        //console.log({ appdata });
        console.assert(appdata === value);

        console.log("PASS!");

    })();

    Ami.localhost().disconnect();

})();


(async function testRunCliCommand() {

    let ami = Ami.localhost();

    let output = await ami.runCliCommand("dialplan show");

    console.log(output);

    output = await ami.runCliCommand("dialplan remove extension foobar@foo_bar_baz__");

    console.log(output);

});

(async function testDialplanManipulation() {

    let ami = Ami.localhost();

    let context = "foobar";
    let extension = "1234";

    await ami.dialplanExtensionAdd(context, extension, 1, "NoOp", "What ever 1");
    await ami.dialplanExtensionAdd(context, extension, "hint", "Custom:alice");

    console.log(await ami.runCliCommand(`dialplan show ${context}`));

    await ami.dialplanExtensionRemove(context, extension, "hint");

    console.log(await ami.runCliCommand(`dialplan show ${context}`));

    console.log(await ami.removeContext(context));
    console.log(await ami.removeContext(context));

    console.log(await ami.runCliCommand(`dialplan show ${context}`));

});

(async function testVariable() {

    let ami = Ami.localhost();

    ami.evt.attach(({ event }) => event === "Newchannel", evt => {

        console.log({ evt });

    });


    ami.originateLocalChannel("from-dongle", "init-reassembled-sms", { "hello": "world", "foo": "bar" });

    //await ami.messageSend("foo", "bar", "coucou", {"first": "foo", "second": "bar" });
    //await ami.messageSend("foo", "bar", "coucou", ["foo", "bar" ] as any);

});


