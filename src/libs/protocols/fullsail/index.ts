import { Transaction } from "@mysten/sui/transactions";
import { BaseContract } from "../base";

import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";
import { SuiUtils } from "../../../utils/sui";
import { getDefaultSqrtPriceLimit } from "../utils";

export class FullsailContract extends BaseContract {
  async swap(tx: Transaction) {
    const [coinX, coinY] = this.swapInfo.pool.allTokens;
    const swapXtoY = this.swapInfo.swapXtoY;
    const sqrtPriceLimit = getDefaultSqrtPriceLimit(swapXtoY);
    const typeArguments = [coinX.address, coinY.address];
    const zeroOut = SuiUtils.zeroCoin(
      tx,
      swapXtoY ? coinY.address : coinX.address,
    );
    const config = this.config.fullsail;
    const [receiveA, receiveB] = tx.moveCall({
      target: `${config.package}::router::swap`,
      typeArguments,
      arguments: [
        tx.object(config.globalConfig),
        tx.object(config.rewarderGlobalVault),
        tx.object(this.swapInfo.poolId),
        swapXtoY ? this.inputCoinObject : zeroOut, // coin A
        swapXtoY ? zeroOut : this.inputCoinObject, // coin B
        tx.pure.bool(swapXtoY), // a to b or b to a
        tx.pure.bool(true), // exact in or out
        this.getInputCoinValue(tx), // swap amount
        tx.pure.u128(sqrtPriceLimit.toString()), // sqrt price limit
        tx.pure.bool(false),
        tx.object(config.stats),
        tx.object(config.priceProvider),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });

    SuiUtils.collectDust(
      tx,
      this.swapInfo.assetIn,
      swapXtoY ? receiveA : receiveB,
    );
    return swapXtoY ? receiveB : receiveA;
  }
}
