"use strict";
exports.__esModule = true;
exports.assertEthAddress = exports.assertCkbSecpLockArgs = void 0;
function assertCkbSecpLockArgs(ckbSecpLockArgs) {
    if (ckbSecpLockArgs.length != 42) {
        throw new Error("Invalid CKB lock args " + ckbSecpLockArgs + ": unmatched length, expected: 20, actual: " + ckbSecpLockArgs.length);
    }
    if (ckbSecpLockArgs.slice(0, 2) != "0x") {
        throw new Error("Invalid CKB lock args " + ckbSecpLockArgs + ": unexpected prefix, expected: \"0x\", actual: " + ckbSecpLockArgs.slice(0, 2));
    }
}
exports.assertCkbSecpLockArgs = assertCkbSecpLockArgs;
function assertEthAddress(ethAddress) {
    if (ethAddress.length != 42) {
        throw new Error("Invalid ETH address " + ethAddress + ": unmatched length, expected: 20, actual: " + ethAddress.length);
    }
    if (ethAddress.slice(0, 2) != "0x") {
        throw new Error("Invalid ETH address " + ethAddress + ": unexpected prefix, expected: \"0x\", actual: " + ethAddress.slice(0, 2));
    }
}
exports.assertEthAddress = assertEthAddress;
