import * as lumosConfigManager from "@ckb-lumos/config-manager";
import {CellDep} from "@ckb-lumos/lumos";

export {ScriptConfig} from "@ckb-lumos/config-manager";

export function ckb_indexer_url():string{
    return process.env.CKB_INDEXER_URL!;
}

export function ckb_rpc_url():string{
    return  process.env.CKB_RPC_URL!;
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

export function initializeConfig(scriptConfigsFile: string) {
    const scriptConfigs: lumosConfigManager.ScriptConfigs = require(scriptConfigsFile);
    const config: lumosConfigManager.Config = {
        PREFIX: process.env.LUMOS_CONFIG_PREFIX || "ckt",
        SCRIPTS: scriptConfigs,
    };
    lumosConfigManager.initializeConfig(config);
}