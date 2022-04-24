"use strict";
exports.__esModule = true;
exports.ckbIndexer = exports.ckbRpc = void 0;
var config = require("./config");
var lumos_1 = require("@ckb-lumos/lumos");
exports.ckbRpc = new lumos_1.RPC(config.CKB_RPC_URL());
exports.ckbIndexer = new lumos_1.Indexer(config.CKB_INDEXER_URL(), config.CKB_RPC_URL());
