"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t;
    return { next: verb(0), "throw": verb(1), "return": verb(2) };
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
Object.defineProperty(exports, "__esModule", { value: true });
var credential_1 = require("./credential");
var AstMan = require("asterisk-manager");
var ts_events_extended_1 = require("ts-events-extended");
var pr = require("ts-promisify");
var js_base64_1 = require("js-base64");
exports.lineMaxLength = 1024;
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
            var line, _i, _a, key, variable, _b, _c, variableKey;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        for (_i = 0, _a = Object.keys(action); _i < _a.length; _i++) {
                            key = _a[_i];
                            if (key === "variable" && typeof (action.variable) === "object") {
                                variable = action.variable;
                                line = "Variable: ";
                                for (_b = 0, _c = Object.keys(variable); _b < _c.length; _b++) {
                                    variableKey = _c[_b];
                                    line += variableKey + "=" + variable[variableKey] + ",";
                                }
                                line = line.slice(0, -1) + "\r\n";
                            }
                            else
                                line = key + ": " + action[key] + "\r\n";
                            if (line.length > exports.lineMaxLength)
                                throw new Error("Line too long: " + line);
                        }
                        if (!action.actionid)
                            action.actionid = exports.generateUniqueActionId();
                        this.lastActionId = action.actionid;
                        if (!!this.isFullyBooted) return [3 /*break*/, 2];
                        return [4 /*yield*/, pr.generic(this.ami, this.ami.once)("fullybooted")];
                    case 1:
                        _d.sent();
                        _d.label = 2;
                    case 2:
                        this.ami.actionExpectSingleResponse(action, function (error, res) { return error ? reject(error) : resolve(res); });
                        return [2 /*return*/];
                }
            });
        }); });
    };
    Ami.prototype.addDialplanExtension = function (extension, priority, action, context, replace) {
        return __awaiter(this, void 0, void 0, function () {
            var rawCommand;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        rawCommand = [
                            "dialplan add extension " + extension + "," + priority + "," + action,
                            " into " + context + ((replace !== false) ? " replace" : "")
                        ].join("");
                        return [4 /*yield*/, this.postAction({
                                "action": "Command",
                                "Command": rawCommand
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Ami.prototype.removeExtension = function (extension, context, priority) {
        return __awaiter(this, void 0, void 0, function () {
            var rawCommand;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        rawCommand = "dialplan remove extension " + extension + "@" + context;
                        if (priority !== undefined)
                            rawCommand += " " + priority;
                        return [4 /*yield*/, this.postAction({
                                "action": "Command",
                                "Command": rawCommand
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Ami.prototype.removeContext = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var rawCommand;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        rawCommand = "dialplan remove context " + context;
                        return [4 /*yield*/, this.postAction({
                                "action": "Command",
                                "Command": rawCommand
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
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