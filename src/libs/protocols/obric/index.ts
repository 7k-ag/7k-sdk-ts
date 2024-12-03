import { Transaction } from "@mysten/sui/transactions";
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";
import { BaseContract } from "../base";

const PACKAGE_ID =
  "0xb84e63d22ea4822a0a333c250e790f69bf5c2ef0c63f4e120e05a6415991368f";
const PYTH_STATE =
  "0x1f9310238ee9298fb703c3419030b35b22bb1cc37113e3bb5007c99aec79e5b8";
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
