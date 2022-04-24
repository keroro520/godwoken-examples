"use strict";
exports.__esModule = true;
exports.initializeConfig = exports.getScriptConfig = exports.getCellDep = exports.ROLLUP_TYPE_HASH = exports.CKB_INDEXER_URL = exports.CKB_RPC_URL = void 0;
var lumosConfigManager = require("@ckb-lumos/config-manager");
function CKB_RPC_URL() {
    return process.env.CKB_RPC_URL;
}
exports.CKB_RPC_URL = CKB_RPC_URL;
function CKB_INDEXER_URL() {
    return process.env.CKB_INDEXER_URL;
}
exports.CKB_INDEXER_URL = CKB_INDEXER_URL;
function ROLLUP_TYPE_HASH() {
    return process.env.ROLLUP_TYPE_HASH;
}
exports.ROLLUP_TYPE_HASH = ROLLUP_TYPE_HASH;
function getCellDep(scriptName) {
    var scriptConfig = lumosConfigManager.getConfig().SCRIPTS[scriptName];
    return {
        dep_type: scriptConfig.DEP_TYPE,
        out_point: {
            tx_hash: scriptConfig.TX_HASH,
            index: scriptConfig.INDEX
        }
    };
}
exports.getCellDep = getCellDep;
function getScriptConfig(scriptName) {
    return lumosConfigManager.getConfig().SCRIPTS[scriptName];
}
exports.getScriptConfig = getScriptConfig;
function initializeConfig(scriptConfigsFile) {
    if (!process.env.CKB_RPC_URL) {
        throw new Error("Miss environment variable \"CKB_RPC_URL\"");
    }
    if (!process.env.CKB_INDEXER_URL) {
        throw new Error("Miss environment variable \"CKB_INDEXER_URL\"");
    }
    if (!process.env.ROLLUP_TYPE_HASH) {
        throw new Error("Miss environment variable \"ROLLUP_TYPE_HASH\"");
    }
    if (!process.env.ROLLUP_TYPE_HASH.startsWith("0x") || process.env.ROLLUP_TYPE_HASH.length != 20) {
        throw new Error("Invalid environment variable \"ROLLUP_TYPE_HASH\": \"" + process.env.ROLLUP_TYPE_HASH + "\", expected 0x-prefix 20bytes");
    }
    var scriptConfigs = require(scriptConfigsFile);
    var config = {
        PREFIX: process.env.LUMOS_CONFIG_PREFIX || "ckt",
        SCRIPTS: scriptConfigs
    };
    lumosConfigManager.initializeConfig(config);
}
exports.initializeConfig = initializeConfig;
