import http from "http";
import https from "https";
import {RPC as Rpc} from "@ckb-lumos/toolkit";
import {EthAddress} from "../types";
import {HexNumber} from "@ckb-lumos/base";
import {readBigUInt128LE} from "@ckb-lumos/base/lib/utils";

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
        const hexBalance = (await this.call_("eth_getBalance", ethAddress, "latest")) as HexNumber;
        return BigInt(hexBalance);
    }

    private async call_(method: string, ...args: any[]): Promise<any> {
        try {
            const result = await this.rpc__[method](...args);
            return result;
        } catch (err: any) {
            console.error(`Call to GodwokenWeb3 ${method}(${args}), error: ${err.message}`);
            throw err;
        }
    }
}