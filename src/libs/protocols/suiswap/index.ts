import { Transaction } from "@mysten/sui/transactions";

import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";
import { BaseContract } from "../base";
import { SuiUtils } from "../../../utils/sui";

const PACKAGE_ID =
  "0xd075d51486df71e750872b4edf82ea3409fda397ceecc0b6aedf573d923c54a0";
const MODULE_NAME = "pool";

export class SuiswapContract extends BaseContract {
  async swap(tx: Transaction) {
    const poolId = this.swapInfo.poolId;
    const swapXtoY = this.swapInfo.swapXtoY;
    const inputCoin = this.inputCoinObject as any;
    const typeArguments = [this.swapInfo.coinX.type, this.swapInfo.coinY.type];
    const callFunc = swapXtoY
      ? "do_swap_x_to_y_direct"
      : "do_swap_y_to_x_direct";

    const inputAmount = this.getInputCoinValue(tx);
    const [tokenIn, tokenOut] = tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::${callFunc}`,
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

    SuiUtils.transferOrDestroyZeroCoin(
      tx,
      this.swapInfo.assetIn,
      tokenIn,
      this.currentAccount,
    );
    return tokenOut;
  }
}
