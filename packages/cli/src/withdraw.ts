import {Fee, RawWithdrawalRequest, RawWithdrawalRequestCodec, WithdrawalRequest} from "./schema/schema";
import keccak256 from "keccak256";
import {Hash, HexNumber, Script} from "@ckb-lumos/lumos";
import {CkbUser, EthUser} from "./user";
import {ckbHash, computeScriptHash} from "@ckb-lumos/base/lib/utils";
import {ETH_REGISTRY_ID} from "./constant";
import * as config from "./config";
import {Reader} from "@ckb-lumos/toolkit";
import {HexString} from "@ckb-lumos/base";

export function buildRawWithdrawalRequest(
    l1CkbUser: CkbUser,
    l2EthUser: EthUser,
    nonce: number,
    chain_id: bigint,
    ckbCapacity: bigint,
    fee: bigint,
    sudtAmount: bigint = BigInt(0),
    sudtScript?: Script,
) : RawWithdrawalRequest {
    const sudtScriptHash : Hash= sudtScript == null ? "0x0000000000000000000000000000000000000000000000000000000000000000" : computeScriptHash(sudtScript);
    const accountScriptHash: Hash = l2EthUser.accountScriptHash();
    const ownerLockHash : Hash= l1CkbUser.l1LockHash();
    const registryId: HexNumber="0x" + ETH_REGISTRY_ID.toString(16);
    return {
        nonce: "0x" + nonce.toString(16),
        chain_id: "0x" + chain_id.toString(16),
        capacity: "0x" + ckbCapacity.toString(16),
        amount: "0x" + sudtAmount.toString(16),
        fee: "0x" + fee.toString(16),
        sudt_script_hash: sudtScriptHash,
        account_script_hash: accountScriptHash,
        owner_lock_hash: ownerLockHash,
        registry_id: registryId,
    }
}

export function buildWithdrawalRequest(
    l1CkbUser: CkbUser,
    l2EthUser: EthUser,
    nonce: number,
    chain_id: bigint,
    ckbCapacity: bigint,
    fee: bigint,
    sudtAmount: bigint = BigInt(0),
    sudtScript?: Script,
): WithdrawalRequest {
    const raw = buildRawWithdrawalRequest(
        l1CkbUser,
        l2EthUser,
        nonce,
        chain_id,
        ckbCapacity,
        fee,
        sudtAmount,
        sudtScript,
    );

    // signing eth message: keccak256(`\x19Ethereum Signed Message: 32` + hash([ROLLUP_TYPE_HASH, raw.json()]))
    const content= config.ROLLUP_TYPE_HASH() +
        (new RawWithdrawalRequestCodec(raw)).HexSerialize().slice(2);
    const message : Hash= ckbHash(Reader.from(content).toArrayBuffer()).serializeJson();

    const eth_prefix_buf = Buffer.from(`\x19Ethereum Signed Message:\n32`);
    const eth_buf = Buffer.concat([
        eth_prefix_buf,
        Buffer.from(message.slice(2), "hex"),
    ]);
    const eth_message : HexString= `0x${keccak256(eth_buf).toString("hex")}`;

    // signature
    let signature : HexString= l2EthUser.sign(eth_message);
    let v = Number.parseInt(signature.slice(-2), 16);
    if (v >= 27) v -= 27;
    signature = signature.slice(0, -2) + v.toString(16).padStart(2, "0");

    return {
        raw,
        signature,
    }
}