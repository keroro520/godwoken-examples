import { Hash, HexString, Script } from "@ckb-lumos/lumos";
import * as config from "./config";
import { key } from "@ckb-lumos/hd";
import { EthAddress, SECP256K1PrivateKey, CkbSecpLockArgs } from "./alias";
import * as crypto from "crypto";
import keccak256 from "keccak256";
import { encodeToAddress } from "@ckb-lumos/helpers";
import { utils } from "@ckb-lumos/base";

// https://github.com/nervosnetwork/godwoken/blob/d6c98d8f8a199b6ec29bc77c5065c1108220bb0a/crates/common/src/builtins.rs#L5
export const ETH_REGISTRY_ID: number = 2;
// https://github.com/nervosnetwork/godwoken/blob/e1d5279ac442a785bace655758cdb570c0fa7f43/crates/generator/src/account_lock_manage/eip712/types.rs#L73-L82
export const ETH_REGISTRY_NAME: string = "ETH";

// NOTE: L2 lock script is ETH lock script
export class EthUser {
  readonly privateKey__?: SECP256K1PrivateKey;
  readonly ethAddress__: EthAddress;

  constructor(ethAddress: EthAddress, privateKey?: SECP256K1PrivateKey) {
    this.privateKey__ = privateKey;
    this.ethAddress__ = ethAddress;
  }

  static privateKeyToEthAddress(privateKey: SECP256K1PrivateKey): EthAddress {
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

  ethAddress(): EthAddress {
    return this.ethAddress__;
  }

  ethRegistryName(): HexString {
    return ETH_REGISTRY_NAME;
  }

  ethRegistryId(): number {
    return ETH_REGISTRY_ID;
  }

  l2LockScript(): Script {
    const ethAccountLockScriptConfig = config.getScriptConfig(
      "eth_account_lock"
    );
    const rollupTypeHash = config.ROLLUP_TYPE_HASH();
    return {
      code_hash: ethAccountLockScriptConfig.CODE_HASH,
      hash_type: ethAccountLockScriptConfig.HASH_TYPE,
      args: rollupTypeHash + this.ethAddress__.slice(2),
    };
  }

  l2LockHash(): Hash {
    return utils.computeScriptHash(this.l2LockScript());
  }

  accountScriptHash(): Hash {
    return this.l2LockHash();
  }
}

// NOTE: L1 lock script is SECP256K1 lock script
export class CkbUser {
  readonly privateKey__: SECP256K1PrivateKey;
  readonly ckbSecpLockArgs__: CkbSecpLockArgs;

  constructor(privateKey: SECP256K1PrivateKey) {
    this.privateKey__ = privateKey;
    this.ckbSecpLockArgs__ = CkbUser.privateKeyToCkbSecp256k1LockArgs(
      privateKey
    );
  }

  static privateKeyToCkbSecp256k1LockArgs(
    privateKey: SECP256K1PrivateKey
  ): HexString {
    return key.privateKeyToBlake160(privateKey);
  }

  ckbAddress(): HexString {
    const script = this.l1LockScript();
    return encodeToAddress(script);
  }

  ckbSecpLockArgs(): CkbSecpLockArgs {
    return this.ckbSecpLockArgs__;
  }

  l1LockScript(): Script {
    const secp256k1Blake160ScriptConfig = config.getScriptConfig(
      "SECP256K1_BLAKE160"
    );
    return {
      code_hash: secp256k1Blake160ScriptConfig.CODE_HASH,
      hash_type: secp256k1Blake160ScriptConfig.HASH_TYPE,
      args: this.ckbSecpLockArgs(),
    };
  }

  l1LockHash(): Hash {
    return utils.computeScriptHash(this.l1LockScript());
  }
}
