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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
exports.__esModule = true;
exports.buildL1Transaction = exports.buildDepositCellDeps = exports.buildChangeOutputCell = exports.collectInputCells = exports.buildDepositOutputCell = exports.buildDepositLock = exports.buildDepositLockArgs = void 0;
var lumos_1 = require("@ckb-lumos/lumos");
var provider = require("./provider");
var schema_1 = require("./schema");
var config = require("./config");
var utils_1 = require("@ckb-lumos/base/lib/utils");
var constant_1 = require("./constant");
var util_1 = require("./util");
var common_scripts_1 = require("@ckb-lumos/common-scripts");
var hd_1 = require("@ckb-lumos/hd");
var helpers_1 = require("@ckb-lumos/helpers");
function buildDepositLockArgs(l1CkbUser, l2EthUser) {
    var l1LockHash = lumos_1.utils.computeScriptHash(l1CkbUser.l1LockScript());
    var l2Lock = l2EthUser.l2LockScript();
    return {
        owner_lock_hash: l1LockHash,
        layer2_lock: l2Lock,
        cancel_timeout: "0xc0000000000004b0",
        registry_id: "0x" + constant_1.ETH_REGISTRY_ID.toString(16)
    };
}
exports.buildDepositLockArgs = buildDepositLockArgs;
function buildDepositLock(l1CkbUser, l2EthUser) {
    var depositLockArgs = buildDepositLockArgs(l1CkbUser, l2EthUser);
    var depositLockArgsCodec = new schema_1.DepositLockArgsCodec(depositLockArgs);
    var args = "0x" + config.ROLLUP_TYPE_HASH().slice(2) + depositLockArgsCodec.TrimmedHexSerialize();
    return {
        code_hash: config.getScriptConfig("deposit_lock").CODE_HASH,
        hash_type: config.getScriptConfig("deposit_lock").HASH_TYPE,
        args: args
    };
}
exports.buildDepositLock = buildDepositLock;
function buildDepositOutputCell(l1CkbUser, l2EthUser, ckbCapacity, sudtAmount, sudtScript) {
    if (sudtAmount === void 0) { sudtAmount = BigInt(0); }
    if (sudtAmount === BigInt(0)) {
        // Deposit CKB only
        var cell_output = {
            capacity: "0x" + ckbCapacity.toString(16),
            lock: buildDepositLock(l1CkbUser, l2EthUser),
            type: undefined
        };
        return {
            cell_output: cell_output,
            data: "0x"
        };
    }
    else {
        // Deposit CKB and SUDT
        var cell_output = {
            capacity: "0x" + ckbCapacity.toString(16),
            lock: buildDepositLock(l1CkbUser, l2EthUser),
            type: sudtScript
        };
        return {
            cell_output: cell_output,
            data: utils_1.toBigUInt128LE(sudtAmount)
        };
    }
}
exports.buildDepositOutputCell = buildDepositOutputCell;
function collectInputCells(l1CkbUser, outputCkbCapacity, outputSudtAmount, outputSudtScript) {
    var e_1, _a, e_2, _b;
    return __awaiter(this, void 0, void 0, function () {
        var collectedCkbCapacity, collectedSudtAmount, collectedInputCells, collector_1, _c, _d, cell, e_1_1, collector, _e, _f, cell, e_2_1;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    collectedCkbCapacity = BigInt(0);
                    collectedSudtAmount = BigInt(0);
                    collectedInputCells = [];
                    if (!(outputSudtAmount > BigInt(0))) return [3 /*break*/, 12];
                    collector_1 = provider.ckbIndexer.collector({
                        lock: l1CkbUser.l1LockScript(),
                        type: outputSudtScript
                    });
                    _g.label = 1;
                case 1:
                    _g.trys.push([1, 6, 7, 12]);
                    _c = __asyncValues(collector_1.collect());
                    _g.label = 2;
                case 2: return [4 /*yield*/, _c.next()];
                case 3:
                    if (!(_d = _g.sent(), !_d.done)) return [3 /*break*/, 5];
                    cell = _d.value;
                    collectedInputCells.push(cell);
                    collectedCkbCapacity += BigInt(cell.cell_output.capacity);
                    collectedSudtAmount += lumos_1.utils.readBigUInt128LE(cell.data);
                    if (collectedSudtAmount >= outputSudtAmount && collectedCkbCapacity >= outputCkbCapacity + constant_1.FEE + constant_1.MINIMAL_CKB_CELL_CAPACITY) {
                        return [3 /*break*/, 5];
                    }
                    _g.label = 4;
                case 4: return [3 /*break*/, 2];
                case 5: return [3 /*break*/, 12];
                case 6:
                    e_1_1 = _g.sent();
                    e_1 = { error: e_1_1 };
                    return [3 /*break*/, 12];
                case 7:
                    _g.trys.push([7, , 10, 11]);
                    if (!(_d && !_d.done && (_a = _c["return"]))) return [3 /*break*/, 9];
                    return [4 /*yield*/, _a.call(_c)];
                case 8:
                    _g.sent();
                    _g.label = 9;
                case 9: return [3 /*break*/, 11];
                case 10:
                    if (e_1) throw e_1.error;
                    return [7 /*endfinally*/];
                case 11: return [7 /*endfinally*/];
                case 12:
                    if (collectedSudtAmount >= outputSudtAmount && collectedCkbCapacity >= outputCkbCapacity + constant_1.FEE + constant_1.MINIMAL_CKB_CELL_CAPACITY) {
                        return [2 /*return*/, collectedInputCells];
                    }
                    else if (collectedSudtAmount < outputSudtAmount) {
                        throw new Error("Not enough SUDT, expected: " + outputSudtAmount + ", actual: " + collectedSudtAmount);
                    }
                    collector = provider.ckbIndexer.collector({
                        lock: l1CkbUser.l1LockScript(),
                        type: "empty",
                        data: "0x"
                    });
                    _g.label = 13;
                case 13:
                    _g.trys.push([13, 18, 19, 24]);
                    _e = __asyncValues(collector.collect());
                    _g.label = 14;
                case 14: return [4 /*yield*/, _e.next()];
                case 15:
                    if (!(_f = _g.sent(), !_f.done)) return [3 /*break*/, 17];
                    cell = _f.value;
                    collectedInputCells.push(cell);
                    collectedCkbCapacity += BigInt(cell.cell_output.capacity);
                    if (collectedCkbCapacity >= outputCkbCapacity + constant_1.FEE + constant_1.MINIMAL_CKB_CELL_CAPACITY) {
                        return [3 /*break*/, 17];
                    }
                    _g.label = 16;
                case 16: return [3 /*break*/, 14];
                case 17: return [3 /*break*/, 24];
                case 18:
                    e_2_1 = _g.sent();
                    e_2 = { error: e_2_1 };
                    return [3 /*break*/, 24];
                case 19:
                    _g.trys.push([19, , 22, 23]);
                    if (!(_f && !_f.done && (_b = _e["return"]))) return [3 /*break*/, 21];
                    return [4 /*yield*/, _b.call(_e)];
                case 20:
                    _g.sent();
                    _g.label = 21;
                case 21: return [3 /*break*/, 23];
                case 22:
                    if (e_2) throw e_2.error;
                    return [7 /*endfinally*/];
                case 23: return [7 /*endfinally*/];
                case 24:
                    if (collectedCkbCapacity >= outputCkbCapacity + constant_1.FEE + constant_1.MINIMAL_CKB_CELL_CAPACITY) {
                        return [2 /*return*/, collectedInputCells];
                    }
                    else {
                        throw new Error("Not enough CKB, expected: " + outputCkbCapacity + ", actual: " + collectedCkbCapacity);
                    }
                    return [2 /*return*/];
            }
        });
    });
}
exports.collectInputCells = collectInputCells;
function buildChangeOutputCell(l1CkbUser, inputCells, outputCells, sudtScript) {
    var outputCkbCapacity = util_1.sumCkbCapacity(outputCells);
    var outputSudtAmount = BigInt(0);
    if (sudtScript) {
        outputSudtAmount = util_1.sumSudtAmount(outputCells, sudtScript);
    }
    var inputCkbCapacity = util_1.sumCkbCapacity(inputCells);
    var inputSudtAmount = BigInt(0);
    if (sudtScript) {
        inputSudtAmount = util_1.sumSudtAmount(inputCells, sudtScript);
    }
    if (outputCkbCapacity < inputCkbCapacity + constant_1.FEE + constant_1.MINIMAL_CKB_CELL_CAPACITY) {
        throw new Error("Not enough CKB, outputs CKB capacity: " + outputCkbCapacity + ", inputs CKB capacity: " + inputCkbCapacity + ", fee: " + constant_1.FEE + ", minimal_ckb_cell_capacity: " + constant_1.MINIMAL_CKB_CELL_CAPACITY);
    }
    if (outputSudtAmount < inputSudtAmount) {
        throw new Error("Not enough SUDT, outputs SUDT amount: " + outputSudtAmount + ", inputs SUDT amount: " + inputSudtAmount);
    }
    if (outputSudtAmount === inputSudtAmount) {
        var cell = {
            cell_output: {
                capacity: "0x" + (inputCkbCapacity - outputCkbCapacity - constant_1.FEE).toString(16),
                lock: l1CkbUser.l1LockScript(),
                type: undefined
            },
            data: "0x"
        };
        return cell;
    }
    else {
        var cell = {
            cell_output: {
                capacity: "0x" + (inputCkbCapacity - outputCkbCapacity - constant_1.FEE).toString(16),
                lock: l1CkbUser.l1LockScript(),
                type: sudtScript
            },
            data: utils_1.toBigUInt128LE(inputSudtAmount - outputSudtAmount)
        };
        return cell;
    }
}
exports.buildChangeOutputCell = buildChangeOutputCell;
function buildDepositCellDeps(includingSudtCellDep) {
    if (includingSudtCellDep) {
        return [
            config.getCellDep("deposit_lock"),
            config.getCellDep("SECP256K1_BLAKE160"),
            config.getCellDep("SUDT"),
        ];
    }
    else {
        return [
            config.getCellDep("deposit_lock"),
            config.getCellDep("SECP256K1_BLAKE160"),
        ];
    }
}
exports.buildDepositCellDeps = buildDepositCellDeps;
// NOTE: Assume the user use SECP256K1_BLAKE2B as lock script.
function buildL1Transaction(l1CkbUser, inputCells, outputCells, cellDeps) {
    var txSkeleton = lumos_1.helpers
        .TransactionSkeleton({ cellProvider: provider.ckbIndexer })
        .update("outputs", function (outputs) {
        return outputs.push.apply(outputs, outputCells);
    })
        .update("inputs", function (inputs) {
        return inputs.push.apply(inputs, inputCells);
    })
        .update("cellDeps", function (cellDeps_) {
        return cellDeps_.push.apply(cellDeps_, cellDeps);
    });
    txSkeleton = common_scripts_1.common.prepareSigningEntries(txSkeleton);
    var message = txSkeleton.signingEntries.get(0).message;
    var signature = hd_1.key.signRecoverable(message, l1CkbUser.privateKey__);
    return helpers_1.sealTransaction(txSkeleton, [signature]);
}
exports.buildL1Transaction = buildL1Transaction;
//     // Construct L1 transaction
//     let txSkeleton = helpers.TransactionSkeleton({ cellProvider: provider.ckbIndexer });
//     txSkeleton = txSkeleton.update("outputs", (outputs) => {
//         return outputs.push({
//             cell_output: depositOutput, data: depositOutputData,
//         });
//     });
//
//     // TODO Handle CKB change
//
//     const signedTx = await provider.signL1Transaction(txSkeleton);
//     const txHash = await provider.sendL1Transaction(signedTx);
//     return txHash;
// }
