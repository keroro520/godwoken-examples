import {utils, Script, Cell, Transaction, Hash, RPC, HexString} from "@ckb-lumos/lumos";
import {ckbRpc} from "../provider";

export function sumCkbCapacity(cells: Cell[]) : bigint{
    return cells.reduce((acc, cell)=>acc+=BigInt(cell.cell_output.capacity), BigInt(0));
}

export function sumSudtAmount(cells: Cell[], sudtScript: Script):bigint{
    return cells.reduce((acc, cell)=>{
        const amount = cell.cell_output.type === sudtScript ? acc+utils.readBigUInt128LE(cell.data) : BigInt(0);
        return acc+amount;
    }, BigInt(0));
}

export async function asyncSleep(ms = 0) {
    return new Promise((r) => setTimeout(r, ms));
}

export async function waitL1TxCommitted(
    txHash: Hash,
    ckbRpc: RPC,
    timeout: number = 300,
    loopInterval = 10
) : Promise<void>{
    for (let index = 0; index < timeout; index += loopInterval) {
        try {
            const txWithStatus = await ckbRpc.get_transaction(txHash);
            console.debug(`tx ${txHash} is ${txWithStatus}, waited for ${index} seconds`);
            if (txWithStatus!=null) {
                const status = txWithStatus.tx_status.status;
                if (status === "committed") {
                    console.log(`tx ${txHash} is committed!`);
                    return;
                }
            }

            await asyncSleep(loopInterval * 1000);
        } catch (error) {
            console.error(error);
            await asyncSleep(loopInterval * 1000);
        }
    }
    throw new Error(`tx ${txHash} not committed in ${timeout} seconds`);
}