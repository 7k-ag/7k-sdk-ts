import type {
  PreSwapLpChangeParams,
  RouterDataV3,
} from "@cetusprotocol/aggregator-sdk";
import type { AggregatorQuoter, Protocol } from "@flowx-finance/sdk";
import type { GasCostSummary } from "@mysten/sui/client";
import { SignatureWithBytes } from "@mysten/sui/cryptography";
import type {
  Transaction,
  TransactionObjectArgument,
} from "@mysten/sui/transactions";
import type { Quote, SwapOptions } from "@naviprotocol/astros-aggregator-sdk";
import { QuoteResponse, SourceDex } from "./aggregator";
import { OkxSwapResponseData } from "./okx";

export enum EProvider {
  BLUEFIN7K = "bluefin7k",
  CETUS = "cetus",
  FLOWX = "flowx",
  OKX = "okx",
  BLUEFINX = "bluefinx",
  ASTRO = "astro",
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
export type OkxProviderOptions = Required<Omit<ProviderBaseOptions, "api">> & {
  api?: string;
  secretKey: string;
  apiPassphrase: string;
  projectId: string;
};
export type BluefinXProviderOptions = ProviderBaseOptions;
export type AstroProviderOptions = ProviderBaseOptions &
  Pick<SwapOptions, "dexList" | "depth">;
export interface MetaAgOptions {
  /**If not specified, all providers will be used */
  providers?: {
    [EProvider.BLUEFIN7K]?: BluefinProviderOptions;
    [EProvider.FLOWX]?: FlowxProviderOptions;
    [EProvider.CETUS]?: CetusProviderOptions;
    [EProvider.OKX]?: OkxProviderOptions;
    [EProvider.BLUEFINX]?: BluefinXProviderOptions;
    [EProvider.ASTRO]?: AstroProviderOptions;
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
  coinTypeIn: string;
  coinTypeOut: string;
  amountIn: string;
  /** Required for RFQ providers (ie: BluefinX) */
  signer?: string;
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
  onSimulated?: (payload: MetaQuote) => void;
}
export interface MetaFastSwapOptions {
  /** Quote object from the quote operation */
  quote: MetaQuote;
  /** Signer address (owner of `coinIn`) */
  signer: string;
  /** If true, use the gas coin for the swap
   * @default true */
  useGasCoin?: boolean;
  /**
   * Sign the transaction bytes
   * @param txBytes - base64 transaction bytes
   * @returns - signature with bytes
   */
  signTransaction: (txBytes: string) => Promise<SignatureWithBytes>;
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
  | {
      provider: EProvider.OKX;
      quote: OkxSwapResponseData;
    }
  | { provider: EProvider.BLUEFINX; quote: QuoteResponse }
  | { provider: EProvider.ASTRO; quote: Quote }
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
export interface QuoteProvider {
  readonly kind: EProvider;
  quote(_quoteOptions: MetaQuoteOptions): Promise<MetaQuote | null>;
}

export interface SwapAPIProvider extends QuoteProvider {
  readonly kind: EProvider.OKX | EProvider.BLUEFINX;
  fastSwap(options: MetaFastSwapOptions): Promise<string>;
}

export interface AggregatorProvider extends QuoteProvider {
  readonly kind:
    | EProvider.BLUEFIN7K
    | EProvider.CETUS
    | EProvider.FLOWX
    | EProvider.ASTRO;
  swap(options: MetaSwapOptions): Promise<TransactionObjectArgument>;
}

export const isAggregatorProvider = (
  provider: QuoteProvider,
): provider is AggregatorProvider =>
  provider.kind === EProvider.BLUEFIN7K ||
  provider.kind === EProvider.CETUS ||
  provider.kind === EProvider.FLOWX ||
  provider.kind === EProvider.ASTRO;

export const isSwapAPIProvider = (
  provider: QuoteProvider,
): provider is SwapAPIProvider =>
  provider.kind === EProvider.OKX || provider.kind === EProvider.BLUEFINX;
