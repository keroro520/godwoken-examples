import * as lumosConfigManager from "@ckb-lumos/config-manager";
import { Hash, CellDep, Script } from "@ckb-lumos/lumos";
import { BETANET } from "./predefined";
import { HexString } from "@ckb-lumos/base";
import { computeScriptHash } from "@ckb-lumos/base/lib/utils";
import { GodwokenWeb3Rpc } from "./util/web3-rpc";

export { ScriptConfig } from "@ckb-lumos/config-manager";

export function CKB_RPC_URL(): string {
  return process.env.CKB_RPC_URL || "http://127.0.0.1:8114";
}

export function CKB_INDEXER_URL(): string {
  return process.env.CKB_INDEXER_URL || "http://127.0.0.1:8116";
}

export function GODWOKEN_WEB3_URL(): string {
  return process.env.GODWOKEN_WEB3_URL || "http://127.0.0.1:8024";
}

/*
  @returns Rollup script hash
 */
export function ROLLUP_TYPE_HASH(): Hash {
  return computeScriptHash(ROLLUP_SCRIPT());
}

export function ROLLUP_SCRIPT_ARGS(): HexString {
  return process.env.ROLLUP_SCRIPT_ARGS!;
}

export function ROLLUP_SCRIPT(): Script {
  const scriptConfig = getScriptConfig("rollup_type_script");
  return {
    code_hash: scriptConfig.CODE_HASH,
    hash_type: scriptConfig.HASH_TYPE,
    args: ROLLUP_SCRIPT_ARGS(),
  };
}

export function getCellDep(scriptName: string): CellDep {
  const scriptConfig = lumosConfigManager.getConfig().SCRIPTS[scriptName]!;
  return {
    dep_type: scriptConfig.DEP_TYPE,
    out_point: {
      tx_hash: scriptConfig.TX_HASH,
      index: scriptConfig.INDEX,
    },
  };
}

export function getScriptConfig(
  scriptName: string
): lumosConfigManager.ScriptConfig {
  return lumosConfigManager.getConfig().SCRIPTS[scriptName]!;
}

// TODO: Verify if all the scripts code exist
export async function initializeConfig(lumosConfigFile: string) {
  if (!process.env.ROLLUP_SCRIPT_ARGS) {
    throw new Error('Miss environment variable "ROLLUP_SCRIPT_ARGS"');
  }

  if (lumosConfigFile.toUpperCase() === "BETANET") {
    console.log(`Load pre-defined configuration: "BETANET"`);
    lumosConfigManager.initializeConfig(BETANET);
  } else {
    console.log(`Load self-defined configuration: "${lumosConfigFile}"`);
    const config: lumosConfigManager.Config = require(lumosConfigFile);
    lumosConfigManager.initializeConfig(config);
  }


 const ethAccountLockScriptConfig = getScriptConfig("eth_account_lock");
 const ethAccountLockScript : Script = {
   code_hash: ethAccountLockScriptConfig.CODE_HASH,
   hash_type: ethAccountLockScriptConfig.HASH_TYPE,
   args: "0x",
 };
 const ethAccountLockScriptHash: Hash = computeScriptHash(ethAccountLockScript);
 const godwokenWeb3 = new GodwokenWeb3Rpc(GODWOKEN_WEB3_URL());

 console.log("CKB_RPC_URL:", CKB_RPC_URL());
 console.log("CKB_INDEXER_URL:", CKB_INDEXER_URL());
 console.log("GODWOKEN_WEB3_URL:", GODWOKEN_WEB3_URL());
 console.log("ROLLUP_TYPE_HASH:", ROLLUP_TYPE_HASH());
 console.log("ROLLUP_TYPE_SCRIPT:", ROLLUP_SCRIPT());
 console.log("ETH_ACCOUNT_LOCK_SCRIPT_HASH:", ethAccountLockScriptHash);
 console.log("ETH_ACCOUNT_LOCK:", ethAccountLockScript);
 console.log();

//  if (ROLLUP_TYPE_HASH() !== await godwokenWeb3.getRollupTypeHash()) {
//    throw new Error(`Rollup Script is unmatched, configured script hash: ${ROLLUP_TYPE_HASH()}, web3.getRollupTypeHash: ${await godwokenWeb3.getRollupTypeHash()}`);
//  }
//  if ( ethAccountLockScriptHash !== await godwokenWeb3.getEthAccountLockHash()) {
//    throw new Error(`ETH Account Lock is unmatched, configured script hash: ${ethAccountLockScriptHash}, web3.getEthAccountLockHash: ${await godwokenWeb3.getEthAccountLockHash()}`);
//  }
}
