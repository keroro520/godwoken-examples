import * as lumosConfigManager from "@ckb-lumos/config-manager";
import {Hash, CellDep, RPC} from "@ckb-lumos/lumos";
import {ckbRpc} from "./provider";

export {ScriptConfig} from "@ckb-lumos/config-manager";

export function CKB_RPC_URL():string{
    return  process.env.CKB_RPC_URL!;
}

export function CKB_INDEXER_URL():string{
    return process.env.CKB_INDEXER_URL!;
}

export function GODWOKEN_WEB3_URL():string {
    return process.env.GODWOKEN_WEB3_URL!;
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

export function initializeConfig(lumosConfigFile: string, rollupTypeHash: Hash, ckbRpcUrl: string, ckbIndexerUrl: string) {
    process.env["ROLLUP_TYPE_HASH"] = rollupTypeHash;
    process.env["CKB_RPC_URL"] = ckbRpcUrl;
    process.env["CKB_INDEXER_URL"] = ckbIndexerUrl;

    if (!process.env.ROLLUP_TYPE_HASH!.startsWith("0x") || process.env.ROLLUP_TYPE_HASH!.length != 66) {
        console.log(process.env.ROLLUP_TYPE_HASH!.startsWith("0x") , process.env.ROLLUP_TYPE_HASH!.length);
        throw new Error(`Invalid environment variable "ROLLUP_TYPE_HASH": "${process.env.ROLLUP_TYPE_HASH!}", expected 0x-prefix 20bytes`);
    }

    const config: lumosConfigManager.Config = require(lumosConfigFile);
    lumosConfigManager.initializeConfig(config);
}