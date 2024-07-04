import { TransactionBlock } from "@mysten/sui.js/transactions";
import { BaseContract } from "../base";
import { normalizeTokenType } from "../../../utils/token";

const PACKAGE_ID =
  "0xc4049b2d1cc0f6e017fda8260e4377cecd236bd7f56a54fee120816e72e2e0dd";
const MODULE_NAME = "swap";

const POOL_REGISTRY =
  "0xfcc774493db2c45c79f688f88d28023a3e7d98e4ee9f48bbf5c7990f651577ae";
const PROTOCOL_FEE_VAULT =
  "0xf194d9b1bcad972e45a7dd67dd49b3ee1e3357a00a50850c52cd51bb450e13b4";
const TREASURY =
  "0x28e499dff5e864a2eafe476269a4f5035f1c16f338da7be18b103499abf271ce";
const INSURANCE_FUND =
  "0xf0c40d67b078000e18032334c3325c47b9ec9f3d9ae4128be820d54663d14e3b";
const REFERRAL_VAULT =
  "0x35d35b0e5b177593d8c3a801462485572fc30861e6ce96a55af6dc4730709278";

export class AfterMathContract extends BaseContract {
  async swap(tx: TransactionBlock) {
    const poolId = this.swapInfo.poolId;
    const returnAmount = this.swapInfo.returnAmount;
    const coinInType = normalizeTokenType(this.swapInfo.assetIn);
    const coinOutType = normalizeTokenType(this.swapInfo.assetOut);
    const inputCoinObject = this.inputCoinObject;
    const [lpCoinType] = this.getTypeParams();
    if (!lpCoinType) throw new Error("lpCoinType is not defined");

    const [tokenOut] = tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::swap_exact_in`,
      typeArguments: [lpCoinType, coinInType, coinOutType],
      arguments: [
        tx.object(poolId),
        tx.object(POOL_REGISTRY),
        tx.object(PROTOCOL_FEE_VAULT),
        tx.object(TREASURY),
        tx.object(INSURANCE_FUND),
        tx.object(REFERRAL_VAULT),
        inputCoinObject,
        tx.pure(returnAmount),
        tx.pure.u64("1000000000000000000"), // slippage
      ],
    });

    return tokenOut;
  }
}
