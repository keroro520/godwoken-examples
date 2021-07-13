import {
  ContractFactory,
  Contract,
  BigNumberish,
  providers,
  Overrides,
  CallOverrides,
  BigNumber,
  utils as ethersUtils,
  Signer,
  PopulatedTransaction,
} from "ethers";

import { TransactionSubmitter } from "../TransactionSubmitter";
import {
  web3Rpc,
  networkSuffix,
  initGwAccountIfNeeded,
  isGodwoken,
  polyjuice_config,
  polyjuiceRPC,
} from "../common";

import WalletSimple from "../contracts/WalletSimple.sol/WalletSimple.json";
import MintableToken from "../contracts/MintableToken.sol/MintableToken.json";

import { PolyjuiceWallet, PolyjuiceConfig } from "@polyjuice-provider/ethers";
import { AbiItems } from "@polyjuice-provider/base/lib/abi";
import dotenv from "dotenv";
dotenv.config();

const PolyjuiceWalletConfig: PolyjuiceConfig = {
  godwokerOption: {
    godwoken: {
      rollup_type_hash: process.env.ROLLUP_TYPE_HASH!,
      eth_account_lock: {
        code_hash: process.env.ETH_ACCOUNT_LOCK_CODE_HASH!,
        hash_type: "type",
      },
    },
  },
  web3RpcUrl: process.env.WEB3_RPC!,
  abiItems: WalletSimple.abi as AbiItems,
};

type TCallStatic = Contract["callStatic"];
type TransactionResponse = providers.TransactionResponse;

interface IWalletSimpleStaticMethods extends TCallStatic {
  getNextSequenceId(overrides?: CallOverrides): Promise<BigNumber>;
}

interface IWalletSimple extends Contract, IWalletSimpleStaticMethods {
  callStatic: IWalletSimpleStaticMethods;
  init(
    signers: [string, string, string],
    code_hash: string,
    overrides?: Overrides,
  ): Promise<TransactionResponse>;
  sendMultiSig(
    toAddress: string,
    value: BigNumberish,
    data: string,
    expireTime: number,
    sequenceId: string,
    signature: string,
    overrides?: Overrides,
  ): Promise<TransactionResponse>;
}

interface IPolyjuiceAddressStaticMethods extends TCallStatic {
  getPolyjuiceAddress(overrides?: CallOverrides): Promise<string>;
}

interface IPolyjuiceAddress extends Contract, IPolyjuiceAddressStaticMethods {
  callStatic: IPolyjuiceAddressStaticMethods;
}

interface IMintableTokenStaticMethods extends TCallStatic {
  balanceOf(account: string, overrides?: CallOverrides): Promise<BigNumber>;
}

interface IMintableToken extends Contract, IMintableTokenStaticMethods {
  callStatic: IMintableTokenStaticMethods;
  setMinter(
    minter: string,
    overrides?: Overrides,
  ): Promise<TransactionResponse>;
  mint(
    account: string,
    amount: BigNumberish,
    overrides?: Overrides,
  ): Promise<TransactionResponse>;
  populateTransaction: {
    mint(account: string, amount: BigNumberish): Promise<PopulatedTransaction>;
  };
}


const { SIGNER_PRIVATE_KEYS } = process.env;
if (SIGNER_PRIVATE_KEYS == null) {
  console.log("process.env.SIGNER_PRIVATE_KEYS is required");
  process.exit(1);
}
const signerPrivateKeys = SIGNER_PRIVATE_KEYS.split(",") as [string, string];
if (signerPrivateKeys.length !== 2) {
  console.log(
    "Invalid number of signers, required: 2, got:",
    signerPrivateKeys.length,
  );
  process.exit(1);
}

const [signerOne, signerTwo] = signerPrivateKeys.map(
  (signerPrivateKey) =>
    new PolyjuiceWallet(signerPrivateKey, PolyjuiceWalletConfig, web3Rpc),
);
const [signerOneAddress, signerTwoAddress] = [signerOne, signerTwo].map(
  (wallet) => wallet.address,
);

const txOverride = {
  gasPrice: isGodwoken ? 0 : undefined,
  gasLimit: isGodwoken ? 1_000_000 : undefined,
};

async function testMultiSignWallet(deployer: PolyjuiceWallet) {
  const deployerAddress = deployer.address;
  console.log("Deployer address", deployerAddress);
  await initGwAccountIfNeeded(deployerAddress);

  const transactionSubmitter = await TransactionSubmitter.newWithHistory(
    `cache/multi-sign-wallet${networkSuffix ? `-${networkSuffix}-${deployerAddress}` : ""}.json`,
  );

  let receipt = await transactionSubmitter.submitAndWait(
    `Deploy WalletSimple`,
    () => {
      const implementationFactory = new ContractFactory(
        WalletSimple.abi,
        WalletSimple.bytecode,
        deployer,
      );
      const tx = implementationFactory.getDeployTransaction();
      tx.gasPrice = txOverride.gasPrice;
      tx.gasLimit = txOverride.gasLimit;
      return deployer.sendTransaction(tx);
    },
  );
  const walletSimpleAddress = receipt.contractAddress;
  console.log(`    WalletSimple address:`, walletSimpleAddress);

  const walletSimple = new Contract(
    walletSimpleAddress,
    WalletSimple.abi,
    deployer,
  ) as IWalletSimple;

  const signerAddresses: [string, string, string] = [
    signerOneAddress,
    signerTwoAddress,
    deployerAddress,
  ];
  console.log("Signer addresses:", signerAddresses.join(", "));

  await transactionSubmitter.submitAndWait(`Init WalletSimple`, () => {
    return walletSimple.init(
      signerAddresses,
      process.env.ETH_ACCOUNT_LOCK_CODE_HASH!,
      txOverride,
    );
  });

  receipt = await transactionSubmitter.submitAndWait(
    `Deploy MintableToken`,
    () => {
      const implementationFactory = new ContractFactory(
        MintableToken.abi,
        MintableToken.bytecode,
        deployer,
      );
      const tx = implementationFactory.getDeployTransaction();
      tx.gasPrice = txOverride.gasPrice;
      tx.gasLimit = txOverride.gasLimit;
      return deployer.sendTransaction(tx);
    },
  );
  const mintableTokenAddress = receipt.contractAddress;
  console.log(`    MintableToken address:`, mintableTokenAddress);

  const mintableToken = new Contract(
    mintableTokenAddress,
    MintableToken.abi,
    deployer,
  ) as IMintableToken;

  await transactionSubmitter.submitAndWait(`Set WalletSimple as minter`, () => {
    return mintableToken.setMinter(walletSimpleAddress, txOverride);
  });

  console.log(
    "Balance before mint:",
    (await mintableToken.balanceOf(deployerAddress)).toString(),
  );

  await initGwAccountIfNeeded(signerTwoAddress);
  await transactionSubmitter.submitAndWait(
    `Mint 1006 using WalletSimple`,
    async () => {
      const walletSimpleForSignerTwo = new Contract(
        walletSimpleAddress,
        WalletSimple.abi,
        signerTwo,
      ) as IWalletSimple;

      const baseTx = await mintableToken.populateTransaction.mint(
        deployerAddress,
        "1006",
      );

      const sequenceId = await walletSimple.getNextSequenceId();

      console.log(`    Signing tx using signer one(${signerOneAddress})`);
      const signedTx = await generateSignedTx(
        sequenceId,
        baseTx,
        60,
        signerOne,
      );

      console.log(`    Executing tx using signer two(${signerTwoAddress})`);
      return walletSimpleForSignerTwo.sendMultiSig(
        signedTx.toAddress,
        signedTx.value.toString(),
        signedTx.data,
        signedTx.expireTime,
        signedTx.sequenceId,
        signedTx.signature,
        txOverride,
      );
    }, false,
  );

  console.log(
    "Balance after mint:",
    (await mintableToken.balanceOf(deployerAddress)).toString(),
  );
}

async function getSignature(
  signer: Signer,
  prefix: string,
  toAddress: string,
  value: string,
  data: string,
  expireTime: number,
  sequenceId: BigNumber,
): Promise<string> {
  console.log([prefix, toAddress, value, data, expireTime, sequenceId]);
  const operationHash = ethersUtils.solidityKeccak256(
    ["string", "address", "uint256", "bytes", "uint256", "uint256"],
    [prefix, toAddress, value, data, expireTime, sequenceId],
  );

  const signature = await signer.signMessage(
    ethersUtils.arrayify(operationHash),
  );

  // const packed_signature = deployer.godwoker.packSignature(origin_signature);

  // console.log(`origin_signature: ${origin_signature}, packed_signature: ${packed_signature}`);

  return signature;
}

interface ISignedContractInteractionTx {
  toAddress: string;
  value: string;
  data: string;
  expireTime: number;
  sequenceId: string;
  signature: string;
}

export async function generateSignedTx(
  sequenceId: BigNumber,
  baseTx: PopulatedTransaction,
  expireIn: number,
  signer: Signer,
): Promise<ISignedContractInteractionTx> {
  const expireTime = Date.now() + expireIn * 1000;

  const unsignedTx = {
    toAddress: baseTx.to!,
    value: baseTx.value || "0",
    data: baseTx.data!,
    expireTime,
    sequenceId,
  };

  const signature = await getSignature(
    signer,
    "ETHER",
    unsignedTx.toAddress,
    unsignedTx.value.toString(),
    unsignedTx.data,
    unsignedTx.expireTime,
    unsignedTx.sequenceId,
  );

  console.log(`signature: ${signature}`);
  console.log(`unsignedTx.data: ${unsignedTx.data}`);

  return {
    toAddress: unsignedTx.toAddress.toLowerCase(),
    value: unsignedTx.value.toString(),
    data: unsignedTx.data,
    expireTime,
    sequenceId: sequenceId.toString(),
    signature,
  };
}


[
  "1473ec0e7c507de1d5c734a997848a78ee4d30846986d6b1d22002a57ece74ba",
  "f5e9bac200a2eca0b0eead8a327ef3dc148ba10e192d07badad2d195f2488b94",
  "a443ed1e456f0f23bcdf4f302f599cf77530d594ad896e84b549a04b0ea40c10"
].forEach(privKey => {
  testMultiSignWallet(new PolyjuiceWallet(privKey, polyjuice_config, polyjuiceRPC))
    .catch(console.error);
});
