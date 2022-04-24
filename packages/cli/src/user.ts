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
        this.ethAddress__ = ethAddress;
    }

    ethAddress() : EthAddress {
        return this.ethAddress__;
    }

    l1LockScript(): Script {
        const omniScriptConfig = config.getScriptConfig("omni_lock");
        let l1OmniLockScript: Script= {
            code_hash: omniScriptConfig.CODE_HASH,
            hash_type: omniScriptConfig.HASH_TYPE,
            // omni flag       pubkey hash   omni lock flags
            // chain identity   eth addr      function flag()
            // 00: Nervos       👇            00: owner
            // 01: Ethereum     👇            01: administrator
            //      👇          👇            👇
            args: `0x01${this.ethAddress__}00`,
        };
        return l1OmniLockScript;
    }

    l2LockScript(): Script {
        const ethAccountLockScriptConfig =config.getScriptConfig("eth_account_lock");
        const rollup
        const l2EthLockScript: Script = {
            code_hash: config.ETH_ACCOUNT_LOCK_TYPE_HASH,
            hash_type: "type",
            args: config.ROLLUP_TYPE_HASH + this.ethAddress__.toLowerCase(),
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