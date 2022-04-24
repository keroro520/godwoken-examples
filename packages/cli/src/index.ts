import {Command} from "commander";
import * as config from "./config";
import {Cell, CellDep, HexString, Script} from "@ckb-lumos/lumos";
import {CkbUser, EthUser} from "./user";
import {
    buildChangeOutputCell,
    buildDepositCellDeps,
    buildDepositOutputCell,
    buildL1Transaction,
    collectInputCells
} from "./deposit";
import {ckbRpc} from "./provider";
import {waitL1TxCommitted} from "./util";

function getCapacity(capacity: string) : bigint {
    return BigInt(capacity);
}

function getSudtAmount(sudtAmount?: string) : bigint {
    return sudtAmount == null ? BigInt(0): BigInt(sudtAmount.slice(2));
}

function getSudtScript(sudtScriptArgs?: string) : Script | undefined {
    if (sudtScriptArgs == null) {
        return undefined;
    } else {
        if (!sudtScriptArgs!.startsWith("0x")) {
            throw new Error("Invalid --sudt-script-args, expected 0x-prefix string");
        }
        return {
            code_hash: config.getScriptConfig("SUDT").CODE_HASH,
            hash_type: config.getScriptConfig("SUDT").HASH_TYPE,
            args: sudtScriptArgs!,
        };
    }
}

function newCkbUser(privateKey: string): CkbUser {
    if (!privateKey!.startsWith("0x")) {
        throw new Error("Invalid --private-key, expected 0x-prefix string");
    }
    return new CkbUser(privateKey);
}

function newEthUser(privateKey: string, ethAddress?: string, ) : EthUser {
    if (ethAddress == null) {
        return new EthUser(EthUser.privateKeyToEthAddress(privateKey), privateKey);
    } else {
        return new EthUser(ethAddress);
    }
}

const program = new Command();
program
    .version(require('./../package.json').version);
program
    .command("deposit")
    .option(
        "-r --ckb-rpc-url <RPC>",
        "CKB RPC URL",
        "http://127.0.0.1:8114"
    )
    .option("-i, --indexer <INDEXER>", "CKB Indexer RPC URL", "http://127.0.0.1:8116")
    .option(
        "-l, --eth-address <ADDRESS>",
        "ETH address (using --private-key corresponding ETH address if not provided)"
    )
    .option("-m --sudt-amount <AMOUNT>", "depositing SUDT amount, default is 0")
    .option("-s --sudt-script-args <SUDTSCRIPTARGS>", "depositing SUDT script args")
    .requiredOption("-p, --private-key <PRIVATEKEY>", "private key")
    .requiredOption("-c --capacity <CAPACITY>", "depositing CKB capacity in shannons")
    .action(async (program: Command) =>{
        const ckbCapacity= getCapacity(program.capacity);
        const sudtScript = getSudtScript(program.sudtScriptArgs);
        const sudtAmount = getSudtAmount(program.sudtAmount);
        const ckbUser = newCkbUser(program.privateKey);
        const ethUser = newEthUser(program.ethAddress, program.privateKey);
        const output = buildDepositOutputCell(ckbUser, ethUser, ckbCapacity,sudtAmount,sudtScript);
        const outputCapacity = BigInt(output.cell_output.capacity.slice(2));
        const inputs = await collectInputCells(ckbUser,outputCapacity,sudtAmount,sudtScript);
        const changeOutput = buildChangeOutputCell(ckbUser,inputs,[output], sudtScript);
        const cellDeps = buildDepositCellDeps(sudtAmount > BigInt(0));
        const tx = buildL1Transaction(ckbUser,inputs,[output,changeOutput], cellDeps);
        const txHash = await ckbRpc.send_transaction(tx, "passthrough");
        await waitL1TxCommitted(txHash,ckbRpc);
    });

program.parse(program.argv);
