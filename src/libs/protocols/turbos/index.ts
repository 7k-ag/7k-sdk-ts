import { Transaction } from "@mysten/sui/transactions";

import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";
import { BaseContract } from "../base";
import { getDefaultSqrtPriceLimit } from "../utils";
import { SuiUtils } from "../../../utils/sui";

const ONE_MINUTE = 60 * 1000;

export class TurbosContract extends BaseContract {
  async swap(tx: Transaction) {
    const a2b = this.swapInfo.swapXtoY;

    const { package: PACKAGE_ID, version: VERSION } = this.config.turbos;
    const inputAmount = this.getInputCoinValue(tx);
    const [tokenOut, tokenIn] = tx.moveCall({
      target: `${PACKAGE_ID}::swap_router::swap_${
        a2b ? "a_b" : "b_a"
      }_with_return_`,
      typeArguments: this.getTypeParams(),
      arguments: [
        tx.object(this.swapInfo.poolId),
        tx.makeMoveVec({
          elements: [this.inputCoinObject],
        }),
        inputAmount,
        tx.pure.u64(0),
        tx.pure.u128(
          getDefaultSqrtPriceLimit(this.swapInfo.swapXtoY).toString(),
        ),
        tx.pure.bool(true),
        tx.pure.address(this.currentAccount),
        tx.pure.u64(Date.now() + ONE_MINUTE * 3),
        tx.object(SUI_CLOCK_OBJECT_ID),
        tx.object(VERSION),
      ],
    });

    SuiUtils.collectDust(tx, this.swapInfo.assetIn, tokenIn);
    return tokenOut;
  }
}
