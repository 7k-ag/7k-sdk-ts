import { Transaction } from "@mysten/sui/transactions";
import { BaseContract } from "../base";
import {
  normalizeStructTag,
  parseStructTag,
  SUI_CLOCK_OBJECT_ID,
} from "@mysten/sui/utils";
import { SuiUtils } from "../../../utils/sui";

export type SteamExtra = {
  bankAStructTag: string;
  bankBStructTag: string;
  poolStructTag: string;
  bankA: string;
  bankB: string;
  lendingMarketA: string;
  lendingMarketB: string;
};
export class SteammContract extends BaseContract {
  async swap(tx: Transaction) {
    return this.cpmmSwap(tx);
  }

  cpmmSwap(tx: Transaction) {
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
  cpmmSwapV2(tx: Transaction) {
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

    const [coinX, _coinY] = this.swapInfo.pool.allTokens;
    const xToY = coinX.address === this.swapInfo.assetIn;
    const coinA = xToY
      ? this.inputCoinObject
      : SuiUtils.zeroCoin(tx, normalizeStructTag(coinTypeA));
    const coinB = !xToY
      ? this.inputCoinObject
      : SuiUtils.zeroCoin(tx, normalizeStructTag(coinTypeB));

    const bankATypeArgs = [lendingMarket, coinTypeA, btokenA].map(
      normalizeStructTag,
    );
    const bankBTypeArgs = [lendingMarket, coinTypeB, bTokenB].map(
      normalizeStructTag,
    );

    const bankInTypeArgs = xToY ? bankATypeArgs : bankBTypeArgs;
    const bankOutTypeArgs = xToY ? bankBTypeArgs : bankATypeArgs;

    // mint btoken from both coins
    const bTokenIn = tx.moveCall({
      target: `${this.config.steamm.package}::bank::mint_btokens`,
      typeArguments: bankInTypeArgs,
      arguments: [
        tx.object(xToY ? extra.bankA : extra.bankB),
        tx.object(extra.lendingMarketA),
        xToY ? coinA : coinB,
        this.getInputCoinValue(tx),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });

    const bTokenOut = SuiUtils.zeroCoin(
      tx,
      normalizeStructTag(xToY ? bTokenB : btokenA),
    );

    // call swap on btoken
    tx.moveCall({
      target: `${this.config.steamm.package}::cpmm::swap`,
      typeArguments: [btokenA, bTokenB, lp].map(normalizeStructTag),
      arguments: [
        tx.object(this.swapInfo.poolId),
        xToY ? bTokenIn : bTokenOut,
        xToY ? bTokenOut : bTokenIn,
        tx.pure.bool(xToY),
        SuiUtils.getCoinValue(
          normalizeStructTag(xToY ? btokenA : bTokenB),
          bTokenIn,
          tx,
        ),
        tx.pure.u64(0), // min output
      ],
    });

    // burn btoken to get out coin
    const [outCoin] = tx.moveCall({
      target: `${this.config.steamm.package}::bank::burn_btokens`,
      typeArguments: bankOutTypeArgs,
      arguments: [
        tx.object(xToY ? extra.bankB : extra.bankA),
        tx.object(extra.lendingMarketA),
        bTokenOut,
        SuiUtils.getCoinValue(
          normalizeStructTag(xToY ? bTokenB : btokenA),
          bTokenOut,
          tx,
        ),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });

    const coinIn = xToY ? coinA : coinB;
    const coinOut = xToY ? coinB : coinA;
    // the coinIn was mutated by mint_btokens above, but not consumed, so we need to transfer or destroy it
    SuiUtils.collectDust(tx, this.swapInfo.assetIn, coinIn);
    // bTokenIn was mutated by cpmm::swap above, but not consumed, so we need to transfer or destroy it
    SuiUtils.collectDust(
      tx,
      normalizeStructTag(xToY ? btokenA : bTokenB),
      bTokenIn,
    );
    // bTokenOut was burned by burn_btokens above, but not consumed, so we need to transfer or destroy it
    SuiUtils.collectDust(
      tx,
      normalizeStructTag(xToY ? bTokenB : btokenA),
      bTokenOut,
    );
    // after all we need to merge the placeholder output coin (zero) with actual output coin from swap burn
    tx.mergeCoins(coinOut, [outCoin]);
    return coinOut;
  }
}
