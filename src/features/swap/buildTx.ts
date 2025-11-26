import {
  coinWithBalance,
  Transaction,
  TransactionObjectArgument,
} from "@mysten/sui/transactions";
import { isValidSuiAddress, toBase64, toHex } from "@mysten/sui/utils";
import { Config } from "../../config";
import { _7K_CONFIG, _7K_PACKAGE_ID, _7K_VAULT } from "../../constants/_7k";
import { groupSwapRoutes } from "../../libs/groupSwapRoutes";
import { BluefinXExtra } from "../../libs/protocols/bluefinx";
import { sponsorBluefinX } from "../../libs/protocols/bluefinx/client";
import { BluefinXTx } from "../../libs/protocols/bluefinx/types";
import { swapWithRoute } from "../../libs/swapWithRoute";
import {
  BuildTxResult,
  Commission,
  isBluefinXRouting,
  QuoteResponse,
  TxSorSwap,
} from "../../types/aggregator";
import { BuildTxParams } from "../../types/tx";
import { SuiUtils } from "../../utils/sui";
import { getConfig } from "./config";
import { ORACLE_BASED_SOURCES } from "./getQuote";

export const buildTx = async ({
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
    // commission is ignored for bluefinx
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

  const coinObjects: TransactionObjectArgument[] = [];
  const config = await getConfig();
  await Promise.all(
    routes.map(async (route, index) => {
      const inputCoinObject = coinData[index];
      const coinRes = await swapWithRoute({
        route,
        inputCoinObject,
        currentAccount: accountAddress,
        tx,
        config,
        pythMap,
      });
      if (coinRes) {
        coinObjects.push(coinRes);
      }
    }),
  );
  if (coinObjects.length > 0) {
    const mergedCoin = tx.add(
      settle(
        coinObjects,
        quoteResponse,
        Math.floor(+slippage * 10000),
        _commission,
      ),
    );

    if (!extendTx) {
      tx.transferObjects([mergedCoin], tx.pure.address(accountAddress));
    } else {
      coinOut = mergedCoin;
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

export const getPythPriceFeeds = (responses: QuoteResponse[]) => {
  const ids: Set<string> = new Set();
  for (const res of responses) {
    for (const s of res.swaps) {
      for (const o of s.extra?.oracles || []) {
        const bytes = o.Pyth?.price_identifier?.bytes || o.Pyth?.bytes;
        if (bytes) {
          ids.add("0x" + toHex(Uint8Array.from(bytes)));
        }
      }
    }
  }
  return Array.from(ids);
};

export const updatePythPriceFeedsIfAny = async (
  tx: Transaction,
  quoteResponse: QuoteResponse[],
) => {
  // update oracles price if any
  const pythMap: Record<string, string> = {};
  const pythIds = getPythPriceFeeds(quoteResponse);
  if (pythIds.length > 0) {
    const prices =
      await Config.getPythConnection().getPriceFeedsUpdateData(pythIds);
    const ids = await Config.getPythClient().updatePriceFeeds(
      tx as any,
      prices,
      pythIds,
    );
    pythIds.map((id, index) => {
      pythMap[id] = ids[index];
    });
  }
  return pythMap;
};

export const validateRoutes = (
  routes: TxSorSwap[][],
  isSponsored?: boolean,
) => {
  if (!isSponsored) {
    return;
  }
  const hasOracleBasedSource = routes.some((g) =>
    g.some((s) => ORACLE_BASED_SOURCES.has(s.pool.type)),
  );
  if (hasOracleBasedSource) {
    throw new Error("Oracle based sources are not supported for sponsored tx");
  }
};

export const getExpectedReturn = (
  returnAmount: string,
  slippageBps: number,
  commissionBps: number,
  tipBps: number = 0,
) => {
  if (slippageBps > 10000) {
    throw new Error("Slippage must be less than 100%");
  }
  if (commissionBps > 10000) {
    throw new Error("Commission must be less than 100%");
  }
  if (tipBps > 10000) {
    throw new Error("Tip must be less than 100%");
  }
  const returnAmountWithDecimal = BigInt(returnAmount);
  const tipAmountWithDecimal =
    (returnAmountWithDecimal * BigInt(tipBps || 0)) / 10000n;
  const commissionAmountWithDecimal =
    ((returnAmountWithDecimal - tipAmountWithDecimal) * BigInt(commissionBps)) /
    10000n;
  const expectedReturnWithDecimal =
    returnAmountWithDecimal -
    tipAmountWithDecimal -
    commissionAmountWithDecimal;
  const minAmountWithDecimal =
    (expectedReturnWithDecimal * BigInt(1e4 - slippageBps)) / 10000n;

  return {
    tipAmount: tipAmountWithDecimal,
    minAmount: minAmountWithDecimal,
    commissionAmount: commissionAmountWithDecimal,
    expectedAmount: expectedReturnWithDecimal.toString(10),
  };
};

export const settle = (
  coinObjects: TransactionObjectArgument[],
  quoteResponse: QuoteResponse,
  slippageBps: number,
  _commission: Commission,
) => {
  return (tx: Transaction) => {
    const mergeCoin: TransactionObjectArgument =
      coinObjects.length > 1
        ? (tx.mergeCoins(coinObjects[0], coinObjects.slice(1)), coinObjects[0])
        : coinObjects[0];

    const { minAmount, expectedAmount } = getExpectedReturn(
      quoteResponse.returnAmountWithDecimal,
      slippageBps,
      _commission.commissionBps,
    );

    tx.moveCall({
      target: `${_7K_PACKAGE_ID}::settle::settle`,
      typeArguments: [quoteResponse.tokenIn, quoteResponse.tokenOut],
      arguments: [
        tx.object(_7K_CONFIG),
        tx.object(_7K_VAULT),
        tx.pure.u64(quoteResponse.swapAmountWithDecimal),
        mergeCoin,
        tx.pure.u64(minAmount), // minimum received
        tx.pure.u64(expectedAmount), // expected amount out
        tx.pure.option(
          "address",
          isValidSuiAddress(_commission.partner) ? _commission.partner : null,
        ),
        tx.pure.u64(_commission.commissionBps),
        tx.pure.u64(0),
      ],
    });

    return mergeCoin;
  };
};

export const buildBluefinXTx = async (
  tx: Transaction,
  accountAddress: string,
  quoteResponse: QuoteResponse,
) => {
  const extra = quoteResponse.swaps[0].extra as BluefinXExtra;
  if (extra.quoteExpiresAtUtcMillis < Date.now()) {
    throw new Error("Quote expired");
  }
  if (extra.taker !== accountAddress) {
    throw new Error("Sender mismatch with quote");
  }
  tx.setSenderIfNotSet(accountAddress);
  const bytes = await tx.build({
    client: Config.getSuiClient(),
    onlyTransactionKind: true,
  });

  const res = await sponsorBluefinX({
    quoteId: extra.quoteId,
    txBytes: toBase64(bytes),
    sender: accountAddress,
  });

  if (!res.success) {
    throw new Error("Sponsor failed");
  }
  return new BluefinXTx(res.quoteId, res.data.txBytes);
};
