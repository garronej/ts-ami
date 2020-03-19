import { Evt } from "evt";
import { Ami } from "./Ami";
import UserEvent = Ami.UserEvent;
import { setTimer } from "timer-extended";
import * as tt from "transfer-tools";

const JSON_CUSTOM = tt.JSON_CUSTOM.get([{
    "serialize": error => [error.message],
    "deserialize": message => new RemoteError(message),
    "isInstance": obj => obj instanceof Error,
    "name": "Error"
} as tt.JSON_CUSTOM.Serializer<Error>]);

interface Message {
    id: string,
    payload: any
}

const b64= tt.stringTransform.transcode("base64");

namespace Message {

    const packetCountKey = "packet_count";
    const packetIndexKey = "packet_index";
    const partCountKey = "part_count";
    const partKey = (index: number) => `part${index}`;
    const messageIdKey = "message_id";

    function buildUserEvents(
        message: Message, userevent: string
    ): UserEvent[] {

        let { id, payload } = message;

        let packets= tt.stringTransform.textSplit(
            50000, 
            b64.enc( 
                JSON_CUSTOM.stringify(
                    payload 
                ) 
            ) 
        );

        let userEvents: UserEvent[] = [];

        for (let i = 0; i < packets.length; i++) {

            let userEvent: UserEvent = { userevent, "actionid": Ami.generateUniqueActionId() };

            userEvent[messageIdKey] = id;

            userEvent[packetCountKey] = `${packets.length}`;

            userEvent[packetIndexKey] = `${i}`;

            let parts = tt.stringTransform.textSplit( 
                Ami.headerValueMaxLength, 
                packets[i] 
            );

            userEvent[partCountKey] = `${parts.length}`;

            for (let j = 0; j < parts.length; j++) {

                userEvent[partKey(j)] = parts[j];

            }

            userEvents.push(userEvent);

        }

        return userEvents;

    }


    export function makeSendMessage(
        ami: Ami,
        userevent: string
    ): (message: Message) => Promise<void> {

        return async (message: Message) => {

            let tasks: Promise<void>[] = [];

            for (let userEvent of buildUserEvents(message, userevent)) {

                tasks.push(ami.userEvent(userEvent));

                ami.evtUserEvent.attachOnceExtract(
                    ({ actionid }) => actionid === userEvent.actionid,
                    () => { }
                );

            }

            await Promise.all(tasks);

        };

    }

    function parseUserEvents(userEvents: UserEvent[]): Message {

        let id = userEvents[0][messageIdKey]!;

        let payloadEnc = "";

        for (let userEvent of userEvents) {

            let length = parseInt(userEvent[partCountKey]!);

            let payloadEncPart = "";

            for (let i = 0; i < length; i++)
                payloadEncPart += userEvent[partKey(i)]!;

            payloadEnc += payloadEncPart;

        }

        let payload = JSON_CUSTOM.parse(
            b64.dec(
                payloadEnc
            )
        );

        return { id, payload };

    }

    export function makeEvtMessage(
        ami: Ami,
        userevent: string
    ): Evt<Message> {

        let evtMessage = new Evt<Message>();

        let evtUserEvent = new Evt<UserEvent>();
        ami.evtUserEvent.attach(userEvent=> evtUserEvent.post(userEvent));

        evtUserEvent.attach(
            userEvent => userEvent.userevent === userevent,
            userEvent => {

                let userEvents: UserEvent[] = [];

                let id = userEvent[messageIdKey];

                let packetCount = parseInt(userEvent[packetCountKey]!);

                let timer = setTimer(() => evtUserEvent.detach(Evt.getCtx(userEvents)), 3000);

                evtUserEvent.attachExtract(
                    userEvent => (
                        userEvent[messageIdKey] === id &&
                        userEvent.userevent === userevent
                    ),
                    Evt.getCtx(userEvents),
                    userEvent => {

                        userEvents[userEvent[packetIndexKey]!] = userEvent;

                        if (!--packetCount) {

                            timer.runNow();

                            evtMessage.post(parseUserEvents(userEvents));

                        } else {

                            timer.resetDelay();

                        }

                    }
                );

                evtUserEvent.post(userEvent);

            });

        return evtMessage;

    }

}

const requestUserevent = "API_REQUEST_";
const responseUserevent = "API_RESPONSE_";
const eventUserevent = "API_EVENT_";

export class Server {

    public readonly evtRequest = new Evt<{
        method: string;
        params: any;
        resolve(returnValue: any): Promise<void>;
        reject(error: Error): Promise<void>;
    }>();

    constructor(
        public readonly ami: Ami,
        private readonly apiId: string
    ) {

        let sendResponse = Message.makeSendMessage(ami, `${responseUserevent}${apiId}`);

        let resolveOrReject = (id: string, payload: any) => sendResponse({ id, payload });

        Message.makeEvtMessage(ami, `${requestUserevent}${apiId}`).attach(
            ({ id, payload }) => this.evtRequest.post({
                "method": payload.method,
                "params": payload.params,
                "resolve": (returnValue: any) => resolveOrReject(id, returnValue),
                "reject": (error: Error) => resolveOrReject(id, error)
            })
        );

    }

    private readonly sendEvent = Message.makeSendMessage(this.ami, `${eventUserevent}${this.apiId}`);

    public postEvent(name: string, event: any): Promise<void> {
        return this.sendEvent({
            "id": Ami.generateUniqueActionId(),
            "payload": { name, event }
        });
    }

}


export class Client {

    public readonly evtEvent = new Evt<{ name: string; event: any }>();


    constructor(
        public readonly ami: Ami,
        private readonly apiId: string
    ) {

        Message.makeEvtMessage(ami, `${eventUserevent}${this.apiId}`).attach(
            ({ payload }) => this.evtEvent.post(payload)
        );

    }

    private readonly sendRequest = Message.makeSendMessage(this.ami, `${requestUserevent}${this.apiId}`);
    private readonly evtResponse = Message.makeEvtMessage(this.ami, `${responseUserevent}${this.apiId}`);

    public async makeRequest(
        method: string,
        params?: any,
        timeout: number = 5000
    ) {

        let requestId = Ami.generateUniqueActionId();

        this.sendRequest({ "id": requestId, "payload": { method, params } });

        let payload: any;

        try {
            payload = (await this.evtResponse.waitFor(({ id }) => id === requestId, timeout)).payload;
        } catch{
            throw new TimeoutError(method, timeout);
        }

        if (payload instanceof Error) {
            throw payload;
        } else {
            return payload;
        }

    }

}

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
