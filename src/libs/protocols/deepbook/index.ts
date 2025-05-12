import { Transaction } from "@mysten/sui/transactions";

import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";
import { BaseContract } from "../base";
import { _7K_PACKAGE_ID } from "../../../constants/_7k";
import { SuiUtils } from "../../../utils/sui";

const MODULE_NAME = "clob_v2";

export class DeepBookContract extends BaseContract {
  async swap(tx: Transaction) {
    const swapXtoY = this.swapInfo.swapXtoY;
    const poolId = this.swapInfo.poolId;
    const clientOrderId = Date.now();

    const typeArgs = this.getTypeParams();
    const lotSize = this.swapInfo.extra?.lotSize;
    const [baseAsset, quoteAsset] = typeArgs;

    const accountCap = this.createAccountCap(tx);
    const amountIn = this.getInputCoinValue(tx);
    const config = this.config.deepbook;
    let result;

    if (swapXtoY) {
      const amountInRound = tx.moveCall({
        target: `${_7K_PACKAGE_ID}::math::m_round_down`,
        arguments: [
          amountIn, // input coin value
          tx.pure.u64(lotSize), // lot size
        ],
      });
      const [base_coin_ret, quote_coin_ret] = tx.moveCall({
        target: `${config.package}::${MODULE_NAME}::swap_exact_base_for_quote`,
        typeArguments: [baseAsset, quoteAsset],
        arguments: [
          tx.object(poolId),
          tx.pure.u64(clientOrderId),
          accountCap,
          amountInRound,
          this.inputCoinObject, // coin 0 ~ base
          tx.moveCall({
            typeArguments: [quoteAsset],
            target: `0x2::coin::zero`,
            arguments: [],
          }), // coin 1 ~ quote
          tx.object(SUI_CLOCK_OBJECT_ID),
        ],
      });
      this.deleteAccountCap(tx, accountCap);
      SuiUtils.collectDust(tx, this.swapInfo.assetIn, base_coin_ret);
      result = quote_coin_ret;
    } else {
      const [base_coin_ret, quote_coin_ret] = tx.moveCall({
        target: `${config.package}::${MODULE_NAME}::swap_exact_quote_for_base`,
        typeArguments: [baseAsset, quoteAsset],
        arguments: [
          tx.object(poolId),
          tx.pure.u64(clientOrderId),
          accountCap,
          amountIn,
          tx.object(SUI_CLOCK_OBJECT_ID),
          this.inputCoinObject, // coin 1 ~ quote
        ],
      });
      this.deleteAccountCap(tx, accountCap);
      SuiUtils.collectDust(tx, this.swapInfo.assetIn, quote_coin_ret);
      result = base_coin_ret;
    }

    return result;
  }

  private createAccountCap(tx: Transaction) {
    const [cap] = tx.moveCall({
      typeArguments: [],
      target: `${this.config.deepbook.package}::${MODULE_NAME}::create_account`,
      arguments: [],
    });
    return cap;
  }

  private deleteAccountCap(tx: Transaction, accountCap: any) {
    tx.moveCall({
      target: `${this.config.deepbook.package}::custodian_v2::delete_account_cap`,
      arguments: [accountCap],
    });
  }
}
