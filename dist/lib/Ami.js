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
var pr = require("ts-promisify");
var js_base64_1 = require("js-base64");
exports.lineMaxByteLength = 1024;
exports.generateUniqueActionId = (function () {
    var counter = Date.now();
    return function () { return (counter++).toString(); };
})();
var Ami = (function () {
    function Ami(credential) {
        var _this = this;
        this.evt = new ts_events_extended_1.SyncEvent();
        this.isFullyBooted = false;
        this.lastActionId = "";
        this.messageSend = function (to, from, body, headers) { return _this.postAction({
            "action": "MessageSend",
            to: to,
            from: from,
            "variable": headers || {},
            "base64body": js_base64_1.Base64.encode(body)
        }); };
        var port = credential.port, host = credential.host, user = credential.user, secret = credential.secret;
        this.ami = new AstMan(port, host, user, secret, true);
        this.ami.setMaxListeners(Infinity);
        this.ami.keepConnected();
        this.ami.on("managerevent", function (evt) { return _this.evt.post(evt); });
        this.ami.on("fullybooted", function () { _this.isFullyBooted = true; });
        this.ami.on("close", function () { _this.isFullyBooted = false; });
    }
    Ami.localhost = function (params) {
        if (this.localClient)
            return this.localClient;
        return this.localClient = new this(credential_1.retrieveCredential(params));
    };
    ;
    Ami.prototype.postAction = function (action) {
        var _this = this;
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var line, _a, _b, key, variable, _c, _d, variableKey, e_1, _e, e_2, _f;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        try {
                            for (_a = __values(Object.keys(action)), _b = _a.next(); !_b.done; _b = _a.next()) {
                                key = _b.value;
                                if (key === "variable" && typeof (action.variable) === "object") {
                                    variable = action.variable;
                                    line = "Variable: ";
                                    try {
                                        for (_c = __values(Object.keys(variable)), _d = _c.next(); !_d.done; _d = _c.next()) {
                                            variableKey = _d.value;
                                            line += variableKey + "=" + variable[variableKey] + ",";
                                        }
                                    }
                                    catch (e_2_1) { e_2 = { error: e_2_1 }; }
                                    finally {
                                        try {
                                            if (_d && !_d.done && (_f = _c.return)) _f.call(_c);
                                        }
                                        finally { if (e_2) throw e_2.error; }
                                    }
                                    line = line.slice(0, -1) + "\r\n";
                                }
                                else
                                    line = key + ": " + action[key] + "\r\n";
                                if (Buffer.byteLength(line) > exports.lineMaxByteLength)
                                    throw new Error("Line too long: " + line);
                            }
                        }
                        catch (e_1_1) { e_1 = { error: e_1_1 }; }
                        finally {
                            try {
                                if (_b && !_b.done && (_e = _a.return)) _e.call(_a);
                            }
                            finally { if (e_1) throw e_1.error; }
                        }
                        if (!action.actionid)
                            action.actionid = exports.generateUniqueActionId();
                        this.lastActionId = action.actionid;
                        if (!!this.isFullyBooted) return [3 /*break*/, 2];
                        return [4 /*yield*/, pr.generic(this.ami, this.ami.once)("fullybooted")];
                    case 1:
                        _g.sent();
                        _g.label = 2;
                    case 2:
                        this.ami.actionExpectSingleResponse(action, function (error, res) { return error ? reject(error) : resolve(res); });
                        return [2 /*return*/];
                }
            });
        }); });
    };
    Ami.prototype.setVar = function (variable, value, channel) {
        return __awaiter(this, void 0, void 0, function () {
            var action;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        action = { "action": "SetVar", variable: variable, value: value };
                        if (channel)
                            action = __assign({}, action, { channel: channel });
                        return [4 /*yield*/, this.postAction(action)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Ami.prototype.getVar = function (variable, channel) {
        return __awaiter(this, void 0, void 0, function () {
            var action;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        action = { "action": "GetVar", variable: variable };
                        if (channel)
                            action = __assign({}, action, { channel: channel });
                        return [4 /*yield*/, this.postAction(action)];
                    case 1: return [2 /*return*/, (_a.sent()).value];
                }
            });
        });
    };
    Ami.prototype.dialplanExtensionAdd = function (context, extension, priority, application, applicationData, replace) {
        return __awaiter(this, void 0, void 0, function () {
            var action, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        action = {
                            "action": "DialplanExtensionAdd",
                            extension: extension,
                            "priority": "" + priority,
                            context: context,
                            application: application
                        };
                        if (applicationData)
                            action["applicationdata"] = applicationData;
                        if (replace !== false)
                            action["replace"] = "" + true;
                        return [4 /*yield*/, this.postAction(action)];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    //Only with asterisk 14+ ( broken in asterisk )
    Ami.prototype.runCliCommand = function (cliCommand) {
        return __awaiter(this, void 0, void 0, function () {
            var output, _a, output;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.postAction({
                                "action": "Command",
                                "Command": cliCommand
                            })];
                    case 1:
                        output = (_b.sent()).output;
                        return [2 /*return*/, output.join("\n")];
                    case 2:
                        _a = _b.sent();
                        output = _a.output;
                        throw new Error(output.join("\n"));
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    Ami.prototype.dialplanExtensionRemove = function (context, extension, priority) {
        return __awaiter(this, void 0, void 0, function () {
            var action, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        action = { "action": "DialplanExtensionRemove", context: context, extension: extension };
                        if (priority !== undefined)
                            action = __assign({}, action, { "priority": "" + priority });
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.postAction(action)];
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
    //Only Asterisk 14+
    Ami.prototype.removeContext = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var cliCommand, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cliCommand = "dialplan remove context " + context;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.runCliCommand(cliCommand)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 3:
                        error_2 = _a.sent();
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    Ami.prototype.originateLocalChannel = function (context, extension) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.postAction({
                            "action": "originate",
                            "channel": "Local/" + extension + "@" + context,
                            "application": "Wait",
                            "data": "2000"
                        })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Ami.prototype.disconnect = function () {
        this.ami.disconnect();
    };
    return Ami;
}());
Ami.localClient = undefined;
exports.Ami = Ami;
//# sourceMappingURL=Ami.js.map