"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
Object.defineProperty(exports, "__esModule", { value: true });
var credential_1 = require("./credential");
var AstMan = require("asterisk-manager");
var ts_events_extended_1 = require("ts-events-extended");
var js_base64_1 = require("js-base64");
var textSplit_1 = require("./textSplit");
var Ami = (function () {
    function Ami(credential) {
        var _this = this;
        this.credential = credential;
        this.evt = new ts_events_extended_1.SyncEvent();
        this.evtUserEvent = new ts_events_extended_1.SyncEvent();
        this.isFullyBooted = false;
        this.lastActionId = "";
        var port = credential.port, host = credential.host, user = credential.user, secret = credential.secret;
        this.connection = new AstMan(port, host, user, secret, true);
        this.connection.setMaxListeners(Infinity);
        this.connection.keepConnected();
        this.connection.on("managerevent", function (evt) { return _this.evt.post(evt); });
        this.connection.on("userevent", function (evt) { return _this.evtUserEvent.post(evt); });
        this.connection.on("fullybooted", function () { _this.isFullyBooted = true; });
        this.connection.on("close", function () { _this.isFullyBooted = false; });
    }
    Ami.localhost = function (params) {
        if (this.localhostInstance)
            return this.localhostInstance;
        return this.localhostInstance = new this(credential_1.retrieveCredential(params));
    };
    ;
    Ami.prototype.userEvent = function (userEvent) {
        return __awaiter(this, void 0, void 0, function () {
            var action, _a, _b, key, e_1, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        action = __assign({}, userEvent);
                        try {
                            for (_a = __values(Object.keys(action)), _b = _a.next(); !_b.done; _b = _a.next()) {
                                key = _b.value;
                                if (action[key] === undefined)
                                    delete action[key];
                            }
                        }
                        catch (e_1_1) { e_1 = { error: e_1_1 }; }
                        finally {
                            try {
                                if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                            }
                            finally { if (e_1) throw e_1.error; }
                        }
                        return [4 /*yield*/, this.postAction("UserEvent", action)];
                    case 1:
                        _d.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ;
    Ami.checkHeadersLength = function (headers) {
        var check = function (text, key) {
            if (textSplit_1.textSplit(text, function (str) { return str; }, key).length !== 1)
                throw new Error("Line too long");
        };
        try {
            for (var _a = __values(Object.keys(headers)), _b = _a.next(); !_b.done; _b = _a.next()) {
                var key = _b.value;
                var value = headers[key];
                if (typeof value === "string")
                    check(value, key);
                else if (value instanceof Array)
                    check(value.join(","), key);
                else
                    this.checkHeadersLength(value);
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
            }
            finally { if (e_2) throw e_2.error; }
        }
        var e_2, _c;
    };
    Ami.prototype.postAction = function (action, headers) {
        var _this = this;
        Ami.checkHeadersLength(headers);
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!headers.actionid)
                            headers.actionid = Ami.generateUniqueActionId();
                        this.lastActionId = headers.actionid;
                        if (!!this.isFullyBooted) return [3 /*break*/, 2];
                        return [4 /*yield*/, new Promise(function (resolve) { return _this.connection.once("fullybooted", function () { return resolve(); }); })];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        this.connection.action(__assign({}, headers, { action: action }), function (error, res) { return error ? reject(error) : resolve(res); });
                        return [2 /*return*/];
                }
            });
        }); });
    };
    Ami.prototype.messageSend = function (to, from, body, packetHeaders) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.postAction("MessageSend", { to: to, from: from, "variable": packetHeaders || {}, "base64body": js_base64_1.Base64.encode(body) })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Ami.prototype.setVar = function (variable, value, channel) {
        return __awaiter(this, void 0, void 0, function () {
            var headers;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        headers = { variable: variable, value: value };
                        if (channel)
                            headers = __assign({}, headers, { channel: channel });
                        return [4 /*yield*/, this.postAction("SetVar", headers)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Ami.prototype.getVar = function (variable, channel) {
        return __awaiter(this, void 0, void 0, function () {
            var headers;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        headers = { variable: variable };
                        if (channel)
                            headers = __assign({}, headers, { channel: channel });
                        return [4 /*yield*/, this.postAction("GetVar", headers)];
                    case 1: return [2 /*return*/, (_a.sent()).value];
                }
            });
        });
    };
    Ami.prototype.dialplanExtensionAdd = function (context, extension, priority, application, applicationData, replace) {
        return __awaiter(this, void 0, void 0, function () {
            var headers, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        headers = {
                            extension: extension,
                            "priority": "" + priority,
                            context: context,
                            application: application
                        };
                        if (applicationData)
                            headers["applicationdata"] = applicationData;
                        if (replace !== false)
                            headers["replace"] = "" + true;
                        return [4 /*yield*/, this.postAction("DialplanExtensionAdd", headers)];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Ami.prototype.runCliCommand = function (cliCommand) {
        return __awaiter(this, void 0, void 0, function () {
            var resp, output, errorResp_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.postAction("Command", { "Command": cliCommand })];
                    case 1:
                        resp = _a.sent();
                        if ("content" in resp)
                            return [2 /*return*/, resp.content];
                        else {
                            output = resp.output;
                            return [2 /*return*/, (typeof output === "string") ? output : output.join("\n")];
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        errorResp_1 = _a.sent();
                        if ("output" in errorResp_1)
                            return [2 /*return*/, errorResp_1.output.join("\n")];
                        throw errorResp_1;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    Ami.prototype.dialplanExtensionRemove = function (context, extension, priority) {
        return __awaiter(this, void 0, void 0, function () {
            var headers, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        headers = { context: context, extension: extension };
                        if (priority !== undefined)
                            headers = __assign({}, headers, { "priority": "" + priority });
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.postAction("DialplanExtensionRemove", headers)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 3:
                        error_1 = _a.sent();
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    Ami.prototype.removeContext = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.runCliCommand("dialplan remove context " + context)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Ami.prototype.originateLocalChannel = function (context, extension, channelVariables) {
        return __awaiter(this, void 0, void 0, function () {
            var headers, newInstance, answered, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        channelVariables = channelVariables || {};
                        headers = {
                            "channel": "Local/" + extension + "@" + context,
                            "application": "Wait",
                            "data": "2000",
                            "variable": channelVariables
                        };
                        newInstance = new Ami(this.credential);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, newInstance.postAction("originate", headers)];
                    case 2:
                        _a.sent();
                        answered = true;
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        answered = false;
                        return [3 /*break*/, 4];
                    case 4: return [4 /*yield*/, newInstance.disconnect()];
                    case 5:
                        _a.sent();
                        return [2 /*return*/, answered];
                }
            });
        });
    };
    Ami.prototype.disconnect = function () {
        var _this = this;
        return new Promise(function (resolve) { return _this.connection.disconnect(function () { return resolve(); }); });
    };
    return Ami;
}());
Ami.textSplit = textSplit_1.textSplit;
Ami.base64TextSplit = textSplit_1.base64TextSplit;
Ami.generateUniqueActionId = (function () {
    var counter = Date.now();
    return function () { return (counter++).toString(); };
})();
Ami.localhostInstance = undefined;
exports.Ami = Ami;
//# sourceMappingURL=Ami.js.map