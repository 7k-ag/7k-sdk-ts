import { Transaction } from "@mysten/sui/transactions";
import { BaseContract } from "../base";
import { normalizeTokenType } from "../../../utils/token";

export class KriyaContract extends BaseContract {
  async swap(tx: Transaction) {
    const swapXtoY = this.swapInfo.swapXtoY;
    const coinInType = normalizeTokenType(this.swapInfo.assetIn);
    const coinOutType = normalizeTokenType(this.swapInfo.assetOut);
    const poolId = this.swapInfo.poolId;
    const inputCoinObject = this.inputCoinObject;

    const config = this.config.kriya;
    const [tokenOut] = tx.moveCall({
      target: `${config.package}::spot_dex::${
        swapXtoY ? "swap_token_x" : "swap_token_y"
      }`,
      typeArguments: [
        swapXtoY ? coinInType : coinOutType,
        swapXtoY ? coinOutType : coinInType,
      ],
      arguments: [
        tx.object(poolId),
        inputCoinObject,
        this.getInputCoinValue(tx),
        tx.pure.u64(0),
      ],
    });

    return tokenOut;
  }
}
