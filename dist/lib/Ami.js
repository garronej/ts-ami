"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
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
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ami = void 0;
var evt_1 = require("evt");
var AstMan = require("asterisk-manager");
var c = require("./Credential");
var amiApi = require("./amiApi");
var agi = require("./agi");
var path = require("path");
var tt = require("transfer-tools");
var util = require("util");
var uniqNow = (function () {
    var last = 0;
    return function () {
        var now = Date.now();
        return (now <= last) ? (++last) : (last = now);
    };
})();
var Ami = /** @class */ (function () {
    function Ami() {
        var _this = this;
        var inputs = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            inputs[_i] = arguments[_i];
        }
        this.evt = new evt_1.Evt();
        this.evtUserEvent = new evt_1.Evt();
        /**
         * Posted when TCP connection with asterisk is lost.
         * Note that we will attempt to recover the connection
         * automatically.
         * */
        this.evtTcpConnectionClosed = evt_1.Evt.create();
        this.isReady = false;
        this.evtFullyBooted = evt_1.Evt.create();
        this.lastActionId = "";
        this.actionPending = undefined;
        var credential;
        if (c.Credential.match(inputs[0])) {
            credential = inputs[0];
        }
        else {
            var asteriskManagerUser = void 0;
            var asteriskConfigRoot = void 0;
            var _a = __read(inputs, 2), p1 = _a[0], p2 = _a[1];
            if (p1) {
                asteriskManagerUser = p1;
            }
            else {
                asteriskManagerUser = undefined;
            }
            if (p2) {
                asteriskConfigRoot = p2;
            }
            else {
                asteriskConfigRoot = path.join("/etc", "asterisk");
            }
            credential = c.Credential.getFromConfigFile(asteriskConfigRoot, asteriskManagerUser);
        }
        this.credential = credential;
        var port = credential.port, host = credential.host, user = credential.user, secret = credential.secret;
        this.astManForEvents = new AstMan(port, host, user, secret, true);
        this.astManForActions = new AstMan(port, host, user, secret, false);
        this.astManForActions.setMaxListeners(Infinity);
        this.astManForEvents.setMaxListeners(Infinity);
        this.astManForActions.keepConnected();
        this.astManForEvents.keepConnected();
        this.astManForEvents.on("managerevent", function (data) {
            switch (data.event) {
                case "FullyBooted":
                    _this.isReady = true;
                    _this.evtFullyBooted.post();
                    break;
                case "UserEvent":
                    _this.evtUserEvent.post(data);
                    break;
            }
            _this.evt.post(data);
        });
        this.astManForEvents.on("close", function () {
            _this.isReady = false;
            _this.evtTcpConnectionClosed.post();
        });
    }
    Object.defineProperty(Ami, "hasInstance", {
        get: function () {
            return !!this.instance;
        },
        enumerable: false,
        configurable: true
    });
    Ami.getInstance = function () {
        var inputs = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            inputs[_i] = arguments[_i];
        }
        if (this.instance)
            return this.instance;
        this.instance = new this(inputs[0], inputs[1]);
        return this.instance;
    };
    Ami.generateUniqueActionId = function () {
        return "" + uniqNow();
    };
    Ami.prototype.disconnect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (Ami.instance === this)
                            Ami.instance = undefined;
                        return [4 /*yield*/, Promise.all([
                                new Promise(function (resolve) { return _this.astManForEvents.disconnect(resolve); }),
                                new Promise(function (resolve) { return _this.astManForActions.disconnect(resolve); })
                            ])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Ami.prototype.createApiServer = function (apiId) {
        return new amiApi.Server(this, apiId);
    };
    Ami.prototype.createApiClient = function (apiId) {
        return new amiApi.Client(this, apiId);
    };
    Ami.prototype.startAgi = function (scripts, defaultScript, onError) {
        return agi.start(this, scripts, defaultScript, onError);
    };
    Object.defineProperty(Ami.prototype, "ready", {
        get: function () {
            if (this.isReady) {
                return Promise.resolve();
            }
            else {
                return this.evtFullyBooted.waitFor();
            }
        },
        enumerable: false,
        configurable: true
    });
    Ami.prototype.postAction = function (action, headers) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this._postAction_(action, headers, false)];
            });
        });
    };
    Ami.prototype._postAction_ = function (action, headers, isRecursion) {
        return __awaiter(this, void 0, void 0, function () {
            var isTemporaryConnection, _a;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        isTemporaryConnection = this.lastActionId === "-1";
                        if (!headers.actionid) {
                            headers.actionid = Ami.generateUniqueActionId();
                        }
                        this.lastActionId = headers.actionid;
                        if (!!this.isReady) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.ready];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2:
                        if (!isRecursion && action.toLowerCase() === "originate") {
                            return [2 /*return*/, this.postActionOnNewConnection(action, headers)];
                        }
                        _b.label = 3;
                    case 3:
                        if (!this.actionPending) return [3 /*break*/, 8];
                        _b.label = 4;
                    case 4:
                        _b.trys.push([4, 6, , 7]);
                        return [4 /*yield*/, this.actionPending.waitFor(1500)];
                    case 5:
                        _b.sent();
                        return [3 /*break*/, 7];
                    case 6:
                        _a = _b.sent();
                        return [2 /*return*/, this.postActionOnNewConnection(action, headers)];
                    case 7: return [3 /*break*/, 3];
                    case 8:
                        this.actionPending = evt_1.Evt.create();
                        if (!!this.isReady) return [3 /*break*/, 10];
                        return [4 /*yield*/, this.ready];
                    case 9:
                        _b.sent();
                        _b.label = 10;
                    case 10: return [4 /*yield*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                            var _this = this;
                            return __generator(this, function (_a) {
                                return [2 /*return*/, this.astManForActions.action(__assign(__assign({}, headers), { action: action }), function (error, res) {
                                        _this.actionPending.post();
                                        _this.actionPending = undefined;
                                        if (error) {
                                            reject(new Ami.ActionError(action, headers, error));
                                        }
                                        else {
                                            resolve(res);
                                        }
                                    })];
                            });
                        }); })];
                    case 11: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    Ami.prototype.postActionOnNewConnection = function (action, headers) {
        var tmpAmi = new Ami(this.credential);
        var prAction = tmpAmi._postAction_(action, headers, true);
        prAction
            .then(function () { return tmpAmi.disconnect(); })
            .catch(function () { return tmpAmi.disconnect(); });
        return prAction;
    };
    Ami.prototype.userEvent = function (userEvent) {
        return __awaiter(this, void 0, void 0, function () {
            var action, key;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        action = __assign({}, userEvent);
                        for (key in action) {
                            if (action[key] === undefined)
                                delete action[key];
                        }
                        return [4 /*yield*/, this.postAction("UserEvent", action)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ;
    Ami.prototype.messageSend = function (to, from, body, packetHeaders) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.postAction("MessageSend", {
                            to: to,
                            from: from,
                            "variable": packetHeaders || {},
                            "base64body": tt.stringTransform.safeBufferFromTo(body, "utf8", "base64")
                        })];
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
                            headers = __assign(__assign({}, headers), { channel: channel });
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
                            headers = __assign(__assign({}, headers), { channel: channel });
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
    /** e.g call with ( "from-sip", "_[+0-9].", [ [ "NoOp", "FOO"], [ "Hangup" ] ] ) */
    Ami.prototype.dialplanAddSetOfExtensions = function (context, extension, instructionSet) {
        return __awaiter(this, void 0, void 0, function () {
            var priority, instructionSet_1, instructionSet_1_1, instruction, application, applicationData, e_1_1;
            var e_1, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.dialplanExtensionRemove(context, extension)];
                    case 1:
                        _b.sent();
                        priority = 1;
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 7, 8, 9]);
                        instructionSet_1 = __values(instructionSet), instructionSet_1_1 = instructionSet_1.next();
                        _b.label = 3;
                    case 3:
                        if (!!instructionSet_1_1.done) return [3 /*break*/, 6];
                        instruction = instructionSet_1_1.value;
                        application = instruction[0];
                        applicationData = instruction[1];
                        return [4 /*yield*/, this.dialplanExtensionAdd(context, extension, priority++, application, applicationData)];
                    case 4:
                        _b.sent();
                        _b.label = 5;
                    case 5:
                        instructionSet_1_1 = instructionSet_1.next();
                        return [3 /*break*/, 3];
                    case 6: return [3 /*break*/, 9];
                    case 7:
                        e_1_1 = _b.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 9];
                    case 8:
                        try {
                            if (instructionSet_1_1 && !instructionSet_1_1.done && (_a = instructionSet_1.return)) _a.call(instructionSet_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                        return [7 /*endfinally*/];
                    case 9: return [2 /*return*/];
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
    /** return true if extension removed */
    Ami.prototype.dialplanExtensionRemove = function (context, extension, priority) {
        return __awaiter(this, void 0, void 0, function () {
            var headers, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        headers = { context: context, extension: extension };
                        if (priority !== undefined)
                            headers = __assign(__assign({}, headers), { "priority": "" + priority });
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
            var headers, answered, error_2;
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
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.postAction("Originate", headers)];
                    case 2:
                        _a.sent();
                        answered = true;
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        answered = false;
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/, answered];
                }
            });
        });
    };
    Ami.instance = undefined;
    return Ami;
}());
exports.Ami = Ami;
(function (Ami) {
    Ami.asteriskBufferSize = 1024;
    Ami.headerValueMaxLength = (Ami.asteriskBufferSize - 1) - ("Variable: A_VERY_LONG_VARIABLE_NAME_TO_BE_REALLY_SAFE=" + "\r\n").length;
    var ActionError = /** @class */ (function (_super) {
        __extends(ActionError, _super);
        function ActionError(action, headers, asteriskResponse) {
            var _newTarget = this.constructor;
            var _this = _super.call(this, "Asterisk manager error with action: '" + action + "', " + util.format(asteriskResponse)) || this;
            _this.action = action;
            _this.headers = headers;
            _this.asteriskResponse = asteriskResponse;
            Object.setPrototypeOf(_this, _newTarget.prototype);
            return _this;
        }
        return ActionError;
    }(Error));
    Ami.ActionError = ActionError;
})(Ami = exports.Ami || (exports.Ami = {}));
exports.Ami = Ami;
