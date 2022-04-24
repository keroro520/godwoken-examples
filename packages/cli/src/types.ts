import {HexString} from "@ckb-lumos/lumos";

// CKB SECP256K1 lock args, 0x-prefixed 160-bites string
export type CkbSecpLockArgs = HexString;

// ETH address, 0x-prefixed 160-bits string
export type EthAddress = HexString;

// SECP256k1 private key, 0x-prefixed string
export type SECP256K1PrivateKey = HexString;


export function assertCkbSecpLockArgs(ckbSecpLockArgs: CkbSecpLockArgs): void {
    if (ckbSecpLockArgs.length != 42) {
        throw new Error(`Invalid CKB lock args ${ckbSecpLockArgs}: unmatched length, expected: 20, actual: ${ckbSecpLockArgs.length}`);
    }
    if (ckbSecpLockArgs.slice(0, 2) != "0x") {
        throw new Error(`Invalid CKB lock args ${ckbSecpLockArgs}: unexpected prefix, expected: "0x", actual: ${ckbSecpLockArgs.slice(0, 2)}`);
    }
}

export function assertEthAddress(ethAddress: EthAddress): void {
    if (ethAddress.length != 42) {
        throw new Error(`Invalid ETH address ${ethAddress}: unmatched length, expected: 20, actual: ${ethAddress.length}`);
    }
    if (ethAddress.slice(0, 2) != "0x") {
        throw new Error(`Invalid ETH address ${ethAddress}: unexpected prefix, expected: "0x", actual: ${ethAddress.slice(0, 2)}`);
    }
}
