import {HexString, Script} from "@ckb-lumos/lumos";
import * as config from "./config";
import {key} from "@ckb-lumos/hd";
import {EthAddress, assertEthAddress, assertCkbSecpLockArgs, SECP256K1PrivateKey, CkbSecpLockArgs} from "./types";
import * as crypto from "crypto";
import * as keccak256 from "keccak256";
import {encodeToAddress, } from "@ckb-lumos/helpers";

// NOTE: L1 lock script is SECP256K1 lock script
// NOTE: L2 lock script is ETH lock script
export class User {
    readonly ethAddress__: EthAddress;
    readonly ckbSecpLockArgs__: CkbSecpLockArgs;

    constructor(ethAddress: EthAddress, ckbSecpLockArgs: CkbSecpLockArgs) {
        assertEthAddress(ethAddress);
        assertCkbSecpLockArgs(ckbSecpLockArgs)
        this.ethAddress__ = ethAddress.toLowerCase();
        this.ckbSecpLockArgs__=ckbSecpLockArgs;
    }

    ethAddress() : EthAddress {
        return this.ethAddress__;
    }

    ckbAddress(): HexString {
        const script = this.l1LockScript();
        return encodeToAddress(script);
    }

    ckbSecpLockArgs(): CkbSecpLockArgs {
        return this.ckbSecpLockArgs__;
    }

    l1LockScript(): Script {
        const secp256k1Blake160ScriptConfig= config.getScriptConfig("SECP256K1_BLAKE160");
        return {
            code_hash: secp256k1Blake160ScriptConfig.CODE_HASH,
            hash_type: secp256k1Blake160ScriptConfig.HASH_TYPE,
            args: this.ckbSecpLockArgs()
        };
    }

    l2LockScript(): Script {
        const ethAccountLockScriptConfig =config.getScriptConfig("eth_account_lock");
        const rollupTypeHash = config.ROLLUP_TYPE_HASH();
        return {
            code_hash: ethAccountLockScriptConfig.CODE_HASH,
            hash_type: ethAccountLockScriptConfig.HASH_TYPE,
            args: rollupTypeHash.slice(2) + this.ethAddress__,
        };
    }
}

// NOTE: privateKey is SECP256K1 key
export class UserWithPrivateKey extends User {
    readonly privateKey__: SECP256K1PrivateKey;

    static privateKeyToEthAddress(privateKey: SECP256K1PrivateKey) {
        const ecdh = crypto.createECDH(`secp256k1`);
        ecdh.generateKeys();
        ecdh.setPrivateKey(Buffer.from(privateKey.slice(2), "hex"));
        const publicKey: string = "0x" + ecdh.getPublicKey("hex", "uncompressed");
        const ethAddress =
            "0x" +
            keccak256(Buffer.from(publicKey.slice(4), "hex"))
                .slice(12)
                .toString("hex");
        return ethAddress;
    }

    static privateKeyToCkbSecp256k1LockArgs(privateKey: SECP256K1PrivateKey): HexString {
        return key.privateKeyToBlake160(privateKey);
    }

    constructor(privateKey: SECP256K1PrivateKey) {
        super(UserWithPrivateKey.privateKeyToEthAddress(privateKey), UserWithPrivateKey.privateKeyToCkbSecp256k1LockArgs(privateKey));
        this.privateKey__ = privateKey;
    }
}