import {Script} from "@ckb-lumos/lumos";
import * as config from "./config";
import {key} from "@ckb-lumos/hd";
import {assertEthAddress} from "./util/assertion";
import {EthAddress, SECP256K1PrivateKey} from "./types";

// NOTE: L1 lock script is SECP256K1 lock script
// NOTE: L2 lock script is ETH lock script
export class User {
    readonly ethAddress__: EthAddress;

    constructor(ethAddress: EthAddress) {
        assertEthAddress(ethAddress);
        this.ethAddress__ = ethAddress.toLowerCase();
    }

    ethAddress() : EthAddress {
        return this.ethAddress__;
    }

    l2LockScript(): Script {
        const ethAccountLockScriptConfig =config.getScriptConfig("eth_account_lock");
        const rollupTypeHash = config.ROLLUP_TYPE_HASH();
        const l2EthLockScript: Script = {
            code_hash: ethAccountLockScriptConfig.CODE_HASH,
            hash_type: ethAccountLockScriptConfig.HASH_TYPE,
            args: rollupTypeHash.slice(2) + this.ethAddress__,
        };
        return l2EthLockScript;
    }
}

// NOTE: privateKey is SECP256K1 key
export class UserWithPrivateKey extends User {
    readonly privateKey__: SECP256K1PrivateKey;

    static privateKeyToEthAddress(privateKey: SECP256K1PrivateKey): EthAddress{
        return key.privateKeyToBlake160(privateKey);
    }

    constructor(privateKey: SECP256K1PrivateKey) {
        super(UserWithPrivateKey.privateKeyToEthAddress(privateKey));
        this.privateKey__ = privateKey;
    }
}