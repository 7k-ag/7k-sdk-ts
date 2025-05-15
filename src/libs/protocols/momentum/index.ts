import { Transaction } from "@mysten/sui/transactions";
import { BaseContract } from "../base";

import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";
import { getDefaultSqrtPriceLimit } from "../utils";
import { SuiUtils } from "../../../utils/sui";

export class MomentumContract extends BaseContract {
  async swap(tx: Transaction) {
    const [coinX, coinY] = this.swapInfo.pool.allTokens;
    const swapXtoY = this.swapInfo.swapXtoY;
    const sqrtPriceLimit = getDefaultSqrtPriceLimit(swapXtoY);
    const typeArguments = [coinX.address, coinY.address];
    const { package: packageId, version } = this.config.momentum;
    const [receiveA, receiveB, debt] = tx.moveCall({
      target: `${packageId}::trade::flash_swap`,
      typeArguments,
      arguments: [
        tx.object(this.swapInfo.poolId),
        tx.pure.bool(swapXtoY), // a2b
        tx.pure.bool(true), // exact in
        this.getInputCoinValue(tx),
        tx.pure.u128(sqrtPriceLimit.toString()), // sqrt price limit
        tx.object(SUI_CLOCK_OBJECT_ID),
        tx.object(version),
      ],
    });
    tx.moveCall({
      target: `${packageId}::trade::repay_flash_swap`,
      typeArguments,
      arguments: [
        tx.object(this.swapInfo.poolId),
        debt,
        swapXtoY
          ? SuiUtils.coinIntoBalance(tx, coinX.address, this.inputCoinObject)
          : SuiUtils.zeroBalance(tx, coinX.address),
        swapXtoY
          ? SuiUtils.zeroBalance(tx, coinY.address)
          : SuiUtils.coinIntoBalance(tx, coinY.address, this.inputCoinObject),
        tx.object(version),
      ],
    });
    const receiveACoin = SuiUtils.coinFromBalance(tx, coinX.address, receiveA);
    const receiveBCoin = SuiUtils.coinFromBalance(tx, coinY.address, receiveB);

    SuiUtils.collectDust(
      tx,
      this.swapInfo.assetIn,
      swapXtoY ? receiveACoin : receiveBCoin,
    );
    return swapXtoY ? receiveBCoin : receiveACoin;
  }
}
