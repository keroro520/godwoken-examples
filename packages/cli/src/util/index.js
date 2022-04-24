"use strict";
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
exports.__esModule = true;
exports.waitL1TxCommitted = exports.asyncSleep = exports.sumSudtAmount = exports.sumCkbCapacity = void 0;
var lumos_1 = require("@ckb-lumos/lumos");
function sumCkbCapacity(cells) {
    return cells.reduce(function (acc, cell) { return acc += BigInt(cell.cell_output.capacity); }, BigInt(0));
}
exports.sumCkbCapacity = sumCkbCapacity;
function sumSudtAmount(cells, sudtScript) {
    return cells.reduce(function (acc, cell) {
        var amount = cell.cell_output.type === sudtScript ? acc + lumos_1.utils.readBigUInt128LE(cell.data) : BigInt(0);
        return acc + amount;
    }, BigInt(0));
}
exports.sumSudtAmount = sumSudtAmount;
function asyncSleep(ms) {
    if (ms === void 0) { ms = 0; }
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (r) { return setTimeout(r, ms); })];
        });
    });
}
exports.asyncSleep = asyncSleep;
function waitL1TxCommitted(txHash, ckbRpc, timeout, loopInterval) {
    if (timeout === void 0) { timeout = 300; }
    if (loopInterval === void 0) { loopInterval = 10; }
    return __awaiter(this, void 0, void 0, function () {
        var index, txWithStatus, status_1, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    index = 0;
                    _a.label = 1;
                case 1:
                    if (!(index < timeout)) return [3 /*break*/, 8];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 5, , 7]);
                    return [4 /*yield*/, ckbRpc.get_transaction(txHash)];
                case 3:
                    txWithStatus = _a.sent();
                    console.debug("tx " + txHash + " is " + txWithStatus + ", waited for " + index + " seconds");
                    if (txWithStatus != null) {
                        status_1 = txWithStatus.tx_status.status;
                        if (status_1 === "committed") {
                            console.log("tx " + txHash + " is committed!");
                            return [2 /*return*/];
                        }
                    }
                    return [4 /*yield*/, asyncSleep(loopInterval * 1000)];
                case 4:
                    _a.sent();
                    return [3 /*break*/, 7];
                case 5:
                    error_1 = _a.sent();
                    console.error(error_1);
                    return [4 /*yield*/, asyncSleep(loopInterval * 1000)];
                case 6:
                    _a.sent();
                    return [3 /*break*/, 7];
                case 7:
                    index += loopInterval;
                    return [3 /*break*/, 1];
                case 8: throw new Error("tx " + txHash + " not committed in " + timeout + " seconds");
            }
        });
    });
}
exports.waitL1TxCommitted = waitL1TxCommitted;
