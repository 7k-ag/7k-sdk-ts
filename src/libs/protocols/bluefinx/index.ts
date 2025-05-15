import { bcs } from "@mysten/sui/bcs";
import { Transaction } from "@mysten/sui/transactions";
import {
  fromBase64,
  normalizeStructTag,
  SUI_CLOCK_OBJECT_ID,
} from "@mysten/sui/utils";
import { SuiUtils } from "../../../utils/sui";
import { BaseContract } from "../base";

const BcsQuote = bcs.struct("Quote", {
  vault: bcs.Address,
  id: bcs.string(),
  taker: bcs.Address,
  token_in_amount: bcs.u64(),
  token_out_amount: bcs.u64(),
  token_in_type: bcs.string(),
  token_out_type: bcs.string(),
  expires_at: bcs.u64(),
  created_at: bcs.u64(),
});

export type BluefinXExtra = {
  quoteId: string;
  signature: string;
  taker: string;
  vault: string;
  quoteExpiresAtUtcMillis: number;
  createdAtUtcMillis: number;
};
export class BluefinXContract extends BaseContract {
  async swap(tx: Transaction) {
    const extra = this.extra as BluefinXExtra;
    const quoteBytes = BcsQuote.serialize({
      vault: extra.vault,
      id: extra.quoteId,
      taker: extra.taker,
      token_in_amount: this.swapInfo.amount,
      token_out_amount: this.swapInfo.returnAmount,
      token_in_type: normalizeStructTag(this.swapInfo.assetIn).slice(2),
      token_out_type: normalizeStructTag(this.swapInfo.assetOut).slice(2),
      expires_at: extra.quoteExpiresAtUtcMillis,
      created_at: extra.createdAtUtcMillis,
    }).toBytes();
    const [out] = tx.moveCall({
      arguments: [
        tx.object(SUI_CLOCK_OBJECT_ID),
        tx.object(extra.vault),
        tx.object(this.config.bluefinx.globalConfig),
        tx.pure.vector("u8", Array.from(quoteBytes)),
        tx.pure.vector("u8", Array.from(fromBase64(extra.signature))),
        SuiUtils.coinIntoBalance(
          tx,
          this.swapInfo.assetIn,
          this.inputCoinObject,
        ),
      ],
      target: `${this.config.bluefinx.package}::vault::swap`,
      typeArguments: [this.swapInfo.assetIn, this.swapInfo.assetOut],
    });
    return SuiUtils.coinFromBalance(tx, this.swapInfo.assetOut, out);
  }
}
