import { Transaction } from "@mysten/sui/transactions";
import { BaseContract } from "../base";
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";
import { TransactionResultItem } from "../../../types/sui";

const PACKAGE_ID =
  "0x951a01360d85b06722edf896852bf8005b81cdb26375235c935138987f629502";
const FUND_ID =
  "0xf245e7a4b83ed9a26622f5818a158c2ba7a03b91e62717b557a7df1d4dab38df";
export class SponsoredDeepBookV3Contract extends BaseContract {
  async swap(tx: Transaction): Promise<TransactionResultItem> {
    const [coinX] = this.swapInfo.pool.allTokens;
    const swapXtoY = coinX.address === this.swapInfo.assetIn;
    const [base, quote] = tx.moveCall({
      target: `${PACKAGE_ID}::sponsored::${
        swapXtoY ? "swap_exact_base_for_quote" : "swap_exact_quote_for_base"
      }`,
      typeArguments: this.getTypeParams(),
      arguments: [
        tx.object(FUND_ID),
        tx.object(this.swapInfo.poolId),
        this.inputCoinObject,
        tx.pure.u64(0),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });

    const coinIn = swapXtoY ? base : quote;
    const coinOut = swapXtoY ? quote : base;
    tx.transferObjects([coinIn], this.currentAccount);
    return coinOut;
  }
}
