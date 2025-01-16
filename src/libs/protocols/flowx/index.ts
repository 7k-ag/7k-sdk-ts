import { Transaction } from "@mysten/sui/transactions";
import { BaseContract } from "../base";

export class FlowXContract extends BaseContract {
  async swap(tx: Transaction) {
    const coinInType = this.swapInfo.assetIn;
    const coinOutType = this.swapInfo.assetOut;

    const config = this.config.flowx;
    const [tokenOut] = tx.moveCall({
      target: `${config.package}::router::swap_exact_input_direct`,
      typeArguments: [coinInType, coinOutType],
      arguments: [tx.object(config.container), this.inputCoinObject],
    });

    return tokenOut;
  }
}
