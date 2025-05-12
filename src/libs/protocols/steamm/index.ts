import { Transaction } from "@mysten/sui/transactions";
import { BaseContract } from "../base";
import {
  normalizeStructTag,
  parseStructTag,
  SUI_CLOCK_OBJECT_ID,
  toHex,
} from "@mysten/sui/utils";
import { SuiUtils } from "../../../utils/sui";
import { ExtraOracle } from "../../../types/aggregator";

export type SteamExtra = {
  bankAStructTag: string;
  bankBStructTag: string;
  poolStructTag: string;
  bankA: string;
  bankB: string;
  lendingMarketA: string;
  lendingMarketB: string;
  oracleRegistry?: string;
  oracles?: ExtraOracle[];
  oracleIndexes?: number[];
};
export class SteammContract extends BaseContract<SteamExtra> {
  async swap(tx: Transaction) {
    if (this.extra.poolStructTag.includes("omm::OracleQuoter")) {
      return this.ommSwap(tx);
    } else if (this.extra.poolStructTag.includes("cpmm::CpQuoter")) {
      return this.cpmmSwap(tx);
    }
    throw new Error(`Unsupported pool type: ${this.extra.poolStructTag}`);
  }

  cpmmSwap(tx: Transaction) {
    const extra = this.extra;
    if (
      !extra ||
      !extra.bankAStructTag ||
      !extra.bankBStructTag ||
      !extra.poolStructTag ||
      !extra.bankA ||
      !extra.bankB ||
      !extra.lendingMarketA ||
      !extra.lendingMarketB
    ) {
      throw new Error(`Invalid extra info for cpmmSwap`);
    }

    // the pool script v1 only support same lending market
    if (extra.lendingMarketA !== extra.lendingMarketB) {
      throw new Error(`Invalid lending market for cpmmSwap`);
    }

    const [btokenA, bTokenB, _quoter, lp] = parseStructTag(
      extra.poolStructTag,
    ).typeParams;
    const [lendingMarket, coinTypeA, _bTokenA] = parseStructTag(
      extra.bankAStructTag,
    ).typeParams;
    const [_lendingMarket, coinTypeB, _bTokenB] = parseStructTag(
      extra.bankBStructTag,
    ).typeParams;

    const xToY = this.swapInfo.swapXtoY;
    const coinA = xToY
      ? this.inputCoinObject
      : SuiUtils.zeroCoin(tx, normalizeStructTag(coinTypeA));
    const coinB = !xToY
      ? this.inputCoinObject
      : SuiUtils.zeroCoin(tx, normalizeStructTag(coinTypeB));

    tx.moveCall({
      target: `${this.config.steamm.script}::pool_script::cpmm_swap`,
      typeArguments: [
        lendingMarket,
        coinTypeA,
        coinTypeB,
        btokenA,
        bTokenB,
        lp,
      ].map(normalizeStructTag),
      arguments: [
        tx.object(this.swapInfo.poolId),
        tx.object(extra.bankA),
        tx.object(extra.bankB),
        tx.object(extra.lendingMarketA),
        coinA,
        coinB,
        tx.pure.bool(xToY),
        this.getInputCoinValue(tx),
        tx.pure.u64(0),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });
    const coinIn = xToY ? coinA : coinB;
    const coinOut = xToY ? coinB : coinA;
    SuiUtils.collectDust(tx, this.swapInfo.assetIn, coinIn);
    return coinOut;
  }

  ommSwap(tx: Transaction) {
    const extra = this.swapInfo.extra as SteamExtra;
    if (
      !extra ||
      !extra.bankAStructTag ||
      !extra.bankBStructTag ||
      !extra.poolStructTag ||
      !extra.bankA ||
      !extra.bankB ||
      !extra.lendingMarketA ||
      !extra.lendingMarketB
    ) {
      throw new Error(`Invalid extra info for cpmmSwap`);
    }

    // the pool script v1 only support same lending market
    if (extra.lendingMarketA !== extra.lendingMarketB) {
      throw new Error(`Invalid lending market for ommSwap`);
    }

    const [btokenA, bTokenB, _quoter, lp] = parseStructTag(
      extra.poolStructTag,
    ).typeParams;
    const [lendingMarket, coinTypeA, _bTokenA] = parseStructTag(
      extra.bankAStructTag,
    ).typeParams;
    const [_lendingMarket, coinTypeB, _bTokenB] = parseStructTag(
      extra.bankBStructTag,
    ).typeParams;

    const xToY = this.swapInfo.swapXtoY;
    const coinA = xToY
      ? this.inputCoinObject
      : SuiUtils.zeroCoin(tx, normalizeStructTag(coinTypeA));
    const coinB = !xToY
      ? this.inputCoinObject
      : SuiUtils.zeroCoin(tx, normalizeStructTag(coinTypeB));

    const [priceA, priceB] = this.getOraclePriceUpdate(tx);
    tx.moveCall({
      target: `${this.config.steamm.script}::pool_script_v2::omm_swap`,
      typeArguments: [
        lendingMarket,
        coinTypeA,
        coinTypeB,
        btokenA,
        bTokenB,
        lp,
      ].map(normalizeStructTag),
      arguments: [
        tx.object(this.swapInfo.poolId),
        tx.object(extra.bankA),
        tx.object(extra.bankB),
        tx.object(extra.lendingMarketA),
        priceA,
        priceB,
        coinA,
        coinB,
        tx.pure.bool(xToY),
        this.getInputCoinValue(tx),
        tx.pure.u64(0),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });
    const coinIn = xToY ? coinA : coinB;
    const coinOut = xToY ? coinB : coinA;
    SuiUtils.collectDust(tx, this.swapInfo.assetIn, coinIn);
    return coinOut;
  }
  getOraclePriceUpdate(tx: Transaction) {
    const oracleA = this.extra.oracles?.[0]?.Pyth?.price_identifier?.bytes;
    const oracleB = this.extra.oracles?.[1]?.Pyth?.price_identifier?.bytes;
    const registry = this.extra.oracleRegistry;
    const indexes = this.extra.oracleIndexes;
    if (!oracleA || !oracleB || !registry || indexes?.length !== 2) {
      throw new Error(`Invalid oracle info for getOraclePriceUpdate`);
    }

    const [a] = tx.moveCall({
      target: `${this.config.steamm.oracle}::oracles::get_pyth_price`,
      arguments: [
        tx.object(registry),
        tx.object(this.pythMap["0x" + toHex(Uint8Array.from(oracleA))]),
        tx.pure.u64(indexes[0]),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });

    const [b] = tx.moveCall({
      target: `${this.config.steamm.oracle}::oracles::get_pyth_price`,
      arguments: [
        tx.object(registry),
        tx.object(this.pythMap["0x" + toHex(Uint8Array.from(oracleB))]),
        tx.pure.u64(indexes[1]),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });
    return [a, b] as const;
  }
}
