"use strict";
exports.__esModule = true;
exports.DepositLockArgsCodec = void 0;
var normalizers = require("./normalizers");
var molecule = require("./generated");
var toolkit_1 = require("@ckb-lumos/toolkit");
var DepositLockArgsCodec = /** @class */ (function () {
    function DepositLockArgsCodec(depositLockArgs) {
        this.owner_lock_hash = depositLockArgs.owner_lock_hash;
        this.layer2_lock = depositLockArgs.layer2_lock;
        this.cancel_timeout = depositLockArgs.cancel_timeout;
        this.registry_id = depositLockArgs.registry_id;
    }
    DepositLockArgsCodec.prototype.Normalize = function () {
        return normalizers.normalizeObject("DepositLockArgs", this, {
            owner_lock_hash: normalizers.normalizeRawData(32),
            layer2_lock: normalizers.toNormalize(normalizers.normalizeScript),
            cancel_timeout: normalizers.normalizeHexNumber(8),
            registry_id: normalizers.normalizeHexNumber(4)
        });
    };
    DepositLockArgsCodec.prototype.HexSerialize = function () {
        return toolkit_1.Reader.from(molecule.SerializeDepositLockArgs(this.Normalize())).serializeJson();
    };
    DepositLockArgsCodec.prototype.TrimmedHexSerialize = function () {
        return this.HexSerialize().slice(2);
    };
    return DepositLockArgsCodec;
}());
exports.DepositLockArgsCodec = DepositLockArgsCodec;
