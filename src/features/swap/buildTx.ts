import {
  Transaction,
  TransactionObjectArgument,
  TransactionResult,
} from "@mysten/sui/transactions";
import { getSplitCoinForTx } from "../../libs/getSplitCoinForTx";
import { groupSwapRoutes } from "../../libs/groupSwapRoutes";
import { swapWithRoute } from "../../libs/swapWithRoute";
import { denormalizeTokenType } from "../../utils/token";
import { SuiUtils } from "../../utils/sui";
import { BuildTxParams } from "../../types/tx";
import { _7K_CONFIG, _7K_PACKAGE_ID, _7K_VAULT } from "../../constants/_7k";
import { isValidSuiAddress, toHex } from "@mysten/sui/utils";
import { getConfig } from "./config";
import { QuoteResponse } from "../../types/aggregator";
import { Config } from "../../config";

export const buildTx = async ({
  quoteResponse,
  accountAddress,
  slippage,
  commission: _commission,
  devInspect,
  extendTx,
  isSponsored,
}: BuildTxParams) => {
  const { tx: _tx, coinIn } = extendTx || {};
  let coinOut: TransactionObjectArgument | undefined;

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
    SuiUtils.collectDust(tx, quoteResponse.tokenIn, coinIn);
  } else {
    const { coinData: _data } = await getSplitCoinForTx(
      accountAddress,
      quoteResponse.swapAmountWithDecimal,
      splits,
      denormalizeTokenType(quoteResponse.tokenIn),
      tx,
      devInspect,
      isSponsored,
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
    coinOut = mergeCoin;

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
    }
  }

  return { tx, coinOut };
};

const getPythPriceFeeds = (res: QuoteResponse) => {
  const ids: string[] = [];
  for (const s of res.swaps) {
    for (const o of s.extra?.oracles || []) {
      const bytes = o.Pyth?.price_identifier?.bytes;
      if (bytes) {
        ids.push("0x" + toHex(Uint8Array.from(bytes)));
      }
    }
  }
  return ids;
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
