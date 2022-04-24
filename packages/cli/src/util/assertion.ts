import {EthAddress} from "../types";

export function assertEthAddress(ethAddress: EthAddress): void {
    if (ethAddress.length != 20) {
        throw new Error(`Invalid ETH address ${ethAddress}: unmatched length, expected: 20, actual: ${ethAddress.length}`);
    }
    if (ethAddress.slice(0, 2) != "0x") {
        throw new Error(`Invalid ETH address ${ethAddress}: unexpected prefix, expected: "0x", actual: ${ethAddress.slice(0, 2)}`);
    }
}
