require("rejection-tracker").main(__dirname, "..", "..");

import * as credential from  "./credential"
import * as ami from "./ami";
import * as api from "./api";


(async ()=>{

    credential.start();

    await ami.start();

    await api.start();

    console.log("ALL TEST PASSED");

})();