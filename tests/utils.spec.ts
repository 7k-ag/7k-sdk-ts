import { SuiClient } from "@mysten/sui/client";
import { assert } from "chai";
import { buildTx, getQuote, isBluefinXRouting, SourceDex } from "../src";
import { BluefinXTx } from "../src/libs/protocols/bluefinx/types";

interface Params {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  sources?: SourceDex[];
  commissionBps?: number;
  /** Limit the route to a specific set of pools */
  targetPools?: string[];
  /** Exclude a specific set of pools from the route */
  excludedPools?: string[];
  /** The taker address, required for bluefinx */
  // taker?: string;
}
export const testSwap = async (
  client: SuiClient,
  address: string,
  params: Params,
) => {
  const quote = await getQuote({ ...params, taker: address });
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
    devInspect: !isBluefinXRouting(quote),
  });
  // BluefinX tx requires signer, but in the test scenario we do not have access to it
  // so we skip devInspect for BluefinX tx, just test the getQuote and buildTx for it
  if (tx instanceof BluefinXTx) {
    return;
  }
  const result = await client.devInspectTransactionBlock({
    sender: address,
    transactionBlock: tx,
  });

  assert(result.effects.status.status === "success", "Transaction failed");
  const swapEvent = result.events.find((e) =>
    e.type.endsWith("::settle::Swap"),
  )?.parsedJson;

  // console.log(swapEvent);
  assert(swapEvent, "Swap event not found");
};
