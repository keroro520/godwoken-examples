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
var commander_1 = require("commander");
var config = require("./config");
var user_1 = require("./user");
var deposit_1 = require("./deposit");
var provider_1 = require("./provider");
var util_1 = require("./util");
function getCapacity(capacity) {
    return BigInt(capacity);
}
function getSudtAmount(sudtAmount) {
    return sudtAmount == null ? BigInt(0) : BigInt(sudtAmount.slice(2));
}
function getSudtScript(sudtScriptArgs) {
    if (sudtScriptArgs == null) {
        return undefined;
    }
    else {
        if (!sudtScriptArgs.startsWith("0x")) {
            throw new Error("Invalid --sudt-script-args, expected 0x-prefix string");
        }
        return {
            code_hash: config.getScriptConfig("SUDT").CODE_HASH,
            hash_type: config.getScriptConfig("SUDT").HASH_TYPE,
            args: sudtScriptArgs
        };
    }
}
function newCkbUser(privateKey) {
    if (!privateKey.startsWith("0x")) {
        throw new Error("Invalid --private-key, expected 0x-prefix string");
    }
    return new user_1.CkbUser(privateKey);
}
function newEthUser(privateKey, ethAddress) {
    if (ethAddress == null) {
        return new user_1.EthUser(user_1.EthUser.privateKeyToEthAddress(privateKey), privateKey);
    }
    else {
        return new user_1.EthUser(ethAddress);
    }
}
var program = new commander_1.Command();
program
    .version(require('./../package.json').version);
program
    .command("deposit")
    .option("-r --ckb-rpc-url <RPC>", "CKB RPC URL", "http://127.0.0.1:8114")
    .option("-i, --indexer <INDEXER>", "CKB Indexer RPC URL", "http://127.0.0.1:8116")
    .option("-l, --eth-address <ADDRESS>", "ETH address (using --private-key corresponding ETH address if not provided)")
    .option("-m --sudt-amount <AMOUNT>", "depositing SUDT amount, default is 0")
    .option("-s --sudt-script-args <SUDTSCRIPTARGS>", "depositing SUDT script args")
    .requiredOption("-p, --private-key <PRIVATEKEY>", "private key")
    .requiredOption("-c --capacity <CAPACITY>", "depositing CKB capacity in shannons")
    .action(function (program) { return __awaiter(void 0, void 0, void 0, function () {
    var ckbCapacity, sudtScript, sudtAmount, ckbUser, ethUser, output, outputCapacity, inputs, changeOutput, cellDeps, tx, txHash;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                ckbCapacity = getCapacity(program.capacity);
                sudtScript = getSudtScript(program.sudtScriptArgs);
                sudtAmount = getSudtAmount(program.sudtAmount);
                ckbUser = newCkbUser(program.privateKey);
                ethUser = newEthUser(program.ethAddress, program.privateKey);
                output = deposit_1.buildDepositOutputCell(ckbUser, ethUser, ckbCapacity, sudtAmount, sudtScript);
                outputCapacity = BigInt(output.cell_output.capacity.slice(2));
                return [4 /*yield*/, deposit_1.collectInputCells(ckbUser, outputCapacity, sudtAmount, sudtScript)];
            case 1:
                inputs = _a.sent();
                changeOutput = deposit_1.buildChangeOutputCell(ckbUser, inputs, [output], sudtScript);
                cellDeps = deposit_1.buildDepositCellDeps(sudtAmount > BigInt(0));
                tx = deposit_1.buildL1Transaction(ckbUser, inputs, [output, changeOutput], cellDeps);
                return [4 /*yield*/, provider_1.ckbRpc.send_transaction(tx, "passthrough")];
            case 2:
                txHash = _a.sent();
                return [4 /*yield*/, util_1.waitL1TxCommitted(txHash, provider_1.ckbRpc)];
            case 3:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
program.parse(program.argv);
