import { GasCostSummary, SuiEvent } from "@mysten/sui/client";
import {
  coinWithBalance,
  Transaction,
  TransactionObjectArgument,
} from "@mysten/sui/transactions";
import {
  _7K_META_CONFIG,
  _7K_META_PACKAGE_ID,
  _7K_META_PUBLISHED_AT,
  _7K_META_VAULT,
} from "../../constants/_7k";
import {
  AggregatorProvider,
  EProvider,
  MetaAgOptions,
  MetaQuote,
  MetaSimulationOptions,
} from "../../types/metaAg";
import { SuiClientUtils } from "../../utils/SuiClientUtils";
import { getExpectedReturn } from "../swap/buildTx";

const DEFAULT_GAS_USED: GasCostSummary = {
  computationCost: "0",
  nonRefundableStorageFee: "0",
  storageCost: "0",
  storageRebate: "0",
} as const;
export const simulateBluefinX = <
  T extends MetaQuote & { provider: EProvider.BLUEFINX },
>(
  quote: T,
) => {
  return {
    id: quote.id,
    simulatedAmountOut: quote.amountOut,
    gasUsed: DEFAULT_GAS_USED,
    provider: quote.provider,
  };
};
export const simulateSwapTx = async (
  tx: Transaction,
  inspector: SuiClientUtils,
  simulation: MetaSimulationOptions,
) => {
  const res = await timeout(
    () =>
      inspector.devInspectTransactionBlock({
        sender: simulation.sender,
        transactionBlock: tx,
      }),
    simulation.timeout ?? 2000,
  );
  if (res.effects.status.status === "failure") {
    throw new Error(res.error ?? "Simulation failed");
  }
  const amountOut = extractAmountOutWrapper(res.events);
  return {
    simulatedAmountOut: amountOut as string,
    gasUsed: res.effects.gasUsed,
  };
};
export const simulateAggregator = async (
  provider: AggregatorProvider,
  quote: MetaQuote,
  simulation: MetaSimulationOptions,
  inspector: SuiClientUtils,
  options: Required<MetaAgOptions>,
) => {
  const tx = new Transaction();
  const coinOut = await provider.swap({
    quote,
    coinIn: coinWithBalance({
      balance: BigInt(quote.amountIn),
      type: quote.coinTypeIn,
      useGasCoin: false,
    }),
    signer: simulation.sender,
    tx,
  });
  tx.add(
    metaSettle(
      quote,
      coinOut,
      10000,
      options.tipBps,
      options.partner,
      options.partnerCommissionBps,
    ),
  );
  tx.transferObjects([coinOut], simulation.sender);
  const res = await simulateSwapTx(tx, inspector, simulation);
  return {
    id: quote.id,
    provider: provider.kind,
    ...res,
  };
};

/**
 * this settlement does not charge commission fee for partner, since all integrated aggregators already charge commission fee for partner
 * @param quote Meta Aggregator Quote
 * @param coinOut Coin Out Object
 * @param slippageBps Slippage Bps
 * @param tipBps Tip Bps default = 0
 * @param partner address of partner for analytic default is zero address
 */
export const metaSettle = (
  quote: MetaQuote,
  coinOut: TransactionObjectArgument,
  slippageBps = 100,
  tipBps = 0,
  partner?: string,
  commissionBps = 0,
) => {
  return (tx: Transaction) => {
    const { minAmount, expectedAmount } = getExpectedReturn(
      quote.rawAmountOut,
      slippageBps,
      commissionBps,
      tipBps,
    );

    if (tipBps > 0) {
      tx.moveCall({
        target: `${_7K_META_PUBLISHED_AT}::vault::collect_tip`,
        typeArguments: [quote.coinTypeOut],
        arguments: [
          tx.object(_7K_META_VAULT),
          tx.object(_7K_META_CONFIG),
          coinOut,
          tx.pure.u64(tipBps),
        ],
      });
    }

    tx.moveCall({
      target: `${_7K_META_PUBLISHED_AT}::settle::settle`,
      typeArguments: [quote.coinTypeIn, quote.coinTypeOut],
      arguments: [
        tx.object(_7K_META_CONFIG),
        tx.object(_7K_META_VAULT),
        tx.pure.u64(quote.amountIn),
        coinOut,
        tx.pure.u64(minAmount),
        tx.pure.u64(expectedAmount),
        tx.pure.option("address", partner),
        tx.pure.u64(commissionBps),
        tx.pure.u64(0), // ps
      ],
    });
  };
};

const extractAmountOutWrapper = (events: SuiEvent[]) => {
  const swapEvent = events
    .filter((event) => event.type === `${_7K_META_PACKAGE_ID}::settle::Swap`)
    ?.pop();
  return (swapEvent?.parsedJson as any)?.amount_out;
};

export const timeout = async <T = any>(
  fn: () => Promise<T>,
  timeout: number,
  msg?: string,
) => {
  if (timeout <= 0) return fn();
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timeout ${msg ?? "operation"}`)),
      timeout,
    );
    fn()
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timer));
  });
};
