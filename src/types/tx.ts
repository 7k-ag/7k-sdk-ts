import {
  Transaction,
  TransactionObjectArgument,
} from "@mysten/sui/transactions";
import { Commission, QuoteResponse } from "./aggregator";

export interface CommonParams {
  /** Quote response from 7k api */
  quoteResponse: QuoteResponse;
  /** User address */
  accountAddress: string;
  /** Slippage tolerance, ex: 0.01 (1%) */
  slippage: number | string;
  /** Commission for partner */
  commission: Commission;
  /**
   * Give Flexibility to insert custom commands before or after swap
   * @example
   * ```typescript
   * const rawTx = new Transaction();
   * // Add custom commands to rawTx
   * rawTx.moveCall({
   *   target: "0x2222222::example::claim",
   *   arguments: [],
   * });
   * const { tx, coinOut } = await buildTx({
   *   quoteResponse,
   *   accountAddress,
   *   slippage,
   *   commission,
   *   extendTx: {
   *     tx: rawTx,
   *     coinIn: rawTx.object(coinObjectId),
   *   },
   * });
   * // add more commands after the swap if needed, and remember to consume the coinOut object
   * tx.transferObjects([coinOut], tx.pure.address(accountAddress));
   * ```
   */
  extendTx?: {
    tx: Transaction;
    coinIn?: TransactionObjectArgument;
  };
  /**
   * If true, indicates that the transaction is sponsored and its gas object should not be modified.
   * In this case, the gas object is expected to be already set up correctly for the sponsored transaction.
   */
  isSponsored?: boolean;
}

export interface BuildTxParams extends CommonParams {
  /** Developer inspection mode */
  devInspect?: boolean;
}

export interface EstimateGasFeeParams extends CommonParams {
  /** Sui price in usd for gas estimation */
  suiPrice?: number;
}

export interface SwapInfo {
  quote: QuoteResponse;
  /** @warning this `coinIn` will be consumed completely, no `coinIn` left, user must pass the coinIn object with the balance required for the swap - ie in quote */
  coinIn: TransactionObjectArgument;
}

export interface MultiSwapParams {
  swaps: SwapInfo[];
  sender: string;
  slippageBps: number;
  tx: Transaction;
  /** Commission for partner */
  commission: Commission;
}
