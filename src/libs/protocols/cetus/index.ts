import { Transaction } from "@mysten/sui/transactions";

import { BaseContract } from "../base";

import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";
import { getDefaultSqrtPriceLimit } from "../utils";
import { SuiUtils } from "../../../utils/sui";

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
    const config = this.config.cetus;
    const [receiveA, receiveB] = tx.moveCall({
      target: `${config.package}::router::swap`,
      typeArguments,
      arguments: [
        tx.object(config.globalConfig),
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

    SuiUtils.collectDust(
      tx,
      this.swapInfo.assetIn,
      this.swapInfo.swapXtoY ? receiveA : receiveB,
    );
    return this.swapInfo.swapXtoY ? receiveB : receiveA;
  }
}
