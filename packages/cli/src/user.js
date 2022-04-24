"use strict";
exports.__esModule = true;
exports.CkbUser = exports.EthUser = void 0;
var config = require("./config");
var hd_1 = require("@ckb-lumos/hd");
var crypto = require("crypto");
var keccak256 = require("keccak256");
var helpers_1 = require("@ckb-lumos/helpers");
// NOTE: L2 lock script is ETH lock script
var EthUser = /** @class */ (function () {
    function EthUser(ethAddress, privateKey) {
        this.privateKey__ = privateKey;
        this.ethAddress__ = ethAddress;
    }
    EthUser.privateKeyToEthAddress = function (privateKey) {
        var ecdh = crypto.createECDH("secp256k1");
        ecdh.generateKeys();
        ecdh.setPrivateKey(Buffer.from(privateKey.slice(2), "hex"));
        var publicKey = "0x" + ecdh.getPublicKey("hex", "uncompressed");
        var ethAddress = "0x" +
            keccak256(Buffer.from(publicKey.slice(4), "hex"))
                .slice(12)
                .toString("hex");
        return ethAddress;
    };
    EthUser.prototype.ethAddress = function () {
        return this.ethAddress__;
    };
    EthUser.prototype.l2LockScript = function () {
        var ethAccountLockScriptConfig = config.getScriptConfig("eth_account_lock");
        var rollupTypeHash = config.ROLLUP_TYPE_HASH();
        return {
            code_hash: ethAccountLockScriptConfig.CODE_HASH,
            hash_type: ethAccountLockScriptConfig.HASH_TYPE,
            args: rollupTypeHash.slice(2) + this.ethAddress__
        };
    };
    return EthUser;
}());
exports.EthUser = EthUser;
// NOTE: L1 lock script is SECP256K1 lock script
var CkbUser = /** @class */ (function () {
    function CkbUser(privateKey) {
        this.privateKey__ = privateKey;
        this.ckbSecpLockArgs__ = CkbUser.privateKeyToCkbSecp256k1LockArgs(privateKey);
    }
    CkbUser.privateKeyToCkbSecp256k1LockArgs = function (privateKey) {
        return hd_1.key.privateKeyToBlake160(privateKey);
    };
    CkbUser.prototype.ckbAddress = function () {
        var script = this.l1LockScript();
        return helpers_1.encodeToAddress(script);
    };
    CkbUser.prototype.ckbSecpLockArgs = function () {
        return this.ckbSecpLockArgs__;
    };
    CkbUser.prototype.l1LockScript = function () {
        var secp256k1Blake160ScriptConfig = config.getScriptConfig("SECP256K1_BLAKE160");
        return {
            code_hash: secp256k1Blake160ScriptConfig.CODE_HASH,
            hash_type: secp256k1Blake160ScriptConfig.HASH_TYPE,
            args: this.ckbSecpLockArgs()
        };
    };
    return CkbUser;
}());
exports.CkbUser = CkbUser;
