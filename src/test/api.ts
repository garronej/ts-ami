import { Ami } from "../lib";

export async function start(){

    await (async function testEvent() {

        console.assert(!Ami.hasInstance);
        let amiClient = Ami.getInstance();
        console.assert(Ami.hasInstance);

        let apiClient = amiClient.apiClient;

        let amiServer = new Ami(amiClient.credential);
        let apiServer = amiServer.apiServer;

        amiServer.evtUserEvent.attach(() => console.assert(false, "m4"));

        let eventName = "foo";
        let emoji = (new Buffer("F09F98A5", "hex")).toString("utf8");
        let eventData = (new Array(100000)).fill(emoji).join("");

        apiServer.postEvent(eventName, eventData);

        let { event } = await apiClient.evtEvent.waitFor(({ name }) => name === eventName);

        console.assert(JSON.stringify(event) === JSON.stringify(eventData));

        amiClient.disconnect();
        amiServer.disconnect();

        console.log("PASS EVENT");

    })();

    await (async function testRequest() {

        console.assert(!Ami.hasInstance);

        let amiClient = Ami.getInstance();
        let apiClient = amiClient.apiClient;

        let amiServer = new Ami(amiClient.credential);
        let apiServer = amiServer.apiServer;

        let _method = "myMethod";

        let _params = { "p1": "foo", "p2": "bar" };

        let _returnValue = new Date();

        apiServer.evtRequest.attach(
            ({ method, params, resolve, reject }) => {

                console.assert(method === _method, "m1");
                console.assert(JSON.stringify(params) === JSON.stringify(_params), "m2");

                resolve(_returnValue);

            }
        );

        let returnValue = await apiClient.makeRequest(_method, _params);

        console.assert(returnValue instanceof Date, "m3");
        console.assert(returnValue.getTime() === _returnValue.getTime(), "m4");
        console.assert(JSON.stringify(returnValue) === JSON.stringify(_returnValue));

        amiClient.disconnect();
        amiServer.disconnect();


        console.log("PASS REQUEST");

    })();

    await (async function testRequest() {


        let client = Ami.getInstance().apiClient;
        let server = (new Ami(client.ami.credential)).apiServer;

        let _method = "myMethod";

        let _params = { "p1": "foo", "p2": "bar" };

        let _returnValue = undefined;

        server.evtRequest.attach(
            ({ method, params, resolve, reject }) => {

                console.assert(method === _method, "m1");
                console.assert(JSON.stringify(params) === JSON.stringify(_params), "m2");

                resolve(_returnValue);

            }
        );

        let returnValue = await client.makeRequest(_method, _params);

        console.assert(JSON.stringify(returnValue) === JSON.stringify(_returnValue));

        client.ami.disconnect();
        server.ami.disconnect();

        console.log("PASS REQUEST RETURN VALUE UNDEFINED");

    })();

    await (async function testRequest() {

        let client = Ami.getInstance().apiClient;
        let server = (new Ami(client.ami.credential)).apiServer;

        let _method = "myMethod";

        let _returnValue = undefined;

        server.evtRequest.attach(
            ({ method, params, resolve, reject }) => {

                console.assert(method === _method, "m1");
                console.assert(JSON.stringify(params) === undefined, "m2");

                resolve(_returnValue);

            }
        );

        let returnValue = await client.makeRequest(_method);

        console.assert(JSON.stringify(returnValue) === JSON.stringify(_returnValue));

        client.ami.disconnect();
        server.ami.disconnect();

        console.log("PASS REQUEST NO PARAMS");

    })();

    await (async function testRequest() {

        console.assert(!Ami.hasInstance);

        let amiClient = Ami.getInstance();
        let apiClient = amiClient.apiClient;

        let amiServer = new Ami(amiClient.credential);
        let apiServer = amiServer.apiServer;

        let _method = "myMethod";

        let _params = { "p1": "foo", "p2": "bar" };

        let errorMessage = "foo bar baz";

        apiServer.evtRequest.attach(
            ({ method, params, resolve, reject }) => {

                console.assert(method === _method, "m1");
                console.assert(JSON.stringify(params) === JSON.stringify(_params), "m2");

                reject(new Error(errorMessage));;

            }
        );

        try {

            await apiClient.makeRequest(_method, _params);

            console.assert(false);

        } catch (error) {

            console.assert(error instanceof Ami.RemoteError);

            console.assert(error.message === errorMessage);

        }

        amiClient.disconnect();
        amiServer.disconnect();

        console.log("PASS REQUEST REJECT");

    })();

    await (async function testRequest() {

        console.assert(!Ami.hasInstance);

        let amiClient = Ami.getInstance();
        let apiClient = amiClient.apiClient;

        let amiServer = new Ami(amiClient.credential);
        let apiServer = amiServer.apiServer;

        let _method = "myMethod";

        let _params = { "p1": "foo", "p2": "bar" };

        let timeout= 700;

        let before = Date.now();

        try{

            await apiClient.makeRequest(_method, _params, timeout);

            console.assert(false);

        }catch(error){

            console.assert( Date.now() - before < timeout + 200 );
            console.assert(error instanceof Ami.TimeoutError);

        }


        amiClient.disconnect();
        amiServer.disconnect();


        console.log("PASS REQUEST TIMEOUT");

    })();

}

