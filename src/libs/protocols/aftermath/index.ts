import { Transaction } from "@mysten/sui/transactions";
import { BaseContract } from "../base";
import { normalizeTokenType } from "../../../utils/token";

export class AfterMathContract extends BaseContract {
  async swap(tx: Transaction) {
    const poolId = this.swapInfo.poolId;
    const returnAmount = this.swapInfo.returnAmount;
    const coinInType = normalizeTokenType(this.swapInfo.assetIn);
    const coinOutType = normalizeTokenType(this.swapInfo.assetOut);
    const inputCoinObject = this.inputCoinObject;
    const [lpCoinType] = this.getTypeParams();
    if (!lpCoinType) throw new Error("lpCoinType is not defined");

    const config = this.config.aftermath;
    const [tokenOut] = tx.moveCall({
      target: `${config.package}::swap::swap_exact_in`,
      typeArguments: [lpCoinType, coinInType, coinOutType],
      arguments: [
        tx.object(poolId),
        tx.object(config.poolRegistry),
        tx.object(config.protocolFeeVault),
        tx.object(config.treasury),
        tx.object(config.insuranceFund),
        tx.object(config.referralVault),
        inputCoinObject,
        tx.pure.u64(returnAmount),
        tx.pure.u64("1000000000000000000"), // slippage
      ],
    });

    return tokenOut;
  }
}
