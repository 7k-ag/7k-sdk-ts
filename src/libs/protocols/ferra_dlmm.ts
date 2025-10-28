import { Transaction } from "@mysten/sui/transactions";
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";
import { SuiUtils } from "../../utils/sui";
import { BaseContract } from "./base";

export class FerraDLMMContract extends BaseContract {
  async swap(tx: Transaction) {
    const config = this.config.ferra_dlmm;
    const [xIn, yIn] = this.swapInfo.swapXtoY
      ? [this.inputCoinObject, SuiUtils.zeroCoin(tx, this.swapInfo.coinY.type)]
      : [SuiUtils.zeroCoin(tx, this.swapInfo.coinX.type), this.inputCoinObject];
    const [x, y] = tx.moveCall({
      target: `${config.package}::lb_pair::swap`,
      typeArguments: [this.swapInfo.coinX.type, this.swapInfo.coinY.type],
      arguments: [
        tx.object(config.globalConfig),
        tx.object(this.swapInfo.poolId),
        tx.pure.bool(this.swapInfo.swapXtoY),
        tx.pure.u64(0), // min output amount
        xIn,
        yIn,
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });

    SuiUtils.transferOrDestroyZeroCoin(
      tx,
      this.swapInfo.assetIn,
      this.swapInfo.swapXtoY ? x : y,
      this.currentAccount,
    );
    return this.swapInfo.swapXtoY ? y : x;
  }
}
