import { TransactionBlock } from "@mysten/sui.js/transactions";
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui.js/utils";
import { BaseContract } from "../base";

const PACKAGE_ID = "0xdee9";
const MODULE_NAME = "clob_v2";
const _7K_PACKAGE_ID =
  "0xd48e7cdc9e92bec69ce3baa75578010458a0c5b2733d661a84971e8cef6806bc";

export class DeepBookContract extends BaseContract {
  async swap(tx: TransactionBlock) {
    const swapXtoY = this.swapInfo.swapXtoY;
    const poolId = this.swapInfo.poolId;
    const clientOrderId = Date.now();
    const currentAddress = this.currentAccount;

    const typeArgs = this.getTypeParams();
    const lotSize = this.swapInfo.extra?.lotSize;
    const [baseAsset, quoteAsset] = typeArgs;

    const accountCap = this.createAccountCap(tx);
    const amountIn = this.getInputCoinValue(tx);
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
        target: `${PACKAGE_ID}::${MODULE_NAME}::swap_exact_base_for_quote`,
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
      tx.transferObjects([base_coin_ret], currentAddress);
      result = quote_coin_ret;
    } else {
      const [base_coin_ret, quote_coin_ret] = tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::swap_exact_quote_for_base`,
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
      tx.transferObjects([quote_coin_ret], currentAddress);
      result = base_coin_ret;
    }

    return result;
  }

  private createAccountCap(tx: TransactionBlock) {
    const [cap] = tx.moveCall({
      typeArguments: [],
      target: `${PACKAGE_ID}::${MODULE_NAME}::create_account`,
      arguments: [],
    });
    return cap;
  }

  private deleteAccountCap(tx: TransactionBlock, accountCap: any) {
    tx.moveCall({
      target: `${PACKAGE_ID}::custodian_v2::delete_account_cap`,
      arguments: [accountCap],
    });
  }
}
