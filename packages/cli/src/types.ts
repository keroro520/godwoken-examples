import {Address, HexString} from "@ckb-lumos/lumos";

// ETH address, 0x-trimmed 160-bits string
export type EthAddress = Address;
// SECP256k1 private key, 0x-prefixed string
export type SECP256K1PrivateKey = HexString;