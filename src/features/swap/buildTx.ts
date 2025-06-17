import {
  Transaction,
  TransactionObjectArgument,
  TransactionResult,
} from "@mysten/sui/transactions";
import { isValidSuiAddress, toBase64, toHex } from "@mysten/sui/utils";
import { Config } from "../../config";
import { _7K_CONFIG, _7K_PACKAGE_ID, _7K_VAULT } from "../../constants/_7k";
import { getSplitCoinForTx } from "../../libs/getSplitCoinForTx";
import { groupSwapRoutes } from "../../libs/groupSwapRoutes";
import { BluefinXExtra } from "../../libs/protocols/bluefinx";
import { sponsorBluefinX } from "../../libs/protocols/bluefinx/client";
import { BluefinXTx } from "../../libs/protocols/bluefinx/types";
import { swapWithRoute } from "../../libs/swapWithRoute";
import {
  BuildTxResult,
  ExtraOracle,
  isBluefinXRouting,
  QuoteResponse,
} from "../../types/aggregator";
import { BuildTxParams } from "../../types/tx";
import { SuiUtils } from "../../utils/sui";
import { denormalizeTokenType } from "../../utils/token";
import { getConfig } from "./config";

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
  const { tx: _tx, coinIn } = extendTx || {};
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

  const splits = routes.map((group) => group[0]?.amount ?? "0");

  let coinData: TransactionResult;
  if (coinIn) {
    coinData = tx.splitCoins(coinIn, splits);
    SuiUtils.transferOrDestroyZeroCoin(
      tx,
      quoteResponse.tokenIn,
      coinIn,
      accountAddress,
    );
  } else {
    const { coinData: _data } = await getSplitCoinForTx(
      accountAddress,
      quoteResponse.swapAmountWithDecimal,
      splits,
      denormalizeTokenType(quoteResponse.tokenIn),
      tx,
      devInspect,
      isSponsored || isBluefinX,
    );
    coinData = _data;
  }

  const pythMap = await updatePythPriceFeedsIfAny(tx, quoteResponse);

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
    const mergeCoin: any =
      coinObjects.length > 1
        ? SuiUtils.mergeCoins(coinObjects, tx)
        : coinObjects[0];

    const returnAmountAfterCommission =
      (BigInt(10000 - _commission.commissionBps) *
        BigInt(quoteResponse.returnAmountWithDecimal)) /
      BigInt(10000);
    const minReceived =
      (BigInt(1e9 - +slippage * 1e9) * BigInt(returnAmountAfterCommission)) /
      BigInt(1e9);

    tx.moveCall({
      target: `${_7K_PACKAGE_ID}::settle::settle`,
      typeArguments: [quoteResponse.tokenIn, quoteResponse.tokenOut],
      arguments: [
        tx.object(_7K_CONFIG),
        tx.object(_7K_VAULT),
        tx.pure.u64(quoteResponse.swapAmountWithDecimal),
        mergeCoin,
        tx.pure.u64(minReceived), // minimum received
        tx.pure.u64(returnAmountAfterCommission), // expected amount out
        tx.pure.option(
          "address",
          isValidSuiAddress(_commission.partner) ? _commission.partner : null,
        ),
        tx.pure.u64(_commission.commissionBps),
        tx.pure.u64(0),
      ],
    });

    if (!extendTx) {
      tx.transferObjects([mergeCoin], tx.pure.address(accountAddress));
    } else {
      coinOut = mergeCoin;
    }
  }

  if (isBluefinX) {
    const extra = quoteResponse.swaps[0].extra as BluefinXExtra;
    if (extra.quoteExpiresAtUtcMillis < Date.now()) {
      throw new Error("Quote expired");
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
    return {
      tx: new BluefinXTx(res.quoteId, res.data.txBytes),
      coinOut,
    };
  }
  return { tx, coinOut };
};

const getPythPriceFeeds = (res: QuoteResponse) => {
  const ids: Set<string> = new Set();
  for (const s of res.swaps) {
    for (const o of (s.extra?.oracles || []) as ExtraOracle[]) {
      // FIXME: deprecation price_identifier in the next version
      const bytes = o.Pyth?.bytes || (o.Pyth as any)?.price_identifier?.bytes;
      if (bytes) {
        ids.add("0x" + toHex(Uint8Array.from(bytes)));
      }
    }
  }
  return Array.from(ids);
};

const updatePythPriceFeedsIfAny = async (
  tx: Transaction,
  quoteResponse: QuoteResponse,
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
