import { Transaction } from "@mysten/sui/transactions";
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";
import { BaseContract } from "../base";
import { getDefaultSqrtPriceLimit } from "../utils";

export class FlowxV3Contract extends BaseContract {
  async swap(tx: Transaction) {
    const [coinX, coinY] = this.swapInfo.pool.allTokens;
    const swapXtoY = this.swapInfo.swapXtoY;
    const swapFeeRate = this.swapInfo.extra.swapFeeRate;
    if (!swapFeeRate) {
      throw new Error("swapFeeRate is required");
    }

    const config = this.config.flowx_v3;
    const [coinOut] = tx.moveCall({
      target: `${config.package}::swap_router::swap_exact_input`,
      typeArguments: [
        swapXtoY ? coinX.address : coinY.address,
        swapXtoY ? coinY.address : coinX.address,
      ],
      arguments: [
        tx.object(config.registry),
        tx.pure.u64(swapFeeRate), // swap fee rate to lookup pool in the registry
        this.inputCoinObject,
        tx.pure.u64(0), // min amount out
        tx.pure.u128(
          getDefaultSqrtPriceLimit(swapXtoY) + (swapXtoY ? 1n : -1n),
        ), // sqrt price limit
        tx.pure.u64("18446744073709551615"), // u64 max value
        tx.object(config.version),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });

    return coinOut;
  }
}
