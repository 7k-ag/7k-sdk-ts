import { Transaction } from "@mysten/sui/transactions";
import { SUI_SYSTEM_STATE_OBJECT_ID } from "@mysten/sui/utils";
import { BaseContract } from "../base";

export class StSuiContract extends BaseContract {
  async swap(tx: Transaction) {
    // coinX is always SUI
    const coinY = this.swapInfo.pool.allTokens[1];
    const isStake = this.swapInfo.swapXtoY;
    const { package: PACKAGE_ID } = this.config.stsui;
    const [coinOut] = tx.moveCall({
      target: `${PACKAGE_ID}::liquid_staking::${isStake ? "mint" : "redeem"}`,
      typeArguments: [coinY.address],
      arguments: [
        tx.object(this.swapInfo.poolId),
        isStake ? tx.object(SUI_SYSTEM_STATE_OBJECT_ID) : this.inputCoinObject,
        isStake ? this.inputCoinObject : tx.object(SUI_SYSTEM_STATE_OBJECT_ID),
      ],
    });

    return coinOut;
  }
}
