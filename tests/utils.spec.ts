import { SuiClient } from "@mysten/sui/client";
import { buildTx, getQuote, SourceDex } from "../src";
import { assert } from "chai";

interface Params {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  sources?: SourceDex[];
  /** Limit the route to a specific set of pools */
  targetPools?: string[];
  /** Exclude a specific set of pools from the route */
  excludedPools?: string[];
}
export const testSwap = async (
  client: SuiClient,
  address: string,
  params: Params,
) => {
  const quote = await getQuote(params);
  if (quote.swaps.length === 0) {
    console.warn("\x1b[33m%s\x1b[0m", "not found route");
    return;
  }

  const { tx } = await buildTx({
    quoteResponse: quote,
    accountAddress: address,
    commission: {
      commissionBps: 0,
      partner: address,
    },
    slippage: 0.02,
    devInspect: true,
  });
  const result = await client.devInspectTransactionBlock({
    sender: address,
    transactionBlock: tx,
  });
  if (result.effects.status.status !== "success") {
    console.error(result.effects.status.error);
    return;
  }
  assert(result.effects.status.status === "success", "Transaction failed");
};
