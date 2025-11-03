import type {
  PreSwapLpChangeParams,
  RouterDataV3,
} from "@cetusprotocol/aggregator-sdk";
import type { AggregatorQuoter, Protocol } from "@flowx-finance/sdk";
import type { GasCostSummary } from "@mysten/sui/client";
import type {
  Transaction,
  TransactionObjectArgument,
} from "@mysten/sui/transactions";
import { QuoteResponse, SourceDex } from "./aggregator";

export enum EProvider {
  BLUEFIN7K = "bluefin7k",
  CETUS = "cetus",
  FLOWX = "flowx",
}
type ProviderBaseOptions = {
  api?: string;
  apiKey?: string;
  disabled?: boolean;
};
export type BluefinProviderOptions = ProviderBaseOptions & {
  sources?: SourceDex[];
  maxPaths?: number;
  excludedPools?: string[];
  targetPools?: string[];
};
export type FlowxProviderOptions = ProviderBaseOptions & {
  sources?: Protocol[];
  excludePools?: string[];
  excludeSources?: Protocol[];
  maxHops?: number;
  splitDistributionPercent?: number;
};
export type CetusProviderOptions = ProviderBaseOptions & {
  sources?: string[];
  splitCount?: number;
  splitAlgorithm?: string;
  splitFactor?: number;
  depth?: number;
  liquidityChanges?: PreSwapLpChangeParams[];
};
export interface MetaAgOptions {
  /**If not specified, all providers will be used */
  providers?: {
    [EProvider.BLUEFIN7K]?: BluefinProviderOptions;
    [EProvider.FLOWX]?: FlowxProviderOptions;
    [EProvider.CETUS]?: CetusProviderOptions;
  };
  /**Mainnet Json Rpc url, if not specified, the default mainnet url will be used */
  fullnodeUrl?: string;
  /**Hermes Api url, if not specified, the default hermes api url will be used */
  hermesApi?: string;
  /**Address to receive commission, if not specified, the commission will not be used */
  partner?: string;
  /**@default 0 */
  partnerCommissionBps?: number;
  /**@default 100 */
  slippageBps?: number;
  /**
   * Tip to support 7k
   * @default 0 */
  tipBps?: number;
}
export interface MetaQuoteOptions {
  coinInType: string;
  coinOutType: string;
  amountIn: string;
  /**
   * Timeout for quote operation in milliseconds
   * @default 2000ms
   */
  timeout?: number;
}
export interface MetaSimulationOptions {
  sender: string;
  /**
   * Timeout for simulation operation in milliseconds
   * @default 2000ms
   */
  timeout?: number;
  /** If specify, defer the simulation that could reduce the time to display quote result, you must update the quote via the id on callback
   * else await all quote and simulation before return
   */
  onSimulated?: (
    payload: Pick<
      MetaQuote,
      "simulatedAmountOut" | "gasUsed" | "id" | "provider"
    >,
  ) => void;
}
export interface MetaSwapOptions {
  /** Quote object from the quote operation */
  quote: MetaQuote;
  /** Signer address (owner of `coinIn`) */
  signer: string;
  /** Transaction object to add the swap operation */
  tx: Transaction;
  /**
   * Coin object used for the swap, must be consumed completely, no `coinIn` left, user must pass the coinIn object with the balance required for the swap - ie in quote `amountIn`
   * @warning `coinIn` value must match the quote `amountIn` */
  coinIn: TransactionObjectArgument;
}

export type FlowxQuoteResponse = Awaited<
  ReturnType<AggregatorQuoter["getRoutes"]>
>;
export type MetaQuote = (
  | {
      provider: EProvider.BLUEFIN7K;
      quote: QuoteResponse;
    }
  | {
      provider: EProvider.CETUS;
      quote: RouterDataV3;
    }
  | {
      provider: EProvider.FLOWX;
      quote: FlowxQuoteResponse;
    }
) & {
  /** uuid to keep track the quote result, used to apply simulation result on quote on callback `onSimulated`*/
  id: string;
  /** coin type: ie 0x2::sui::SUI */
  coinTypeIn: string;
  /** coin type: ie 0x2::sui::SUI */
  coinTypeOut: string;
  /** Amount in as u64 */
  amountIn: string;
  /** Amount out as u64 if there're no commission be applied to the amount out */
  rawAmountOut: string;
  /** Amount as u64 after minus any commission kind */
  amountOut: string;
  /** Simulated amount out if the transaction is executed */
  simulatedAmountOut?: string;
  /** Estimate gas consumption if the transaction is executed */
  gasUsed?: GasCostSummary;
};
export abstract class AgProvider {
  abstract kind: EProvider;
  abstract quote(quoteOptions: MetaQuoteOptions): Promise<MetaQuote>;
  abstract swap(options: MetaSwapOptions): Promise<TransactionObjectArgument>;
}
