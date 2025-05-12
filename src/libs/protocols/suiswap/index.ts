import { Transaction } from "@mysten/sui/transactions";

import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";
import { BaseContract } from "../base";
import { SuiUtils } from "../../../utils/sui";

export class SuiswapContract extends BaseContract {
  async swap(tx: Transaction) {
    const poolId = this.swapInfo.poolId;
    const swapXtoY = this.swapInfo.swapXtoY;
    const inputCoin = this.inputCoinObject;
    const typeArguments = [this.swapInfo.coinX.type, this.swapInfo.coinY.type];
    const callFunc = swapXtoY
      ? "do_swap_x_to_y_direct"
      : "do_swap_y_to_x_direct";

    const { package: PACKAGE_ID } = this.config.suiswap;
    const inputAmount = this.getInputCoinValue(tx);
    const [tokenIn, tokenOut] = tx.moveCall({
      target: `${PACKAGE_ID}::pool::${callFunc}`,
      typeArguments,
      arguments: [
        tx.object(poolId),
        tx.makeMoveVec({
          elements: [inputCoin],
        }),
        inputAmount,
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });

    SuiUtils.collectDust(tx, this.swapInfo.assetIn, tokenIn);
    return tokenOut;
  }
}
