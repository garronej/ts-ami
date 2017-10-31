import { SyncEvent } from "ts-events-extended";
import { Ami } from "./Ami";
import UserEvent= Ami.UserEvent;
import { textSplit, b64Enc, b64Dec } from "./textSplit";
import { setTimer } from "timer-extended";
import * as superJson from "super-json";

namespace JSON {
    const myJson = superJson.create({
        "magic": '#!',
        "serializers": [
            superJson.dateSerializer,
            {
                "serialize": error => [error.message],
                "deserialize": message => new RemoteError(message),
                "isInstance": obj => obj instanceof Error,
                "name": "Error"
            }
        ]
    });

    export function stringify(obj: any): string {

        if (obj === undefined) {
            return "undefined";
        }

        return myJson.stringify([obj]);

    }

    export function parse(str: string): any {

        if (str === "undefined") {
            return undefined;
        }

        return myJson.parse(str).pop();
    }

}


interface Message {
    id: string,
    payload: any
}

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

        let packets = textSplit(50000, b64Enc(JSON.stringify(payload)));

        let userEvents: UserEvent[] = [];

        for (let i = 0; i < packets.length; i++) {

            let userEvent: UserEvent = { userevent, "actionid": Ami.generateUniqueActionId() };

            userEvent[messageIdKey] = id;

            userEvent[packetCountKey] = `${packets.length}`;

            userEvent[packetIndexKey] = `${i}`;

            let parts = textSplit(Ami.headerValueMaxLength, packets[i]);

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
                    ()=>{}
                );

            }

            await Promise.all(tasks);

        };

    }

    function parseUserEvents(userEvents: UserEvent[]): Message {

        let { userevent } = userEvents[0];

        let id = userEvents[0][messageIdKey]!;

        let payloadEnc = "";

        for (let userEvent of userEvents) {

            let length = parseInt(userEvent[partCountKey]!);

            let payloadEncPart = "";

            for (let i = 0; i < length; i++)
                payloadEncPart += userEvent[partKey(i)]!;

            payloadEnc += payloadEncPart;

        }

        let payload = JSON.parse(b64Dec(payloadEnc));

        return { id, payload };

    }

    export function makeEvtMessage(
        ami: Ami,
        userevent: string
    ): SyncEvent<Message> {

        let evtMessage = new SyncEvent<Message>();

        let evtUserEvent = new SyncEvent<UserEvent>();
        ami.evtUserEvent.attach(evtUserEvent);

        evtUserEvent.attach(
            userEvent => userEvent.userevent === userevent,
            userEvent => {

                let userEvents: UserEvent[] = [];

                let id = userEvent[messageIdKey];

                let packetCount = parseInt(userEvent[packetCountKey]!);

                let timer = setTimer(() => evtUserEvent.detach(userEvents), 3000);

                evtUserEvent.attachExtract(
                    userEvent => (
                        userEvent[messageIdKey] === id &&
                        userEvent.userevent === userevent
                    ),
                    userEvents,
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

    public readonly evtRequest = new SyncEvent<{
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

        let resolveOrReject= (id: string, payload: any)=> sendResponse({ id, payload });

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

    public readonly evtEvent = new SyncEvent<{ name: string; event: any }>();


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
        timeout: number= 5000
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
