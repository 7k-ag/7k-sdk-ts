import { Transaction } from "@mysten/sui/transactions";

import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";
import { BaseContract } from "../base";
import { getDefaultSqrtPriceLimit } from "../utils";
import { ONE_MINUTE } from "./constants";

const PACKAGE_ID =
  "0x1a3c42ded7b75cdf4ebc7c7b7da9d1e1db49f16fcdca934fac003f35f39ecad9";
const MODULE_NAME = "swap_router";
const VERSION =
  "0xf1cf0e81048df168ebeb1b8030fad24b3e0b53ae827c25053fff0779c1445b6f";

export class TurbosContract extends BaseContract {
  async swap(tx: Transaction) {
    const a2b = this.swapInfo.swapXtoY;
    const { poolId, address } = {
      poolId: this.swapInfo.poolId,
      address: this.currentAccount,
    };

    const typeArguments = this.getTypeParams();

    const inputAmount = this.getInputCoinValue(tx);
    const [tokenOut, tokenIn] = tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::swap_${
        a2b ? "a_b" : "b_a"
      }_with_return_`,
      typeArguments: typeArguments,
      arguments: [
        tx.object(poolId),
        tx.makeMoveVec({
          elements: [this.inputCoinObject as any],
        }),
        inputAmount,
        tx.pure.u64(0),
        tx.pure.u128(
          getDefaultSqrtPriceLimit(this.swapInfo.swapXtoY).toString(),
        ),
        tx.pure.bool(true),
        tx.pure.address(this.currentAccount),
        tx.pure.u64(Date.now() + ONE_MINUTE * 3),
        tx.object(SUI_CLOCK_OBJECT_ID),
        tx.object(VERSION),
      ],
    });

    tx.transferObjects([tokenIn], address);

    return tokenOut;
  }
}
