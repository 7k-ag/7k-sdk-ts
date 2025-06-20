import { Transaction } from "@mysten/sui/transactions";
import {
  normalizeStructTag,
  parseStructTag,
  SUI_CLOCK_OBJECT_ID,
  toHex,
} from "@mysten/sui/utils";
import { ExtraOracle } from "../../../types/aggregator";
import { TransactionResultItem } from "../../../types/sui";
import { BaseContract } from "../base";

export type SevenKExtra = {
  poolStructTag: string;
  oracleConfigX: string;
  oracleConfigY: string;
  oracles: ExtraOracle[];
};

export class SevenKV1 extends BaseContract<SevenKExtra> {
  async swap(tx: Transaction): Promise<TransactionResultItem> {
    const x2y = this.swapInfo.swapXtoY;
    const config = this.config.sevenk_v1;

    const [coinOut] = tx.moveCall({
      target: `${config.package}::pool_v1::${
        x2y ? "swap_x_to_y" : "swap_y_to_x"
      }`,
      typeArguments: parseStructTag(this.extra.poolStructTag).typeParams.map(
        normalizeStructTag,
      ),
      arguments: [
        tx.object(this.swapInfo.poolId),
        this.getOraclePriceUpdate(tx),
        this.inputCoinObject,
        tx.pure.u64(0),
      ],
    });
    return coinOut;
  }

  getOraclePriceUpdate(tx: Transaction) {
    const oracleX = this.extra.oracles?.[0]?.Pyth?.bytes;
    const oracleY = this.extra.oracles?.[1]?.Pyth?.bytes;
    if (
      !oracleX ||
      !oracleY ||
      !this.extra.oracleConfigX ||
      !this.extra.oracleConfigY
    ) {
      throw new Error(`Invalid oracle info for getOraclePriceUpdate`);
    }
    const [holder] = tx.moveCall({
      target: `${this.config.sevenk_v1.oracle}::oracle::new_holder`,
    });
    tx.moveCall({
      target: `${this.config.sevenk_v1.oracle}::pyth::get_price`,
      arguments: [
        tx.object(this.extra.oracleConfigX),
        holder,
        tx.object(this.pythMap["0x" + toHex(Uint8Array.from(oracleX))]),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });
    tx.moveCall({
      target: `${this.config.sevenk_v1.oracle}::pyth::get_price`,
      arguments: [
        tx.object(this.extra.oracleConfigY),
        holder,
        tx.object(this.pythMap["0x" + toHex(Uint8Array.from(oracleY))]),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });
    return holder;
  }
}
