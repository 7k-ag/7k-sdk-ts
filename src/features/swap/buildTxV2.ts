import {
  coinWithBalance,
  Transaction,
  TransactionObjectArgument,
} from "@mysten/sui/transactions";
import { isValidSuiAddress, normalizeStructTag } from "@mysten/sui/utils";
import { groupSwapRoutes } from "../../libs/groupSwapRoutes";
import { swapWithRoute } from "../../libs/swapWithRoute";
import {
  BuildTxResult,
  Config,
  isBluefinXRouting,
  TxSorSwap,
} from "../../types/aggregator";
import { BuildTxParams, MultiSwapParams } from "../../types/tx";
import { SuiUtils } from "../../utils/sui";
import {
  buildBluefinXTx,
  settle,
  updatePythPriceFeedsIfAny,
  validateRoutes,
} from "./buildTx";
import { getConfig } from "./config";

/**
 * Wave-based transaction builder that optimizes swap execution by:
 * 1. Grouping swaps into execution waves based on readiness
 * 2. Merging redundant swaps to the same pool within each wave
 * 3. Processing waves sequentially, passing intermediate tokens between waves
 */
export const buildTxV2 = async ({
  quoteResponse,
  accountAddress,
  slippage,
  commission: __commission,
  devInspect,
  extendTx,
  isSponsored,
}: BuildTxParams): Promise<BuildTxResult> => {
  const isBluefinX = isBluefinXRouting(quoteResponse);
  const _commission = {
    ...__commission,
    commissionBps: isBluefinX ? 0 : __commission.commissionBps,
  };
  const { tx: _tx, coinIn: _coinIn } = extendTx || {};
  let coinOut: TransactionObjectArgument | undefined;

  if (isBluefinX && devInspect) {
    throw new Error("BluefinX tx is sponsored, skip devInspect");
  }

  if (!accountAddress) {
    throw new Error("Sender address is required");
  }

  if (!quoteResponse.routes) {
    throw new Error("Invalid quote response: 'routes' are required");
  }

  if (!isValidSuiAddress(_commission.partner)) {
    throw new Error("Invalid commission partner address");
  }

  const tx = _tx || new Transaction();

  const routes = groupSwapRoutes(quoteResponse);
  validateRoutes(routes, isSponsored);

  const splits = routes.map((group) => group[0]?.amount ?? "0");

  const coinIn =
    _coinIn ||
    tx.add(
      coinWithBalance({
        type: quoteResponse.tokenIn,
        balance: BigInt(quoteResponse.swapAmountWithDecimal),
        useGasCoin: !isSponsored && !isBluefinX,
      }),
    );
  const coinData = tx.splitCoins(coinIn, splits);
  SuiUtils.transferOrDestroyZeroCoin(
    tx,
    quoteResponse.tokenIn,
    coinIn,
    accountAddress,
  );

  const pythMap = await updatePythPriceFeedsIfAny(tx, [quoteResponse]);
  const config = await getConfig();

  const finalCoins = await optimize(
    pythMap,
    config,
    routes,
    coinData,
    tx,
    accountAddress,
  );

  // Merge all final coins
  if (finalCoins.length > 0) {
    const mergeCoin = tx.add(
      settle(
        finalCoins,
        quoteResponse,
        Math.floor(+slippage * 10000),
        _commission,
      ),
    );

    if (!extendTx) {
      tx.transferObjects([mergeCoin], tx.pure.address(accountAddress));
    } else {
      coinOut = mergeCoin;
    }
  }

  if (isBluefinX) {
    return {
      tx: await buildBluefinXTx(tx, accountAddress, quoteResponse),
      coinOut,
    };
  }
  tx.setSenderIfNotSet(accountAddress);
  return { tx, coinOut };
};

export const optimize = async (
  pythMap: Record<string, string>,
  config: Config,
  routes: TxSorSwap[][],
  coinData: TransactionObjectArgument[],
  tx: Transaction,
  accountAddress: string,
) => {
  // Initialize route states for wave-based execution
  interface RouteState {
    routeIndex: number;
    currentHopIndex: number;
    currentCoin: TransactionObjectArgument;
    swaps: TxSorSwap[];
    completed: boolean;
  }
  // Initialize route states with split coins
  const routeStates: RouteState[] = routes.map((route, index) => ({
    routeIndex: index,
    currentHopIndex: 0,
    currentCoin: coinData[index],
    swaps: route,
    completed: false,
  }));

  const finalCoins: TransactionObjectArgument[] = [];
  const coinTypeOut = routes[0][routes[0].length - 1].assetOut;

  // Execute swaps in waves
  while (true) {
    // Collect all ready hops
    interface ReadyHop {
      routeIndex: number;
      hopIndex: number;
      swap: TxSorSwap;
      inputCoin: TransactionObjectArgument;
    }

    const readyHops: ReadyHop[] = [];

    routeStates.forEach((state) => {
      if (state.completed) return;

      if (state.currentHopIndex >= state.swaps.length) {
        state.completed = true;
        finalCoins.push(state.currentCoin);
        return;
      }

      const swap = state.swaps[state.currentHopIndex];
      readyHops.push({
        routeIndex: state.routeIndex,
        hopIndex: state.currentHopIndex,
        swap,
        inputCoin: state.currentCoin,
      });
    });

    if (readyHops.length === 0) break;

    // Group hops by pool for merging opportunities
    const poolGroups = new Map<
      string,
      {
        swap: TxSorSwap;
        hops: ReadyHop[];
      }
    >();

    readyHops.forEach((hop) => {
      const poolKey = `${hop.swap.poolId}|${hop.swap.assetIn}|${hop.swap.assetOut}`;

      if (!poolGroups.has(poolKey)) {
        poolGroups.set(poolKey, {
          swap: hop.swap,
          hops: [],
        });
      }

      poolGroups.get(poolKey)!.hops.push(hop);
    });

    // Execute each pool group in this wave
    const wavePromises: Promise<void>[] = [];

    for (const group of poolGroups.values()) {
      const { swap, hops } = group;
      // For merged swaps, we need to combine input coins first
      const wavePromise = (async () => {
        let combinedCoin: TransactionObjectArgument;

        if (hops.length > 1) {
          // Merge all input coins for this pool
          const inputCoins = hops.map((h) => h.inputCoin);
          tx.mergeCoins(inputCoins[0], inputCoins.slice(1));
          combinedCoin = inputCoins[0];
        } else {
          combinedCoin = hops[0].inputCoin;
        }

        // Execute the swap with the combined coin
        const resultCoin = await swapWithRoute({
          route: [swap],
          inputCoinObject: combinedCoin,
          currentAccount: accountAddress,
          tx,
          config,
          pythMap,
        });

        if (!resultCoin) {
          throw new Error(`Swap failed for pool ${swap.poolId}`);
        }

        if (hops[0].swap.assetOut === coinTypeOut) {
          finalCoins.push(resultCoin);
          hops.forEach((hop) => {
            const state = routeStates[hop.routeIndex];
            state.completed = true;
            state.currentHopIndex++;
          });
          return;
        }
        // For merged swaps, we need to split the output proportionally
        if (hops.length > 1) {
          // Split output proportionally (except the last one which gets the remainder)
          const splitAmounts = hops
            .slice(1)
            .map((hop) => hop.swap.returnAmount);

          const splitCoins =
            splitAmounts.length > 0
              ? [resultCoin, ...tx.splitCoins(resultCoin, splitAmounts)]
              : [resultCoin];

          // Assign split coins back to routes
          hops.forEach((hop, index) => {
            const state = routeStates[hop.routeIndex];
            state.currentCoin = splitCoins[index];
            state.currentHopIndex++;
          });
        } else {
          // Single swap - simply update the route state
          const state = routeStates[hops[0].routeIndex];
          state.currentCoin = resultCoin;
          state.currentHopIndex++;
        }
      })();

      wavePromises.push(wavePromise);
    }

    // Wait for all swaps in this wave to complete
    await Promise.all(wavePromises);
  }

  return finalCoins;
};

/**
 * execute multiple swap in single transaction
 *
 * User must handle the coins from return
 * @param param - MultiSwapParams
 * @returns a map of coinType to coinObject
 */
export const multiSwap = async ({
  sender,
  slippageBps,
  swaps,
  tx,
  commission,
}: MultiSwapParams) => {
  if (swaps.some((s) => isBluefinXRouting(s.quote))) {
    throw Error("BluefinX routing not supported yet");
  }
  // update oracles price if any
  const pythMap = await updatePythPriceFeedsIfAny(
    tx,
    swaps.map((s) => s.quote),
  );
  const map: Record<string, TransactionObjectArgument[]> = {};
  const config = await getConfig();
  for (const { quote: sorResponse, coinIn } of swaps) {
    const routes = groupSwapRoutes(sorResponse);

    const splits = routes.map((group) => group[0]?.amount ?? "0");

    const coinData =
      splits.length === 1
        ? [coinIn]
        : [coinIn, ...tx.splitCoins(coinIn, splits.slice(1))];

    const coinObjects = await optimize(
      pythMap,
      config,
      routes,
      coinData,
      tx,
      sender,
    );
    if (coinObjects.length > 0) {
      const mergeCoin = tx.add(
        settle(coinObjects, sorResponse, slippageBps, commission),
      );

      if (!map[normalizeStructTag(sorResponse.tokenOut)]) {
        map[normalizeStructTag(sorResponse.tokenOut)] = [];
      }
      map[normalizeStructTag(sorResponse.tokenOut)]!.push(mergeCoin);
    }
  }
  const result: Record<string, TransactionObjectArgument> = {};
  for (const [tokenOut, coins] of Object.entries(map)) {
    if (coins.length > 1) {
      tx.mergeCoins(coins[0], coins.slice(1));
    }
    result[tokenOut] = coins[0];
  }
  tx.setSenderIfNotSet(sender);
  return result;
};
