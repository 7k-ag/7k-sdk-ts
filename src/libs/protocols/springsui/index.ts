import { Transaction } from "@mysten/sui/transactions";
import { SUI_SYSTEM_STATE_OBJECT_ID } from "@mysten/sui/utils";
import { BaseContract } from "../base";

const PACKAGE_ID =
  "0x82e6f4f75441eae97d2d5850f41a09d28c7b64a05b067d37748d471f43aaf3f7";

export class SpringSuiContract extends BaseContract {
  async swap(tx: Transaction) {
    // coinX is always SUI
    const coinY = this.swapInfo.pool.allTokens[1];
    const isStake = this.swapInfo.swapXtoY;
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
