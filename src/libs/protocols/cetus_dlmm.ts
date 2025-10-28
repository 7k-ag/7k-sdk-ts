import { Transaction } from "@mysten/sui/transactions";
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";
import { SuiUtils } from "../../utils/sui";
import { BaseContract } from "./base";

export class CetusDLMMContract extends BaseContract {
  async swap(tx: Transaction) {
    const config = this.config.cetus_dlmm;
    const [x, y, receipt] = tx.moveCall({
      target: `${config.package}::pool::flash_swap`,
      typeArguments: [this.swapInfo.coinX.type, this.swapInfo.coinY.type],
      arguments: [
        tx.object(this.swapInfo.poolId),
        tx.pure.bool(this.swapInfo.swapXtoY),
        tx.pure.bool(true), // exact in
        this.getInputCoinValue(tx),
        tx.object(config.globalConfig),
        tx.object(config.version),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });

    const debtX = this.swapInfo.swapXtoY
      ? SuiUtils.coinIntoBalance(
          tx,
          this.swapInfo.coinX.type,
          this.inputCoinObject,
        )
      : SuiUtils.zeroBalance(tx, this.swapInfo.coinX.type);
    const debtY = this.swapInfo.swapXtoY
      ? SuiUtils.zeroBalance(tx, this.swapInfo.coinY.type)
      : SuiUtils.coinIntoBalance(
          tx,
          this.swapInfo.coinY.type,
          this.inputCoinObject,
        );
    tx.moveCall({
      target: `${config.package}::pool::repay_flash_swap`,
      typeArguments: [this.swapInfo.coinX.type, this.swapInfo.coinY.type],
      arguments: [
        tx.object(this.swapInfo.poolId),
        debtX,
        debtY,
        receipt,
        tx.object(config.version),
      ],
    });
    const [destroyType, destroyCoin, outType, outBalance] = this.swapInfo
      .swapXtoY
      ? [this.swapInfo.coinX.type, x, this.swapInfo.coinY.type, y]
      : [this.swapInfo.coinY.type, y, this.swapInfo.coinX.type, x];
    SuiUtils.balanceDestroyZero(tx, destroyType, destroyCoin);

    return SuiUtils.coinFromBalance(tx, outType, outBalance);
  }
}
