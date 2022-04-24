import * as config from "./config";
import {RPC,Indexer} from "@ckb-lumos/lumos";

export const ckbRpc = new RPC(config.CKB_RPC_URL());
export const ckbIndexer = new Indexer(config.CKB_INDEXER_URL(), config.CKB_RPC_URL());
