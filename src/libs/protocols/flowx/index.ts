import { Transaction } from "@mysten/sui/transactions";
import { BaseContract } from "../base";

const PACKAGE_ID =
  "0xba153169476e8c3114962261d1edc70de5ad9781b83cc617ecc8c1923191cae0";
const MODULE_NAME = "router";
const CONTAINER_OBJECT_ID =
  "0xb65dcbf63fd3ad5d0ebfbf334780dc9f785eff38a4459e37ab08fa79576ee511";

export class FlowXContract extends BaseContract {
  async swap(tx: Transaction) {
    const coinInType = this.swapInfo.assetIn;
    const coinOutType = this.swapInfo.assetOut;

    const [tokenOut] = tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::swap_exact_input_direct`,
      typeArguments: [coinInType, coinOutType],
      arguments: [tx.object(CONTAINER_OBJECT_ID), this.inputCoinObject],
    });

    return tokenOut;
  }
}
