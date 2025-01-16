import { Transaction } from "@mysten/sui/transactions";
import { BaseContract } from "../base";
import { SuiUtils } from "../../../utils/sui";

export class BluemoveContract extends BaseContract {
  async swap(tx: Transaction) {
    const config = this.config.bluemove;
    const [coinOut] = tx.moveCall({
      target: `${config.package}::router::swap_exact_input_`,
      typeArguments: [this.swapInfo.assetIn, this.swapInfo.assetOut],
      arguments: [
        SuiUtils.getCoinValue(
          this.swapInfo.swapXtoY
            ? this.swapInfo.coinX.type
            : this.swapInfo.coinY.type,
          this.inputCoinObject,
          tx,
        ), // input amount
        this.inputCoinObject, // input coin
        tx.pure.u64(0), // min output amount
        tx.object(config.dexInfo),
      ],
    });

    return coinOut;
  }
}
