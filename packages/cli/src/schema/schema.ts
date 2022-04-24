import {HexString, Hash, HexNumber, Script} from "@ckb-lumos/base";
import * as normalizers from "./normalizers";
import * as molecule from "./generated";
import {Reader} from "@ckb-lumos/toolkit";

export interface DepositLockArgs {
    owner_lock_hash: Hash,
    layer2_lock: Script,
    cancel_timeout: HexNumber,
    registry_id: HexNumber,
}

export class DepositLockArgsCodec implements DepositLockArgs {
    readonly owner_lock_hash: Hash;
    readonly layer2_lock: Script;
    readonly cancel_timeout: HexNumber;
    readonly registry_id: HexNumber;
    constructor(depositLockArgs: DepositLockArgs) {
        this.owner_lock_hash = depositLockArgs.owner_lock_hash;
        this.layer2_lock = depositLockArgs.layer2_lock;
        this.cancel_timeout = depositLockArgs.cancel_timeout;
        this.registry_id = depositLockArgs.registry_id;
    }

    Normalize(): Object {
        return normalizers.normalizeObject("DepositLockArgs", this, {
            owner_lock_hash: normalizers.normalizeRawData(32),
            layer2_lock: normalizers.toNormalize(normalizers.normalizeScript),
            cancel_timeout: normalizers.normalizeHexNumber(8),
            registry_id: normalizers.normalizeHexNumber(4),
        });
    }

    HexSerialize(): HexString {
        return Reader.from( molecule.SerializeDepositLockArgs( this.Normalize() )  ).serializeJson();
    }

    TrimmedHexSerialize(): string {
        return this.HexSerialize().slice(2);
    }
}
