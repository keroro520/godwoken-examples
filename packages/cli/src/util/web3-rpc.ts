import http from "http";
import https from "https";
import { RPC as Rpc } from "@ckb-lumos/toolkit";
import { EthAddress } from "../alias";
import { HexNumber } from "@ckb-lumos/base";
import { WithdrawalRequestExtra, WithdrawalRequestExtraCodec } from "../schema";
import { Hash } from "@ckb-lumos/lumos";

const httpAgent = new http.Agent({
  keepAlive: true,
});
const httpsAgent = new https.Agent({
  keepAlive: true,
});

export class RPC extends Rpc {
  constructor(url: string, options?: object) {
    let agent: http.Agent | https.Agent = httpsAgent;
    if (url.startsWith("http:")) {
      agent = httpAgent;
    }

    options = options || {};
    (options as any).agent ||= agent;
    super(url, options);
  }
}

export class GodwokenWeb3Rpc {
  readonly rpc__: RPC;
  constructor(url: string, options?: object) {
    this.rpc__ = new RPC(url, options);
  }

  public async getBalance(ethAddress: EthAddress): Promise<bigint> {
    const hexBalance = (await this.call_(
      "eth_getBalance",
      ethAddress,
      "latest"
    )) as HexNumber;
    return BigInt(hexBalance);
  }

  public async getNonce(ethAddress: EthAddress): Promise<number> {
    const hexNonce = (await this.call_(
      "eth_getTransactionCount",
      ethAddress,
      "latest"
    )) as HexNumber;
    return Number(hexNonce);
  }

  public async getChainId(): Promise<bigint> {
    const hexChainId = (await this.call_("eth_chainId")) as HexNumber;
    return BigInt(hexChainId);
  }

  public async getWithdrawal(
    withdrawalHash: Hash
  ): Promise<{ status: string }> {
    return (await this.call_("gw_get_withdrawal", withdrawalHash, 1)) as {
      status: string;
    };
  }

  public async submitWithdrawalRequest(
    withdrawalRequestExtra: WithdrawalRequestExtra
  ): Promise<Hash> {
    const serialized = new WithdrawalRequestExtraCodec(
      withdrawalRequestExtra
    ).HexSerialize();
    return (await this.call_(
      "gw_submit_withdrawal_request",
      serialized
    )) as Hash;
  }

public async getEthAccountLockHash(): Promise<Hash> {
    return (await this.call_("poly_getEthAccountLockHash")) as Hash;
  }

public async getRollupTypeHash(): Promise<Hash> {
    return (await this.call_("poly_getRollupTypeHash")) as Hash;
  }

  private async call_(method: string, ...args: any[]): Promise<any> {
    try {
      const result = await this.rpc__[method](...args);
      return result;
    } catch (err: any) {
      console.error(
        `Call to GodwokenWeb3 ${method}(${args}), error: ${err.message}`
      );
      throw err;
    }
  }
}
