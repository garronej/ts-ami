"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ini_extended_1 = require("ini-extended");
var fs_1 = require("fs");
var path = require("path");
var astConfPath = path.join("/etc", "asterisk");
var defaultUser = "dongle-ext-user";
;
function retrieveCredential(params) {
    params || (params = {});
    var filePath = path.join(params.astConfPath || astConfPath, "manager.conf");
    if (!fs_1.existsSync(filePath))
        throw new Error("NO_FILE");
    var config = ini_extended_1.ini.parseStripWhitespace(fs_1.readFileSync(filePath, "utf8"));
    var general = config.general || {};
    var port = general.port ? parseInt(general.port) : 5038;
    var host = (general.bindaddr && general.bindaddr !== "0.0.0.0") ? general.bindaddr : "127.0.0.1";
    delete config.general;
    if (params.user && !config[params.user])
        throw new Error("User " + params.user + " not found in config file");
    var usersToTest = params.user ? [params.user] : Object.keys(config);
    for (var _i = 0, usersToTest_1 = usersToTest; _i < usersToTest_1.length; _i++) {
        var userName = usersToTest_1[_i];
        var userConfig = config[userName];
        if (!userConfig.secret ||
            !userConfig.write ||
            !userConfig.read)
            continue;
        if (isGranted(getListAuthority(userConfig.read)) &&
            isGranted(getListAuthority(userConfig.write))) {
            if (general.enabled !== "yes")
                throw new Error("NOT_ENABLED");
            return {
                port: port,
                host: host,
                "user": userName,
                "secret": userConfig.secret
            };
        }
    }
    throw Error("NO_USER");
}
exports.retrieveCredential = retrieveCredential;
function getListAuthority(strList) {
    strList = strList.replace(/\ /g, "");
    return strList.split(",");
}
function isGranted(list) {
    return true;
    /*

    let hasUser = false;
    let hasSystem = false;
    let hasConfig = false;

    for (let authority of list) {

        if (authority.toLowerCase() === "all")
            return true;

        if (authority.toLocaleLowerCase() === "user")
            hasUser = true;

        if (authority.toLocaleLowerCase() === "system")
            hasSystem = true;

        if (authority.toLocaleLowerCase() === "config")
            hasConfig = true;

    }

    return hasUser && (hasSystem || hasConfig);

    */
}
//# sourceMappingURL=credential.js.map