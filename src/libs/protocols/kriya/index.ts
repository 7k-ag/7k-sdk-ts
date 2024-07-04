import { TransactionBlock } from "@mysten/sui.js/transactions";
import { BaseContract } from "../base";
import { normalizeTokenType } from "../../../utils/token";

const PACKAGE_ID =
  "0xa0eba10b173538c8fecca1dff298e488402cc9ff374f8a12ca7758eebe830b66";
const MODULE_NAME = "spot_dex";

export class KriyaContract extends BaseContract {
  async swap(tx: TransactionBlock) {
    const swapXtoY = this.swapInfo.swapXtoY;
    const coinInType = normalizeTokenType(this.swapInfo.assetIn);
    const coinOutType = normalizeTokenType(this.swapInfo.assetOut);
    const poolId = this.swapInfo.poolId;
    const inputCoinObject = this.inputCoinObject;

    const [tokenOut] = tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::${
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
