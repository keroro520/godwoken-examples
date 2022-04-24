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
import {MINIMUM_DEPOSIT_CAPACITY} from "./constant";
import {initializeConfig} from "./config";

function getCapacity(ckbCapacity: string) : bigint {
    const capacity = BigInt(ckbCapacity);
    if (capacity < MINIMUM_DEPOSIT_CAPACITY) {
        throw new Error(`Invalid --capacity, expected greater than or equal to ${MINIMUM_DEPOSIT_CAPACITY}`);
    }
    return capacity;
}

function getSudtAmount(sudtAmount?: string) : bigint {
    return sudtAmount == null ? BigInt(0): BigInt(sudtAmount.slice(2));
}

function getSudtScript(sudtScriptArgs: string) : Script {
    if (!sudtScriptArgs!.startsWith("0x")) {
        throw new Error("Invalid --sudt-script-args, expected 0x-prefix string");
    }
    return {
        code_hash: config.getScriptConfig("SUDT").CODE_HASH,
        hash_type: config.getScriptConfig("SUDT").HASH_TYPE,
        args: sudtScriptArgs!,
    };
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
    .requiredOption("-p, --private-key <PRIVATEKEY>", "private key")
    .requiredOption("-c --capacity <CAPACITY>", "depositing CKB capacity in shannons")
    .requiredOption("--lumos-config <FILEPATH>", "scripts config file")
    .requiredOption("--rollup-type-hash <HASH>", "rollup type hash")
    .option(
        "-r --ckb-rpc-url <RPC>",
        "CKB RPC URL",
        "http://127.0.0.1:8114"
    )
    .option("-i, --ckb-indexer-url <INDEXER>", "CKB Indexer RPC URL", "http://127.0.0.1:8116")
    .option(
        "-l, --eth-address <ADDRESS>",
        "ETH address (using --private-key corresponding ETH address if not provided)"
    )
    .option("-m --sudt-amount <AMOUNT>", "depositing SUDT amount, default is 0")
    .option("-s --sudt-script-args <SUDTSCRIPTARGS>", "depositing SUDT script args")
    .action(async (program: Command) =>{
        initializeConfig(program.lumosConfig, program.rollupTypeHash, program.ckbRpcUrl || "http://127.0.0.1:8114", program.ckbIndexerUrl || "http://localhost:8116");
        const ckbCapacity= getCapacity(program.capacity);
        const sudtAmount = getSudtAmount(program.sudtAmount);
        const sudtScript = sudtAmount === BigInt(0) ? undefined : getSudtScript(program.sudtScriptArgs!);
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
