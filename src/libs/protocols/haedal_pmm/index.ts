import { Transaction } from "@mysten/sui/transactions";
import { SUI_CLOCK_OBJECT_ID, toHex } from "@mysten/sui/utils";
import { ExtraOracle } from "../../../types/aggregator";
import { SuiUtils } from "../../../utils/sui";
import { BaseContract } from "../base";

type HaedalPMMExtra = {
  oracles: ExtraOracle[];
};
export class HaedalPMMContract extends BaseContract<HaedalPMMExtra> {
  async swap(tx: Transaction) {
    const [coinX, coinY] = this.swapInfo.pool.allTokens;
    const xToY = this.swapInfo.swapXtoY;
    const oracleX = this.extra.oracles[0].Pyth?.bytes;
    const oracleY = this.extra.oracles[1].Pyth?.bytes;
    if (!oracleX || !oracleY) {
      throw new Error(`Invalid oracle info for swap`);
    }
    const config = this.config.haedal_pmm;
    const [coinOut] = tx.moveCall({
      target: `${config.package}::trader::${
        xToY ? "sell_base_coin" : "sell_quote_coin"
      }`,
      typeArguments: [coinX.address, coinY.address],
      arguments: [
        tx.object(this.swapInfo.poolId),
        tx.object(SUI_CLOCK_OBJECT_ID),
        tx.object(this.pythMap["0x" + toHex(Uint8Array.from(oracleX))]), // pyth pricefeed for x
        tx.object(this.pythMap["0x" + toHex(Uint8Array.from(oracleY))]), // pyth pricefeed for y
        this.inputCoinObject, // mutable coin
        this.getInputCoinValue(tx), // swap amount
        tx.pure.u64(0), // min output amount
      ],
    });

    SuiUtils.collectDust(tx, this.swapInfo.assetIn, this.inputCoinObject);
    return coinOut;
  }
}
