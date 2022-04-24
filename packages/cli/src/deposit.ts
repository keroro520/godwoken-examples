import {
    Transaction,
    commons,
    HexNumber,
    HexString,
    Output,
    utils,
    Script,
    helpers,
    Cell,
    Hash,
    CellDep
} from "@ckb-lumos/lumos";
import * as provider from "./provider";
import {User, UserWithPrivateKey} from "./user";
import {DepositLockArgs, DepositLockArgsCodec,} from "./schema"
import * as config from "./config";
import {toBigUInt128LE} from "@ckb-lumos/base/lib/utils";
import {ETH_REGISTRY_ID ,FEE,MINIMAL_CKB_CELL_CAPACITY} from "./constant";
import {sumCkbCapacity,sumSudtAmount} from "./util";
import {common} from "@ckb-lumos/common-scripts";
import {key} from "@ckb-lumos/hd";
import {sealTransaction} from "@ckb-lumos/helpers";

export function buildDepositLockArgs(receiver: User) : DepositLockArgs {
    const l1LockHash = utils.computeScriptHash(receiver.l1LockScript());
    const l2Lock: Script = receiver.l2LockScript();
    return {
        owner_lock_hash: l1LockHash,
        layer2_lock: l2Lock,
        cancel_timeout: "0xc0000000000004b0",
        registry_id: "0x"+ ETH_REGISTRY_ID.toString(16),
    }
}

export function buildDepositLock(receiver: User) : Script {
    const depositLockArgs = buildDepositLockArgs(receiver);
    const depositLockArgsCodec = new DepositLockArgsCodec(depositLockArgs);
    const args = "0x" + config.ROLLUP_TYPE_HASH().slice(2) + depositLockArgsCodec.TrimmedHexSerialize();
    return {
        code_hash: config.getScriptConfig("deposit_lock").CODE_HASH,
        hash_type: config.getScriptConfig("deposit_lock").HASH_TYPE,
        args,
    };
}

export function buildDepositOutputCell(
    sender: UserWithPrivateKey,
    receiver: User,
    ckbCapacity: bigint,
    sudtAmount: bigint = BigInt(0),
    sudtScript?: Script,
): Cell {
    if (sudtAmount === BigInt(0)) {
        // Deposit CKB only
        const cell_output: Output = {
            capacity: "0x" + ckbCapacity.toString(16),
            lock: buildDepositLock(receiver),
            type: undefined,
        };
        const cell: Cell = {
            cell_output,
            data: "0x",
        };
        return cell;
    } else {
        // Deposit CKB and SUDT
        const cell_output: Output = {
            capacity: "0x" + ckbCapacity.toString(16),
            lock: buildDepositLock(receiver),
            type: sudtScript!,
        };
        const cell: Cell = {
            cell_output,
            data: toBigUInt128LE(sudtAmount),
        };
        return cell;
    }
}

export async function collectLiveCells(
    sender: UserWithPrivateKey,
    outputCells: Cell[],
    sudtScript?: Script,
): Promise<Cell[]> {
    const outputCkbCapacity= sumCkbCapacity(outputCells);
    let outputSudtAmount= BigInt(0);
    if (sudtScript) {
        outputSudtAmount = sumSudtAmount(outputCells, sudtScript!);
    }

    let collectedCkbCapacity= BigInt(0);
    let collectedSudtAmount = BigInt(0);
    let collectedInputCells : Cell[] = [];
    if (outputSudtAmount > BigInt(0)) {
        const collector = provider.ckbIndexer.collector({
            lock: sender.l1LockScript(),
            type: sudtScript,
        });
        for await (const cell of collector.collect()) {
            collectedInputCells.push(cell);
            collectedCkbCapacity += BigInt(cell.cell_output.capacity);
            collectedSudtAmount += utils.readBigUInt128LE(cell.data);

            if (collectedSudtAmount >= outputSudtAmount && collectedCkbCapacity >= outputCkbCapacity + FEE + MINIMAL_CKB_CELL_CAPACITY) {
                break;
            }
        }
    }
    if (collectedSudtAmount >= outputSudtAmount && collectedCkbCapacity >= outputCkbCapacity + FEE + MINIMAL_CKB_CELL_CAPACITY) {
        return collectedInputCells;
    } else if (collectedSudtAmount < outputSudtAmount) {
        throw new Error(`Not enough SUDT, expected: ${outputSudtAmount}, actual: ${collectedSudtAmount}`);
    }

    const collector = provider.ckbIndexer.collector({
        lock: sender.l1LockScript(),
        type: "empty",
        data: "0x",
    });
    for await (const cell of collector.collect()) {
        collectedInputCells.push(cell);
        collectedCkbCapacity += BigInt(cell.cell_output.capacity);

        if (collectedCkbCapacity >= outputCkbCapacity + FEE + MINIMAL_CKB_CELL_CAPACITY) {
            break;
        }
    }
    if (collectedCkbCapacity >= outputCkbCapacity + FEE + MINIMAL_CKB_CELL_CAPACITY) {
        return collectedInputCells;
    } else {
        throw new Error(`Not enough CKB, expected: ${outputCkbCapacity}, actual: ${collectedCkbCapacity}`);
    }
}

export function buildChangeOutputCell(
    sender: UserWithPrivateKey,
    inputCells: Cell[],
    outputCells: Cell[],
    sudtScript?: Script,
) : Cell{
    const outputCkbCapacity= sumCkbCapacity(outputCells);
    let outputSudtAmount= BigInt(0);
    if (sudtScript) {
        outputSudtAmount = sumSudtAmount(outputCells, sudtScript!);
    }
    const inputCkbCapacity= sumCkbCapacity(inputCells);
    let inputSudtAmount= BigInt(0);
    if (sudtScript) {
        inputSudtAmount = sumSudtAmount(inputCells, sudtScript!);
    }

    if (outputCkbCapacity < inputCkbCapacity + FEE + MINIMAL_CKB_CELL_CAPACITY) {
        throw new Error(`Not enough CKB, outputs CKB capacity: ${outputCkbCapacity}, inputs CKB capacity: ${inputCkbCapacity}, fee: ${FEE}, minimal_ckb_cell_capacity: ${MINIMAL_CKB_CELL_CAPACITY}`);
    }
    if (outputSudtAmount < inputSudtAmount) {
        throw new Error(`Not enough SUDT, outputs SUDT amount: ${outputSudtAmount}, inputs SUDT amount: ${inputSudtAmount}`);
    }

    if (outputSudtAmount === inputSudtAmount) {
        const cell: Cell = {
            cell_output: {
                capacity: "0x" + (inputCkbCapacity - outputCkbCapacity - FEE).toString(16),
                lock: sender.l1LockScript(),
                type: undefined,
            },
            data: "0x",
        }
        return cell;
    } else {
        const cell: Cell = {
            cell_output: {
                capacity: "0x" + (inputCkbCapacity - outputCkbCapacity - FEE).toString(16),
                lock: sender.l1LockScript(),
                type: sudtScript,
            },
            data: toBigUInt128LE(inputSudtAmount - outputSudtAmount),
        }
        return cell;
    }
}

export function buildDepositCellDeps(includingSudtCellDep: boolean): CellDep[] {
    if (includingSudtCellDep) {
        return [
            config.getCellDep("deposit_lock"),
            config.getCellDep("SECP256K1_BLAKE160"),
            config.getCellDep("SUDT"),
        ];
    } else {
        return [
            config.getCellDep("deposit_lock"),
            config.getCellDep("SECP256K1_BLAKE160"),
        ];
    }
}

// NOTE: Assume the user use SECP256K1_BLAKE2B as lock script.
export function buildL1Transaction(
    sender: UserWithPrivateKey,
    inputCells: Cell[],
    outputCells: Cell[],
    cellDeps: CellDep[],
) : Transaction {
    let txSkeleton = helpers
        .TransactionSkeleton({ cellProvider: provider.ckbIndexer })
        .update("outputs", (outputs)=>{
            return outputs.push(...outputCells);
        })
        .update("inputs", (inputs)=> {
            return inputs.push(...inputCells);
        })
        .update("cellDeps", (cellDeps_)=>{
            return cellDeps_.push(...cellDeps);
        });
    txSkeleton = common.prepareSigningEntries(txSkeleton);
    const message = txSkeleton.signingEntries.get(0)!.message;
    const signature = key.signRecoverable(message, sender.privateKey__);
    return sealTransaction(txSkeleton, [signature]);
}

//     // Construct L1 transaction
//     let txSkeleton = helpers.TransactionSkeleton({ cellProvider: provider.ckbIndexer });
//     txSkeleton = txSkeleton.update("outputs", (outputs) => {
//         return outputs.push({
//             cell_output: depositOutput, data: depositOutputData,
//         });
//     });
//
//     // TODO Handle CKB change
//
//     const signedTx = await provider.signL1Transaction(txSkeleton);
//     const txHash = await provider.sendL1Transaction(signedTx);
//     return txHash;
// }
