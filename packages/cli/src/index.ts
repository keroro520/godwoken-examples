import { Command } from "commander";
import * as lumosConfigManager from "@ckb-lumos/config-manager";
import puppeteer from "puppeteer";
import * as config from "./config";
import { Cell, CellDep, Hash, Output, Script } from "@ckb-lumos/lumos";
import { CkbUser, EthUser } from "./user";
import {
  buildDepositCellDeps,
  buildDepositOutputCell,
} from "./functional/deposit";
import { buildL1SecpTransaction } from "./util/l1-transaction";
import { ckbIndexer, ckbRpc, godwokenWeb3, SECP256K1PrivateKey } from "./alias";
import {
  waitL1TxCommitted,
  waitL2Deposit,
  waitL2Withdrawal,
  buildChangeOutputCell,
  collectInputCells,
  sumCkbCapacity,
  sumSudtAmount,
  asyncSleep,
} from "./util";
import { FEE, MINIMUM_DEPOSIT_CAPACITY } from "./constant";
import { initializeConfig } from "./config";
import { WithdrawalRequestExtra } from "./schema";
import { buildWithdrawalRequest } from "./functional/withdraw";
import { HexString } from "@ckb-lumos/base";
import keccak256 from "keccak256";
import { faucet } from "./functional/faucet";
import {
  buildUnlockL1Transaction,
  collectFinalizedWithdrawals,
} from "./functional/unlock";

function getCapacity(ckbCapacity: string): bigint {
  const capacity = BigInt(ckbCapacity);
  if (capacity < MINIMUM_DEPOSIT_CAPACITY) {
    throw new Error(
      `Invalid --capacity, expected greater than or equal to ${MINIMUM_DEPOSIT_CAPACITY}`
    );
  }
  return capacity;
}

function getSudtAmount(sudtAmount?: string): bigint {
  return sudtAmount == null ? BigInt(0) : BigInt(sudtAmount);
}

function getSudtScript(sudtScriptArgs: string): Script {
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

function newEthUser(privateKey: string, ethAddress?: string): EthUser {
  if (ethAddress == null) {
    return new EthUser(EthUser.privateKeyToEthAddress(privateKey), privateKey);
  } else {
    return new EthUser(ethAddress);
  }
}

function newDerivedCkbUsers(
  initPrivKey: HexString,
  nDerivedAccounts: number
): CkbUser[] {
  let privkeys: SECP256K1PrivateKey[] = [initPrivKey];
  for (let i = 0; i < nDerivedAccounts; i++) {
    const newKey =
      "0x" + keccak256(privkeys[privkeys.length - 1]).toString("hex");
    privkeys.push(newKey);
  }
  return privkeys.slice(1).map((privkey) => new CkbUser(privkey));
}

function newDerivedEthUsers(
  initPrivKey: HexString,
  nDerivedAccounts: number
): EthUser[] {
  let privkeys: SECP256K1PrivateKey[] = [initPrivKey];
  for (let i = 0; i < nDerivedAccounts; i++) {
    const newKey =
      "0x" + keccak256(privkeys[privkeys.length - 1]).toString("hex");
    privkeys.push(newKey);
  }
  return privkeys
    .slice(1)
    .map(
      (privkey) => new EthUser(EthUser.privateKeyToEthAddress(privkey), privkey)
    );
}

async function tryDeposit(
  ckbUser: CkbUser,
  outputs: Cell[],
  cellDeps: CellDep[],
  sudtScript?: Script,
  retries: number = 0
): Promise<Hash> {
  const sumOutputsCapacity = sumCkbCapacity(outputs);
  const sumOutputsSudtAmount =
    sudtScript == null ? BigInt(0) : sumSudtAmount(outputs, sudtScript!);
  const inputs = await collectInputCells(
    ckbUser,
    sumOutputsCapacity,
    sumOutputsSudtAmount,
    sudtScript
  );
  const changeOutput = buildChangeOutputCell(
    ckbUser,
    inputs,
    outputs,
    sudtScript
  );
  const tx = buildL1SecpTransaction(
    ckbUser,
    inputs,
    [...outputs, changeOutput],
    cellDeps
  );

  try {
    const txHash = await ckbRpc.send_transaction(tx, "passthrough");
    await waitL1TxCommitted(txHash);
    return txHash;
  } catch (err) {
    if (retries === 10) {
      console.error(`[waitL1TxCommitted] throw error ${err}`);
      throw err;
    }

    await asyncSleep(5000);
    return tryDeposit(ckbUser, outputs, cellDeps, sudtScript, retries + 1);
  }
}

async function tryWithdraw(
  ckbUser: CkbUser,
  ethUser: EthUser,
  fee: bigint,
  ckbCapacity: bigint,
  sudtAmount: bigint,
  sudtScript?: Script,
  retries: number = 0
): Promise<Hash> {
  const nonce = await godwokenWeb3.getNonce(ethUser.ethAddress());
  const chainId = await godwokenWeb3.getChainId();
  const withdrawalRequest = buildWithdrawalRequest(
    ckbUser,
    ethUser,
    nonce,
    chainId,
    ckbCapacity,
    fee,
    sudtAmount,
    sudtScript
  );
  const withdrawalRequestExtra: WithdrawalRequestExtra = {
    request: withdrawalRequest,
    owner_lock: ckbUser.l1LockScript(),
  };
  try {
    return await godwokenWeb3.submitWithdrawalRequest(withdrawalRequestExtra);
  } catch (err) {
    if (retries === 10) {
      throw err;
    } else {
      await asyncSleep(5000);
      return tryWithdraw(
        ckbUser,
        ethUser,
        fee,
        ckbCapacity,
        sudtAmount,
        sudtScript,
        retries + 1
      );
    }
  }
}

const program = new Command().version(require("./../package.json").version);

program
  .command("get-balance")
  .requiredOption("-l, --eth-address <ADDRESS>", "ETH address")
  .action(async (program: Command) => {
    const balance = await godwokenWeb3.getBalance(program.ethAddress);
    console.log(`"${program.ethAddress}" has balance ${balance}`);
  });

program
  .command("deposit")
  .requiredOption("-p, --private-key <PRIVATEKEY>", "private key")
  .requiredOption(
    "-c --capacity <CAPACITY>",
    "depositing CKB capacity in shannons"
  )
  .requiredOption("--lumos-config <FILEPATH>", "scripts config file")
  .option(
    "-l, --eth-address <ADDRESS>",
    "ETH address (using --private-key corresponding ETH address if not provided)"
  )
  .option("-m --sudt-amount <AMOUNT>", "depositing SUDT amount, default is 0")
  .option(
    "-s --sudt-script-args <SUDTSCRIPTARGS>",
    "depositing SUDT script args"
  )
  .action(async (program: Command) => {
    await initializeConfig(program.lumosConfig);
    const ckbCapacity = getCapacity(program.capacity);
    const sudtAmount = getSudtAmount(program.sudtAmount);
    const sudtScript =
      sudtAmount === BigInt(0)
        ? undefined
        : getSudtScript(program.sudtScriptArgs!);
    const ckbUser = newCkbUser(program.privateKey);
    const ethUser = newEthUser(program.privateKey, program.ethAddress);
    console.log(`CkbAddress: "${ckbUser.ckbAddress()}"`);
    console.log(`CkbLockArgs: "${ckbUser.ckbSecpLockArgs()}"`);
    console.log(`EthAddress: "${ethUser.ethAddress()}"`);

    const output = buildDepositOutputCell(
      ckbUser,
      ethUser,
      ckbCapacity,
      sudtAmount,
      sudtScript
    );
    const cellDeps = buildDepositCellDeps(sudtAmount > BigInt(0));
    const _txHash = await tryDeposit(ckbUser, [output], cellDeps, sudtScript);
    await waitL2Deposit(ethUser.ethAddress());
  });

program
  .command("withdraw")
  .requiredOption("-p, --private-key <PRIVATEKEY>", "private key")
  .requiredOption(
    "-c --capacity <CAPACITY>",
    "withdrawal CKB capacity in shannons"
  )
  .requiredOption("--lumos-config <FILEPATH>", "scripts config file")
  .requiredOption("--fee <CAPACITY>", "withdrawal fee in shannons")
  .option("-m --sudt-amount <AMOUNT>", "withdrawal SUDT amount, default is 0")
  .option(
    "-s --sudt-script-args <SUDTSCRIPTARGS>",
    "withdrawal SUDT script args"
  )
  .action(async (program: Command) => {
    await initializeConfig(program.lumosConfig);
    const ckbCapacity = getCapacity(program.capacity);
    const sudtAmount = getSudtAmount(program.sudtAmount);
    const sudtScript =
      sudtAmount === BigInt(0)
        ? undefined
        : getSudtScript(program.sudtScriptArgs!);
    const fee: bigint = BigInt(program.fee);
    const ckbUser = newCkbUser(program.privateKey); // I don't want to support specifying CKB address ~
    const ethUser = newEthUser(program.privateKey);
    console.log(`CkbAddress: "${ckbUser.ckbAddress()}"`);
    console.log(`CkbLockArgs: "${ckbUser.ckbSecpLockArgs()}"`);
    console.log(`EthAddress: "${ethUser.ethAddress()}"`);

    const withdrawalHash = await tryWithdraw(
      ckbUser,
      ethUser,
      fee,
      ckbCapacity,
      sudtAmount,
      sudtScript
    );
    await waitL2Withdrawal(withdrawalHash);
  });

program
  .command("batch-deposit")
  .requiredOption("-p, --private-key <PRIVATEKEY>", "private key")
  .requiredOption(
    "-c --capacity <CAPACITY>",
    `depositing CKB capacity in shannons`
  )
  .requiredOption("--lumos-config <FILEPATH>", "scripts config file")
  .option(
    "--n-derived-accounts <NUMBER>",
    "the number of accounts to derived by the provided private key, default is 1000"
  )
  .option("--seconds <SECONDS>", "running time in seconds, default is 600")
  .option(
    "--batch-size <NUMBER>",
    "the batch size of deposit requests, default is 10"
  )
  .option("-m --sudt-amount <AMOUNT>", "depositing SUDT amount, default is 0")
  .option(
    "-s --sudt-script-args <SUDTSCRIPTARGS>",
    "depositing SUDT script args"
  )
  .action(async (program: Command) => {
    // batch-deposit
    await initializeConfig(program.lumosConfig);
    const ckbCapacity = getCapacity(program.capacity);
    const sudtAmount = getSudtAmount(program.sudtAmount);
    const sudtScript =
      sudtAmount === BigInt(0)
        ? undefined
        : getSudtScript(program.sudtScriptArgs!);
    const nDerivedAccounts =
      program.nDerivedAccounts == null ? 100 : Number(program.nDerivedAccounts);
    const ckbUser = newCkbUser(program.privateKey);
    const allEthUsers = newDerivedEthUsers(
      program.privateKey,
      nDerivedAccounts
    );
    console.log(`CkbAddress: "${ckbUser.ckbAddress()}"`);
    console.log(`CkbLockArgs: "${ckbUser.ckbSecpLockArgs()}"`);
    console.log(
      `EthAddresses: ${JSON.stringify(
        allEthUsers.map((ethUser) => ethUser.ethAddress()),
        null,
        2
      )}`
    );

    const allOutputs = allEthUsers.map((ethUser) =>
      buildDepositOutputCell(
        ckbUser,
        ethUser,
        ckbCapacity,
        sudtAmount,
        sudtScript
      )
    );
    const batchSize: number = +program.batchSize || 10;
    for (let start = 0; start < allOutputs.length; start += batchSize) {
      const ethUsers = allEthUsers.slice(start, start + batchSize);
      const outputs = allOutputs.slice(start, start + batchSize);
      const cellDeps = buildDepositCellDeps(sudtScript != null);
      const initBalances = await Promise.all(
        ethUsers.map(
          async (ethUser) => await godwokenWeb3.getBalance(ethUser.ethAddress())
        )
      );
      const _txHash = await tryDeposit(ckbUser, outputs, cellDeps, sudtScript);
      for (let i = 0; i < ethUsers.length; i++) {
        await waitL2Deposit(ethUsers[i].ethAddress(), initBalances[i]);
      }
    }
  });

program
  .command("batch-withdraw")
  .requiredOption("-p, --private-key <PRIVATEKEY>", "private key")
  .requiredOption(
    "-c --capacity <CAPACITY>",
    "withdrawal CKB capacity in shannons"
  )
  .requiredOption("--lumos-config <FILEPATH>", "scripts config file")
  .option("--seconds <SECONDS>", "running time in seconds, default is 600")
  .option(
    "--n-derived-accounts <NUMBER>",
    "the number of accounts to derived by the provided private key, default is 1000"
  )
  .requiredOption("--fee <CAPACITY>", "withdrawal fee in shannons")
  .option("-m --sudt-amount <AMOUNT>", "withdrawal SUDT amount, default is 0")
  .option(
    "-s --sudt-script-args <SUDTSCRIPTARGS>",
    "withdrawal SUDT script args"
  )
  .action(async (program: Command) => {
    // batch-withdraw
    await initializeConfig(program.lumosConfig);
    const ckbCapacity = getCapacity(program.capacity);
    const sudtAmount = getSudtAmount(program.sudtAmount);
    const sudtScript =
      sudtAmount === BigInt(0)
        ? undefined
        : getSudtScript(program.sudtScriptArgs!);
    const fee: bigint = BigInt(program.fee);
    const nDerivedAccounts =
      program.nDerivedAccounts == null ? 100 : Number(program.nDerivedAccounts);
    const ckbUser = newCkbUser(program.privateKey); // I don't want to support specifying CKB address ~
    const allEthUsers = newDerivedEthUsers(
      program.privateKey,
      nDerivedAccounts
    );
    console.log(`CkbAddress: "${ckbUser.ckbAddress()}"`);
    console.log(`CkbLockArgs: "${ckbUser.ckbSecpLockArgs()}"`);
    console.log(
      `EthAddresses: "${JSON.stringify(
        allEthUsers.map((ethUser) => ethUser.ethAddress()),
        null,
        2
      )}"`
    );

    let hashes: Hash[] = [];
    for (const ethUser of allEthUsers) {
      const hash = await tryWithdraw(
        ckbUser,
        ethUser,
        fee,
        ckbCapacity,
        sudtAmount,
        sudtScript
      );
      hashes.push(hash);
    }
    for (const hash of hashes) {
      await waitL2Withdrawal(hash, 10 * 60 * 1000);
    }
  });

program
  .command("unlock")
  .requiredOption("-p, --private-key <PRIVATEKEY>", "private key")
  .requiredOption("--lumos-config <FILEPATH>", "scripts config file")
  .option("--seconds <SECONDS>", "running time in seconds, default is 600")
  .action(async (program: Command) => {
    await initializeConfig(program.lumosConfig);

    const seconds = program.seconds != null ? Number(program.seconds) : 600;
    asyncSleep(seconds * 1000).then(() => process.exit(0));

    const ckbUser = newCkbUser(program.privateKey);
    while (true) {
      try {
        const withdrawals = await collectFinalizedWithdrawals(ckbUser);
        if (withdrawals.length > 0) {
          const tx = await buildUnlockL1Transaction(ckbUser, withdrawals);
          const hash = await ckbRpc.send_transaction(tx, "passthrough");
          console.info(
            `Try unlock ${withdrawals.length} withdrawals in transaction ${hash}`
          );
          await waitL1TxCommitted(hash);
        }
      } catch (err) {
        console.error("Catch error: ", err);
      }

      await asyncSleep(10 * 1000);
    }
  });

program
  .command("faucet")
  .requiredOption("-p, --private-key <PRIVATEKEY>", "private key")
  .option(
    "--n-derived-accounts <NUMBER>",
    "the number of accounts to derived by the provided private key, default is 1000"
  )
  .action(async (program: Command) => {
    lumosConfigManager.initializeConfig(lumosConfigManager.predefined.AGGRON4);

    if (
      process.env.CKB_RPC_URL === "http://127.0.0.1:8114" ||
      process.env.CKB_INDEXER_URL === "http://127.0.0.1:8116"
    ) {
      throw new Error("Are you sure that you are using AGGRON network???");
    }

    const browser = await puppeteer.launch({ headless: true });
    const admin = new CkbUser(program.privateKey);
    const nDerivedAccounts =
      program.nDerivedAccounts == null ? 100 : Number(program.nDerivedAccounts);
    const ckbUsers = newDerivedCkbUsers(program.privateKey, nDerivedAccounts);
    console.log(
      "CkbAddresses:",
      JSON.stringify(
        ckbUsers.map((ckbUser) => ckbUser.ckbAddress()),
        null,
        2
      )
    );
    for (const ckbUser of ckbUsers) {
      const _claimed = await faucet(browser, ckbUser);
    }

    console.log("Try to transfer all capacities to --private-key");
    const ckbTipNumber = BigInt(await ckbRpc.get_tip_block_number());
    console.log("Current CKB tip number is", ckbTipNumber);
    while (true) {
      asyncSleep(1000);
      if (
        BigInt(await ckbRpc.get_tip_block_number()) >=
        ckbTipNumber + BigInt(10)
      ) {
        break;
      }
    }

    for (const ckbUser of ckbUsers) {
      const collector = ckbIndexer.collector({
        lock: ckbUser.l1LockScript(),
        type: "empty",
        data: "0x",
      });
      let hashes: Hash[] = [];
      for await (const input of collector.collect()) {
        const output: Cell = {
          data: "0x",
          cell_output: {
            capacity:
              "0x" + (BigInt(input.cell_output.capacity) - FEE).toString(16),
            lock: admin.l1LockScript(),
            type: undefined,
          },
        };
        const tx = buildL1SecpTransaction(
          ckbUser,
          [input],
          [output],
          [config.getCellDep("SECP256K1_BLAKE160")]
        );
        const hash = await ckbRpc.send_transaction(tx, "passthrough");
        hashes.push(hash);
      }
      for (const hash of hashes) {
        await waitL1TxCommitted(hash);
      }
    }

    await browser.close();
  });

program.parse(program.argv);
