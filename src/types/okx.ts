/**
 * OKX DEX Swap API Types
 * Documentation: https://web3.okx.com/vi/build/dev-docs/wallet-api/dex-swap
 */

/**
 * Gas level options for swap transactions
 */
export type GasLevel = "average" | "fast" | "slow";

/**
 * Swap mode options
 */
export type SwapMode = "exactIn" | "exactOut";

/**
 * Swap API Request Parameters (v6)
 */
export interface OkxSwapRequest {
  /** Unique identifier for the chain */
  chainIndex?: string;
  /** The input amount of a token to be sold (set in minimal divisible units, e.g., 1.00 USDT set as 1000000) */
  amount: string;
  /** Swap mode: "exactIn" or "exactOut" (default: "exactIn"). exactOut only supports Ethereum, Base, BSC, Arbitrum chains and Uni v3 protocols */
  swapMode?: SwapMode;
  /** The contract address of a token you want to send (e.g., 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee for native token) */
  fromTokenAddress: string;
  /** The contract address of a token you want to receive */
  toTokenAddress: string;
  /** Slippage limit. For EVM: 0-100. For Solana: 0-less than 100 (e.g., 0.5 means 0.5%) */
  slippagePercent: string;
  /** User's wallet address */
  userWalletAddress: string;
  /** Recipient address of a purchased token (if not set, userWalletAddress will receive the token) */
  swapReceiverAddress?: string;
  /** The percentage of fromTokenAmount sent to referrer. Min > 0, max 10 for Solana, 3 for all other chains. Maximum of nine decimal places */
  feePercent?: string;
  /** Wallet address to receive commission fee for fromToken. Must set feePercent together. Can only choose either fromToken or toToken commission per transaction */
  fromTokenReferrerWalletAddress?: string;
  /** Wallet address to receive commission fee for toToken. Must set feePercent together. Can only choose either fromToken or toToken commission per transaction */
  toTokenReferrerWalletAddress?: string;
  /** Positive slippage percentage (0-10, max 1 decimal point). Solana only, whitelist/enterprise clients only */
  positiveSlippagePercent?: string;
  /** Wallet address that receives positive slippage. Must set positiveSlippagePercent together. Solana only, whitelist/enterprise clients only */
  positiveSlippageFeeAddress?: string;
  /** The gas (in wei) for the swap transaction. EVM only. If too low, an error will be returned */
  gasLimit?: string;
  /** Target gas price level (defaults to "average"). EVM only */
  gasLevel?: GasLevel;
  /** Used for Solana transactions, similar to gasPrice on Ethereum. Determines transaction priority */
  computeUnitPrice?: string;
  /** Used for Solana transactions, similar to gasLimit on Ethereum. If tips is not 0, computeUnitPrice should be set to 0 */
  computeUnitLimit?: string;
  /** Jito tips in SOL. Maximum is "2", minimum is "0.0000000001". Used for MEV protection. Solana only */
  tips?: string;
  /** DexId of liquidity pool for limited quotes, multiple separated by comma (e.g., "1,50,180") */
  dexIds?: string;
}

/**
 * Token information
 */
export interface OkxTokenInfo {
  /** Token contract address */
  tokenContractAddress: string;
  /** Token symbol (e.g., "USDC") */
  tokenSymbol: string;
  /** Token unit price in USD (may be null for special cases) */
  tokenUnitPrice: string | null;
  /** Decimal number defining smallest unit */
  decimal: string;
  /** Whether the token is a honeypot token */
  isHoneyPot: boolean;
  /** Token tax rate (0-1, where 0.01 = 1%) */
  taxRate: string;
}

/**
 * DEX Protocol information
 */
export interface OkxDexProtocol {
  /** Name of the liquidity protocol (e.g., "Uniswap V3") */
  dexName: string;
  /** Percentage of assets handled by the protocol */
  percent: string;
}

/**
 * Sub-router information
 */
export interface OkxSubRouter {
  /** Liquidity protocol used on the path */
  dexProtocol: OkxDexProtocol;
  /** Index of the from token */
  fromTokenIndex: string;
  /** Index of the to token */
  toTokenIndex: string;
  /** Information of token to be sold */
  fromToken: OkxTokenInfo;
  /** Information of token to be bought */
  toToken: OkxTokenInfo;
}

/**
 * Main router information (deprecated in v6, kept for backward compatibility)
 * In v6, dexRouterList is an array of OkxSubRouter directly
 */
export interface OkxRouter {
  /** One of the main paths for the token swap */
  router: string;
  /** Percentage of assets handled by the main path */
  routerPercent: string;
  /** Quote path sub data set */
  subRouterList: OkxSubRouter[];
}

/**
 * Quote comparison information
 */
export interface OkxQuoteCompare {
  /** DEX name of the quote route */
  dexName: string;
  /** DEX logo of the quote route */
  dexLogo: string;
  /** Estimated network fee (USD) of the quote route */
  tradeFee: string;
  /** Received amount of the quote route */
  amountOut: string;
  /** Price impact percentage */
  priceImpactPercentage: string;
}

/**
 * Transaction data model
 */
export interface OkxTransactionData {
  /** Additional signing data (if required). When tips is specified, represents calldata of jito tips transfer */
  signatureData?: string[];
  /** User's wallet address */
  from: string;
  /** Estimated amount of the gas limit (increase by 50% for accurate data) */
  gas: string;
  /** Gas price in wei */
  gasPrice?: string;
  /** EIP-1559: Recommended priority cost of gas per unit */
  maxPriorityFeePerGas?: string;
  /** The contract address of OKX DEX router */
  to: string;
  /** The amount of native tokens (in wei) to be sent to the contract */
  value: string;
  /** The maximum amount of a token to spend when price reaches upper limit of slippage (applies to exactOut mode) */
  maxSpendAmount?: string;
  /** The minimum amount of a token to buy when price reaches upper limit of slippage */
  minReceiveAmount: string;
  /** Call data */
  data: string;
  /** Current transaction slippage value */
  slippagePercent: string;
}

/**
 * Router result data
 */
export interface OkxRouterResult {
  /** Unique identifier for the chain */
  chainIndex: string;
  /** Context slot (for Solana) */
  contextSlot?: number;
  /** Quote path data set - array of sub-routers */
  dexRouterList: OkxSubRouter[];
  /** Estimated gas consumption in smallest units (e.g., wei) */
  estimateGasFee: string;
  /** Information of token to be sold */
  fromToken: OkxTokenInfo;
  /** The input amount of a token to be sold */
  fromTokenAmount: string;
  /** Price impact percentage = (Received value – Paid value) / Paid value. Can be positive if received value exceeds paid value */
  priceImpactPercent: string;
  /** Router identifier */
  router: string;
  /** Swap mode: "exactIn" or "exactOut" */
  swapMode: SwapMode;
  /** Information of token to be bought */
  toToken: OkxTokenInfo;
  /** The resulting amount of a token to be bought */
  toTokenAmount: string;
  /** Estimated network fee (USD) of the quote route */
  tradeFee: string;
  /** Comparison of quote routes */
  quoteCompareList?: OkxQuoteCompare[];
}

/**
 * Swap API Response Data
 */
export interface OkxSwapResponseData {
  /** Quote path data */
  routerResult: OkxRouterResult;
  /** Contract data model */
  tx: OkxTransactionData;
}

/**
 * OKX API Standard Response Wrapper
 */
export interface OkxApiResponse<T> {
  /** Response code ("0" indicates success) */
  code: string;
  /** Response data array */
  data: T[];
  /** Response message */
  msg: string;
}

/**
 * Complete Swap API Response
 */
export type OkxSwapResponse = OkxApiResponse<OkxSwapResponseData>;
