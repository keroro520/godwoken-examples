import * as config from "./config";
import {RPC,Indexer} from "@ckb-lumos/lumos";
import {GodwokenWeb3Rpc} from "./util/web3-rpc";

export const ckbRpc = new RPC(config.CKB_RPC_URL());
export const ckbIndexer = new Indexer(config.CKB_INDEXER_URL(), config.CKB_RPC_URL());
export const godwokenWeb3 = new GodwokenWeb3Rpc(config.GODWOKEN_WEB3_URL());