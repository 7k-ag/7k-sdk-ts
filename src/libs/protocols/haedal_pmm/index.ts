import { Transaction } from "@mysten/sui/transactions";
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";
import { BaseContract } from "../base";
import { SuiUtils } from "../../../utils/sui";

type HaedalPMMExtra = {
  x_price_id: string;
  y_price_id: string;
};
export class HaedalPMMContract extends BaseContract {
  async swap(tx: Transaction) {
    const [coinX, coinY] = this.swapInfo.pool.allTokens;
    const xToY = this.swapInfo.swapXtoY;
    const { x_price_id, y_price_id } =
      (this.swapInfo.extra as HaedalPMMExtra) || {};
    if (!x_price_id || !y_price_id) {
      throw new Error("x_price_id and y_price_id are required");
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
        tx.object(x_price_id), // pyth pricefeed for x
        tx.object(y_price_id), // pyth pricefeed for y
        this.inputCoinObject, // mutable coin
        this.getInputCoinValue(tx), // swap amount
        tx.pure.u64(0), // min output amount
      ],
    });

    SuiUtils.collectDust(tx, this.swapInfo.assetIn, this.inputCoinObject);
    return coinOut;
  }
}
