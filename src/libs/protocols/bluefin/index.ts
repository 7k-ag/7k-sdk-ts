import { Transaction } from "@mysten/sui/transactions";
import { BaseContract } from "../base";
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";
import { getDefaultSqrtPriceLimit } from "../utils";
import { SuiUtils } from "../../../utils/sui";
export class BluefinContract extends BaseContract {
  async swap(tx: Transaction) {
    const [coinX, coinY] = this.swapInfo.pool.allTokens;
    const swapXtoY = this.swapInfo.swapXtoY;

    const amountIn = this.getInputCoinValue(tx);
    const coinInBalance = SuiUtils.coinIntoBalance(
      tx,
      this.swapInfo.assetIn,
      this.inputCoinObject,
    );
    const coinOutBalance = SuiUtils.zeroBalance(tx, this.swapInfo.assetOut);

    const config = this.config.bluefin;
    const [balanceOutX, balanceOutY] = tx.moveCall({
      target: `${config.package}::pool::swap`,
      typeArguments: [coinX.address, coinY.address],
      arguments: [
        tx.object(SUI_CLOCK_OBJECT_ID),
        tx.object(config.globalConfig),
        tx.object(this.swapInfo.poolId),
        swapXtoY ? coinInBalance : coinOutBalance,
        swapXtoY ? coinOutBalance : coinInBalance,
        tx.pure.bool(swapXtoY),
        tx.pure.bool(true),
        amountIn,
        tx.pure.u64(0),
        tx.pure.u128(
          getDefaultSqrtPriceLimit(swapXtoY) + (swapXtoY ? 1n : -1n),
        ),
      ],
    });

    const coinOutX = SuiUtils.coinFromBalance(tx, coinX.address, balanceOutX);
    const coinOutY = SuiUtils.coinFromBalance(tx, coinY.address, balanceOutY);
    SuiUtils.collectDust(
      tx,
      this.swapInfo.assetIn,
      swapXtoY ? coinOutX : coinOutY,
    );
    return swapXtoY ? coinOutY : coinOutX;
  }
}
