import {
  Transaction,
  TransactionObjectArgument,
} from "@mysten/sui/transactions";
import { BluefinXTx } from "../libs/protocols/bluefinx/types";
export { BluefinXTx };

export type SourceDex =
  | "suiswap"
  | "turbos"
  | "cetus"
  | "bluemove"
  | "kriya"
  | "kriya_v3"
  | "aftermath"
  | "deepbook_v3"
  | "flowx"
  | "flowx_v3"
  | "bluefin"
  | "bluefinx"
  | "springsui"
  | "obric"
  | "stsui"
  | "steamm"
  | "steamm_oracle_quoter"
  | "steamm_oracle_quoter_v2"
  | "magma"
  | "haedal_pmm"
  | "momentum"
  | "sevenk_v1"
  | "fullsail"
  | "cetus_dlmm"
  | "ferra_dlmm"
  | "ferra_clmm";

export type SorSwap = {
  poolId: string;
  assetInIndex: number;
  assetOutIndex: number;
  amount: string;
  returnAmount: string;
  assetIn: string;
  assetOut: string;
  functionName: string;
  arguments: string[];
  extra?: any;
};

export type SorPool = {
  allTokens: Array<{ address: string; decimal: number }>;
  type: SourceDex;
};

export type SorHop = {
  poolId: string;
  tokenInAmount: string;
  tokenOutAmount: string;
  tokenIn: string;
  tokenOut: string;
  pool: SorPool;
};

export type SorRoute = {
  hops: SorHop[];
  share?: number;
  tokenIn: string;
  tokenInAmount: string;
  tokenOut: string;
  tokenOutAmount: string;
};

export type QuoteResponse = {
  effectivePrice: number | null;
  effectivePriceReserved: number | null;
  priceImpact: number | null;
  swapAmount: string;
  returnAmount: string;
  returnAmountWithDecimal: string;
  returnAmountAfterCommission: string;
  returnAmountAfterCommissionWithDecimal: string;
  returnAmountConsiderGasFees?: string;
  returnAmountWithoutSwapFees?: string;
  swapAmountWithDecimal: string;
  tokenAddresses: string[];
  tokenIn: string;
  tokenOut: string;
  marketSp: string;
  routes?: SorRoute[];
  swaps: SorSwap[];
  warning: string;
};

export interface Coin {
  type: string;
  decimals: number;
}

export interface TxSorSwap extends SorSwap {
  pool: SorPool;
  coinX: Coin;
  coinY: Coin;
  swapXtoY: boolean;
}

export interface Commission {
  partner: string;
  commissionBps: number;
}

export interface DexConfig {
  package: string;
  name: string;
  url?: string;
  image?: string;
}
export interface Config {
  aftermath: DexConfig & {
    poolRegistry: string;
    protocolFeeVault: string;
    treasury: string;
    insuranceFund: string;
    referralVault: string;
  };
  bluefin: DexConfig & { globalConfig: string };
  bluefinx: DexConfig & { globalConfig: string };
  bluemove: DexConfig & { dexInfo: string };
  cetus: DexConfig & { globalConfig: string };
  deepbook_v3: DexConfig & { sponsor: string; sponsorFund: string };
  flowx: DexConfig & { container: string };
  flowx_v3: DexConfig & { registry: string; version: string };
  kriya: DexConfig;
  kriya_v3: DexConfig & { version: string };
  obric: DexConfig & { pythState: string };
  springsui: DexConfig;
  stsui: DexConfig;
  suiswap: DexConfig;
  turbos: DexConfig & { version: string };
  steamm: DexConfig & { script: string; oracle: string };
  magma: DexConfig & { globalConfig: string };
  haedal_pmm: DexConfig;
  momentum: DexConfig & { version: string };
  sevenk_v1: DexConfig & { oracle: string };
  fullsail: DexConfig & {
    globalConfig: string;
    rewarderGlobalVault: string;
    priceProvider: string;
    stats: string;
  };
  cetus_dlmm: DexConfig & { globalConfig: string; version: string };
  ferra_dlmm: DexConfig & { globalConfig: string };
  ferra_clmm: DexConfig & { integrate: string; globalConfig: string };
}

export type ExtraOracle = {
  Pyth?: { bytes: number[] };
};

export type AggregatorTx = Transaction | BluefinXTx;

export const isSuiTransaction = (tx: AggregatorTx): tx is Transaction =>
  tx instanceof Transaction;

/**
 * Check if the sor response is a bluefinx routing
 * @param sor
 * @returns boolean
 */
export const isBluefinXRouting = (sor: QuoteResponse) => {
  return (
    sor.routes?.length === 1 &&
    sor.routes[0].hops.length === 1 &&
    sor.routes[0].hops[0].pool.type === "bluefinx"
  );
};

export type BuildTxResult = {
  tx: AggregatorTx;
  coinOut?: TransactionObjectArgument;
};
