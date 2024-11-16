import { Transaction } from "@mysten/sui/transactions";

import { BaseContract } from "../base";

import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";
import { getDefaultSqrtPriceLimit } from "../utils";
import { SuiUtils } from "../../../utils/sui";

const GLOBAL_CONFIG_ID =
  "0xdaa46292632c3c4d8f31f23ea0f9b36a28ff3677e9684980e4438403a67a3d8f";
const INTEGRATE_PACKAGE_ID =
  "0x6f5e582ede61fe5395b50c4a449ec11479a54d7ff8e0158247adfda60d98970b";

export class CetusContract extends BaseContract {
  async swap(tx: Transaction) {
    const sqrtPriceLimit = getDefaultSqrtPriceLimit(this.swapInfo.swapXtoY);
    const typeArguments = [this.swapInfo.coinX.type, this.swapInfo.coinY.type];
    const [zeroOut] = tx.moveCall({
      target: "0x2::coin::zero",
      typeArguments: [
        this.swapInfo.swapXtoY
          ? this.swapInfo.coinY.type
          : this.swapInfo.coinX.type,
      ],
    });
    const amountIn = SuiUtils.getCoinValue(
      this.swapInfo.swapXtoY
        ? this.swapInfo.coinX.type
        : this.swapInfo.coinY.type,
      this.inputCoinObject,
      tx,
    );
    const [receiveA, receiveB] = tx.moveCall({
      target: `${INTEGRATE_PACKAGE_ID}::router::swap`,
      typeArguments,
      arguments: [
        tx.object(GLOBAL_CONFIG_ID),
        tx.object(this.swapInfo.poolId),
        this.swapInfo.swapXtoY ? this.inputCoinObject : zeroOut, // coin A
        this.swapInfo.swapXtoY ? zeroOut : this.inputCoinObject, // coin B
        tx.pure.bool(this.swapInfo.swapXtoY), // a to b or b to a
        tx.pure.bool(true), // exact in or out
        amountIn, // swap amount
        tx.pure.u128(sqrtPriceLimit.toString()), // sqrt price limit
        tx.pure.bool(false),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });

    SuiUtils.transferOrDestroyZeroCoin(
      tx,
      this.swapInfo.assetIn,
      this.swapInfo.swapXtoY ? receiveA : receiveB,
      this.currentAccount,
    );
    return this.swapInfo.swapXtoY ? receiveB : receiveA;
  }
}
