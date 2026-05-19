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
import type { SimulateTransactionResult } from "../../utils/SuiClientUtils";
import { SuiClientUtils } from "../../utils/SuiClientUtils";
import { getExpectedReturn } from "../../utils/swap";
import { MetaAgError, MetaAgErrorCode } from "./error";

type SimulatedTransaction = NonNullable<
  | SimulateTransactionResult["Transaction"]
  | SimulateTransactionResult["FailedTransaction"]
>;
type SimulatedEvent = NonNullable<SimulatedTransaction["events"]>[number];

/**
 * v2 gRPC returns a `{ Transaction?, FailedTransaction? }` envelope from
 * both `executeTransaction` and `simulateTransaction`. Unwrap to the inner
 * payload, throwing `SIMULATION_FAILED` if neither arm is populated.
 */
export const unwrapTxResult = <
  T extends {
    Transaction?: unknown;
    FailedTransaction?: unknown;
  },
>(
  res: T,
  msg = "Transaction returned no result",
): NonNullable<T["Transaction"] | T["FailedTransaction"]> => {
  const inner = (res.Transaction ?? res.FailedTransaction) as
    | NonNullable<T["Transaction"] | T["FailedTransaction"]>
    | undefined;
  if (!inner) {
    throw new MetaAgError(msg, MetaAgErrorCode.SIMULATION_FAILED, {
      error: msg,
    });
  }
  return inner;
};

/**
 * Assert that `quote.provider` matches the expected provider kind. All
 * provider classes use this identical guard at the top of `swap`/`fastSwap`.
 */
export function assertQuoteProvider<E extends EProvider>(
  quote: MetaQuote,
  expected: E,
): asserts quote is Extract<MetaQuote, { provider: E }> {
  MetaAgError.assert(
    quote.provider === expected,
    "Invalid quote",
    MetaAgErrorCode.INVALID_QUOTE,
    { quote, expectedProvider: expected },
  );
}

export const simulateSwapTx = async (
  tx: Transaction,
  inspector: SuiClientUtils,
  simulation: MetaSimulationOptions,
) => {
  const res = await timeout(
    () =>
      inspector.simulateTransaction({
        sender: simulation.sender,
        transactionBlock: tx,
      }),
    simulation.timeout ?? 2000,
  );
  const result = unwrapTxResult(res, "Simulation failed");
  const status = result.effects.status;
  if (!status.success) {
    const errorMessage = status.error.message ?? "Simulation failed";
    throw new MetaAgError(errorMessage, MetaAgErrorCode.SIMULATION_FAILED, {
      error: errorMessage,
    });
  }
  const amountOut = extractAmountOutWrapper(result.events ?? []);
  return {
    simulatedAmountOut: amountOut,
    gasUsed: result.effects.gasUsed,
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

const extractAmountOutWrapper = (events: SimulatedEvent[]) => {
  const swapEvent = events
    .filter(
      (event) => event.eventType === `${_7K_META_PACKAGE_ID}::settle::Swap`,
    )
    ?.pop();
  const json = swapEvent?.json as { amount_out?: string } | null | undefined;
  return json?.amount_out;
};

export const timeout = async <T>(
  fn: () => Promise<T>,
  timeout: number,
  msg?: string,
): Promise<T> => {
  if (timeout <= 0) return fn();
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () =>
        reject(
          new MetaAgError(
            `Timeout ${msg ?? "operation"}`,
            MetaAgErrorCode.TIMEOUT,
            { timeout },
          ),
        ),
      timeout,
    );
    fn()
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timer));
  });
};
