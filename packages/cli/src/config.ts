import * as lumosConfigManager from "@ckb-lumos/config-manager";
import {Hash,CellDep} from "@ckb-lumos/lumos";

export {ScriptConfig} from "@ckb-lumos/config-manager";

export function CKB_RPC_URL():string{
    return  process.env.CKB_RPC_URL!;
}

export function CKB_INDEXER_URL():string{
    return process.env.CKB_INDEXER_URL!;
}

export function ROLLUP_TYPE_HASH(): Hash {
    return process.env.ROLLUP_TYPE_HASH!;
}

export function getCellDep(scriptName: string): CellDep {
    const scriptConfig = lumosConfigManager.getConfig().SCRIPTS[scriptName]!;
    return {
        dep_type: scriptConfig.DEP_TYPE,
        out_point: {
            tx_hash: scriptConfig.TX_HASH,
            index: scriptConfig.INDEX,
        }
    };
}

export function getScriptConfig(scriptName: string) : lumosConfigManager.ScriptConfig {
    return lumosConfigManager.getConfig().SCRIPTS[scriptName]!;
}

export function initializeConfig(scriptConfigsFile: string, rollupTypeHash: Hash, ckbRpcUrl: string, ckbIndexerUrl: string) {
    process.env["ROLLUP_TYPE_HASH"] = rollupTypeHash;
    process.env["CKB_RPC_URL"] = ckbRpcUrl;
    process.env["CKB_INDEXER_URL"] = ckbIndexerUrl;

    if (!process.env.ROLLUP_TYPE_HASH!.startsWith("0x") || process.env.ROLLUP_TYPE_HASH!.length != 20) {
        throw new Error(`Invalid environment variable "ROLLUP_TYPE_HASH": "${process.env.ROLLUP_TYPE_HASH!}", expected 0x-prefix 20bytes`);
    }

    const scriptConfigs: lumosConfigManager.ScriptConfigs = require(scriptConfigsFile);
    const config: lumosConfigManager.Config = {
        PREFIX: process.env.LUMOS_CONFIG_PREFIX || "ckt",
        SCRIPTS: scriptConfigs,
    };
    lumosConfigManager.initializeConfig(config);
}