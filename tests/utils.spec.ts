import { SuiClient } from "@mysten/sui/client";
import { coinWithBalance, Transaction } from "@mysten/sui/transactions";
import { assert } from "chai";
import {
  buildTx,
  getQuote,
  isBluefinXRouting,
  multiSwap,
  SourceDex,
} from "../src";
import { buildTxV2 } from "../src/features/swap";
import { BluefinXTx } from "../src/libs/protocols/bluefinx/types";
import { BuildTxParams } from "../src/types/tx";

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

  assert(
    result.effects.status.status === "success",
    `Transaction failed: ${result.error}`,
  );
  const swapEvent = result.events.find((e) =>
    e.type.endsWith("::settle::Swap"),
  )?.parsedJson;

  // console.log(swapEvent);
  assert(swapEvent, "Swap event not found");
};

export const testBuildTxV2 = async (
  client: SuiClient,
  address: string,
  params: Params,
  compareV1 = false,
) => {
  const quote = await getQuote({ ...params, taker: address });
  if (quote.swaps.length === 0) {
    console.warn("\x1b[33m%s\x1b[0m", "not found route");
    return;
  }

  const buildTxParams: BuildTxParams = {
    quoteResponse: quote,
    accountAddress: address,
    commission: {
      commissionBps: 0,
      partner: address,
    },
    slippage: 0.02,
    devInspect: !isBluefinXRouting(quote),
  };

  const { tx: tx2 } = await buildTxV2(buildTxParams);
  if (tx2 instanceof BluefinXTx) {
    return;
  }
  const result2 = await client.devInspectTransactionBlock({
    sender: address,
    transactionBlock: tx2,
  });
  assert(
    result2.effects.status.status === "success",
    `Transaction failed: ${result2.error}`,
  );
  const swapEvents2 = result2.events.filter((e) =>
    e.type.endsWith("::settle::Swap"),
  );
  assert(swapEvents2.length > 0, "Swap event not found");

  if (compareV1) {
    const { tx } = await buildTx(buildTxParams);
    // BluefinX tx requires signer, but in the test scenario we do not have access to it
    // so we skip devInspect for BluefinX tx, just test the getQuote and buildTx for it
    if (tx instanceof BluefinXTx) {
      return;
    }
    const result = await client.devInspectTransactionBlock({
      sender: address,
      transactionBlock: tx,
    });

    assert(
      result.effects.status.status === "success",
      `Transaction failed: ${result.error}`,
    );
    const swapEvent = result.events.find((e) =>
      e.type.endsWith("::settle::Swap"),
    )?.parsedJson;

    // console.log(swapEvent);
    assert(swapEvent, "Swap event not found");
    const oldGas =
      +result.effects.gasUsed.computationCost +
      +result.effects.gasUsed.storageCost -
      +result.effects.gasUsed.storageRebate;
    const newGas =
      +result2.effects.gasUsed.computationCost +
      +result2.effects.gasUsed.storageCost -
      +result2.effects.gasUsed.storageRebate;
    console.log({
      oldGas: oldGas,
      newGas: newGas,
      savings: oldGas - newGas,
      savingsPercentage: ((oldGas - newGas) / oldGas) * 100,
      paths: quote.routes?.length,
    });
  }
};

export const testMultiSwap = async (
  client: SuiClient,
  address: string,
  params: Params[],
) => {
  const quotes = await Promise.all(
    params.map(async (p) => getQuote({ ...p, taker: address })),
  );
  const tx = new Transaction();
  const coins = await multiSwap({
    sender: address,
    slippageBps: 100,
    swaps: quotes.map((q) => {
      return {
        quote: q,
        coinIn: tx.add(
          coinWithBalance({
            type: q.tokenIn,
            balance: BigInt(q.swapAmountWithDecimal),
            useGasCoin: true,
          }),
        ),
      };
    }),
    tx,
    commission: {
      partner: address,
      commissionBps: 0,
    },
  });
  tx.transferObjects(Object.values(coins), address);
  const result = await client.devInspectTransactionBlock({
    sender: address,
    transactionBlock: tx,
  });

  assert(
    result.effects.status.status === "success",
    `Transaction failed: ${result.error}`,
  );
  const swapEvents = result.events.filter((e) =>
    e.type.endsWith("::settle::Swap"),
  );

  assert(swapEvents.length > 0, "Swap event not found");
};
