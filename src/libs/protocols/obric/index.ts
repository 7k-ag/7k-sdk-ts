import { Transaction } from "@mysten/sui/transactions";
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";
import { BaseContract } from "../base";

type ObricExtra = {
  x_price_id: string;
  y_price_id: string;
};
export class ObricContract extends BaseContract {
  async swap(tx: Transaction) {
    const [coinX, coinY] = this.swapInfo.pool.allTokens;
    const xToY = this.swapInfo.swapXtoY;
    const { x_price_id, y_price_id } =
      (this.swapInfo.extra as ObricExtra) || {};
    if (!x_price_id || !y_price_id) {
      throw new Error("x_price_id and y_price_id are required");
    }
    const { package: PACKAGE_ID, pythState: PYTH_STATE } = this.config.obric;
    const [coinOut] = tx.moveCall({
      target: `${PACKAGE_ID}::v2::${xToY ? "swap_x_to_y" : "swap_y_to_x"}`,
      typeArguments: [coinX.address, coinY.address],
      arguments: [
        tx.object(this.swapInfo.poolId),
        tx.object(SUI_CLOCK_OBJECT_ID),
        tx.object(PYTH_STATE),
        tx.object(x_price_id), // pyth pricefeed for x
        tx.object(y_price_id), // pyth pricefeed for y
        this.inputCoinObject,
      ],
    });

    return coinOut;
  }
}
