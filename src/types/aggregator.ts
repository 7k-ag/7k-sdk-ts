export type SourceDex =
  | "suiswap"
  | "turbos"
  | "cetus"
  | "bluemove"
  | "kriya"
  | "kriya_v3"
  | "aftermath"
  | "deepbook"
  | "deepbook_v3"
  | "flowx"
  | "flowx_v3"
  | "bluefin"
  | "springsui"
  | "obric"
  | "stsui";

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
  bluemove: DexConfig & { dexInfo: string };
  cetus: DexConfig & { globalConfig: string };
  deepbook: DexConfig;
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
}
