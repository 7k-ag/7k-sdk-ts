import BigNumber from "bignumber.js";
import {
  Coin,
  SorPool,
  SorRoute,
  SorSwap,
  QuoteResponse,
  TxSorSwap,
} from "../types/aggregator";
import { denormalizeTokenType } from "../utils/token";

export function groupSwapRoutes(sorResponse: QuoteResponse): TxSorSwap[][] {
  if (!sorResponse.routes || !sorResponse.swaps) {
    return [];
  }

  const poolDetails = mapPoolIdsToDetails(sorResponse.routes);
  const items = getTxSorSwaps(sorResponse.swaps, poolDetails);

  const groupedItems: TxSorSwap[][] = [];
  let currentGroup: TxSorSwap[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    currentGroup.push(item);

    const nextItem = items[i + 1];
    if (!nextItem || new BigNumber(nextItem.amount).gt(0)) {
      groupedItems.push(currentGroup);
      currentGroup = [];
    }
  }

  if (currentGroup.length > 0) {
    groupedItems.push(currentGroup);
  }

  return groupedItems;
}

function mapPoolIdsToDetails(routes: SorRoute[]) {
  const poolTypes: Record<string, SorPool> = {};
  routes.forEach((route) => {
    route.hops.forEach((hop) => {
      poolTypes[hop.poolId] = hop.pool;
    });
  });
  return poolTypes;
}

function getTxSorSwaps(
  swaps: SorSwap[],
  poolDetails: Record<string, SorPool>,
): TxSorSwap[] {
  return swaps.map((swap) => {
    const pool = poolDetails[swap.poolId];
    const assetIn = denormalizeTokenType(swap.assetIn);
    const assetOut = denormalizeTokenType(swap.assetOut);
    const coinX: Coin = {
      type: denormalizeTokenType(pool?.allTokens?.[0]?.address),
      decimals: pool?.allTokens?.[0]?.decimal,
    };
    const coinY: Coin = {
      type: denormalizeTokenType(pool?.allTokens?.[1]?.address),
      decimals: pool?.allTokens?.[0]?.decimal,
    };
    const swapXtoY = assetIn === coinX.type;

    return {
      ...swap,
      pool,
      assetIn,
      assetOut,
      coinX,
      coinY,
      swapXtoY,
    };
  });
}
