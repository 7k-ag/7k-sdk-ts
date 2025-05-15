import { Transaction } from "@mysten/sui/transactions";
import { BaseContract } from "../base";
import { normalizeStructTag, SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";
import { TransactionResultItem } from "../../../types/sui";
import { SuiUtils } from "../../../utils/sui";

export class SponsoredDeepBookV3Contract extends BaseContract {
  async swap(tx: Transaction): Promise<TransactionResultItem> {
    const [coinX] = this.swapInfo.pool.allTokens;
    const swapXtoY =
      normalizeStructTag(coinX.address) ===
      normalizeStructTag(this.swapInfo.assetIn);
    const config = this.config.deepbook_v3;
    const [base, quote] = tx.moveCall({
      target: `${config.sponsor}::sponsored::${
        swapXtoY ? "swap_exact_base_for_quote" : "swap_exact_quote_for_base"
      }`,
      typeArguments: this.getTypeParams(),
      arguments: [
        tx.object(config.sponsorFund),
        tx.object(this.swapInfo.poolId),
        this.inputCoinObject,
        tx.pure.u64(0),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });

    const coinIn = swapXtoY ? base : quote;
    const coinOut = swapXtoY ? quote : base;
    SuiUtils.collectDust(tx, this.swapInfo.assetIn, coinIn);
    return coinOut;
  }
}
