import { Ami } from "./Ami";

import {
    AsyncAGIServer,
    AGIChannel as _AGIChannel_,
    ChannelStatus,
} from "ts-async-agi";

export type AGIChannel = _AGIChannel_;

/** Like { "from-sip": { "_[+0-9].": ...}} */
export type Scripts = {
    [context: string]: {
        [extensionPattern: string]: (channel: AGIChannel) => Promise<void>
    };
};

/*
let outboundHandlers: {
    [threadid: string]: (channel: AGIChannel) => Promise<void>
} = {};
*/

export async function start(
    ami: Ami,
    scripts: Scripts,
    defaultScript?: (channel: AGIChannel) => Promise<void>
) {

    await initDialplan(scripts, ami);

    let astManImpl = {
        "on": (event, handler) => {
            ami.astManForEvents.on(event, handler);
        },
        "action": (wrap, handler) => {
            let { action, ...headers } = wrap;

            let prAction = ami.postAction(action, headers);

            if (handler) {

                prAction
                    .then(response => handler(undefined, response))
                    .catch((error: Ami.ActionError) => handler(error.asteriskResponse, undefined));

            }

        }
    };

    new AsyncAGIServer(async (channel) => {

        let { context, threadid } = channel.request;

        let extensionPattern = await channel.relax.getVariable("EXTENSION_PATTERN");

        if (extensionPattern) {

            await scripts[context][extensionPattern](channel);

        } else if (context === "catch-outbound") {

            /*
            await outboundHandlers[threadid](channel);
            */

        } else {

            if (defaultScript) {

                await defaultScript(channel);

            } else {

                let error = new Error("No script to handle channel");
                error["channel"] = channel;
                throw error;

            }

        }

        //We call specific script

    }, astManImpl);

}

async function initDialplan(scripts: Scripts, ami: Ami) {

    for (let context in scripts) {

        for (let extensionPattern in scripts[context]) {

            await ami.dialplanAddSetOfExtentions(context, extensionPattern, [
                ["Set", `EXTENSION_PATTERN=${extensionPattern}`],
                ["AGI", "agi:async"],
                ["Hangup"]
            ])

        }

    }

    /*
    await ami.dialplanAddSetOfExtentions("catch-outbound", "default", [
        ["AGI", "agi:async"],
        ["Return"]
    ]);
    */

}

//Note: Need to be bound with ami context... anyway we dont need it for now
/*
export async function dialAndGetOutboundChannel(
    channel: AGIChannel,
    dialString: string,
    outboundHandler: (channel: AGIChannel) => Promise<void>
): Promise<boolean> {

    if (!dialString || channel.isHangup) return true;

    let { context, threadid } = channel.request;

    outboundHandlers[threadid] = outboundHandler;

    setTimeout(() => delete outboundHandlers[threadid], 2000);

    let { failure } = await channel.exec("Dial", [dialString, "", `b(catch-outbound^default^1)`]);

    return failure;

}
*/

