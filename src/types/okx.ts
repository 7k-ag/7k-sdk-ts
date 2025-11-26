/**
 * OKX DEX Swap API Types
 * Documentation: https://web3.okx.com/vi/build/docs/waas/dex-swap
 */

/**
 * Gas level options for swap transactions
 */
export type GasLevel = "average" | "fast" | "slow";

/**
 * Swap API Request Parameters
 */
export interface OkxSwapRequest {
  /** Chain ID (e.g., 1 for Ethereum) */
  chainId: string;
  /** The input amount of a token to be sold (set in minimal divisible units) */
  amount: string;
  /** The contract address of a token you want to send (e.g., 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee for native token) */
  fromTokenAddress: string;
  /** The contract address of a token you want to receive */
  toTokenAddress: string;
  /** Slippage limit (0-1 for EVM, 0-less than 1 for Solana) */
  slippage: string;
  /** User's wallet address */
  userWalletAddress: string;
  /** Recipient address of a purchased token (if not set, userWalletAddress will receive the token) */
  swapReceiverAddress?: string;
  /** The percentage of fromTokenAmount or toTokenAmount sent to referrer (0-3, max 2 decimal points) */
  feePercent?: string;
  /** Wallet address to receive commission fee from fromToken */
  fromTokenReferrerWalletAddress?: string;
  /** Wallet address to receive commission fee from toToken */
  toTokenReferrerWalletAddress?: string;
  /** When true, positive slippage revenue sent to referrer's address (default: false) */
  enablePositiveSlippage?: boolean;
  /** The gas (in wei) for the swap transaction */
  gaslimit?: string;
  /** Target gas price level (defaults to "average") */
  gasLevel?: GasLevel;
  /** DexId of liquidity pool for limited quotes, multiple separated by comma (e.g., "1,50,180") */
  dexIds?: string;
  /** When enabled, restricts routing to single liquidity pool (Solana only, default: false) */
  directRoute?: boolean;
  /** Percentage (0-1.0) of price impact allowed (default: 0.9) */
  priceImpactProtectionPercentage?: string;
  /** Custom parameters encoded as 128-character 64-bytes hexadecimal string (must start with "0x") */
  callDataMemo?: string;
  /** Used for Solana transactions, similar to gasPrice on Ethereum */
  computeUnitPrice?: string;
  /** Used for Solana transactions, similar to gasLimit on Ethereum */
  computeUnitLimit?: string;
  /** When true, API calculates auto slippage recommendations (default: false) */
  autoSlippage?: boolean;
  /** Maximum auto slippage when autoSlippage is true */
  maxAutoSlippage?: string;
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
  /** Liquidity protocols used on the path */
  dexProtocol: OkxDexProtocol[];
  /** Information of token to be sold */
  fromToken: OkxTokenInfo;
  /** Information of token to be bought */
  toToken: OkxTokenInfo;
}

/**
 * Main router information
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
  /** Additional signing data (if required) */
  signatureData?: string[];
  /** User's wallet address */
  from: string;
  /** Estimated amount of the gas limit */
  gas: string;
  /** Gas price in wei */
  gasPrice?: string;
  /** EIP-1559: Recommended priority cost of gas per unit */
  maxPriorityFeePerGas?: string;
  /** The contract address of OKX DEX router */
  to: string;
  /** The amount of native tokens (in wei) to be sent to the contract */
  value: string;
  /** Minimum amount of token to buy when price reaches slippage limit */
  minReceiveAmount: string;
  /** Call data */
  data: string;
  /** Current transaction slippage value */
  slippage: string;
}

/**
 * Router result data
 */
export interface OkxRouterResult {
  /** Chain ID */
  chainId: string;
  /** The input amount of a token to be sold */
  fromTokenAmount: string;
  /** The resulting amount of a token to be bought */
  toTokenAmount: string;
  /** Estimated network fee (USD) of the quote route */
  tradeFee: string;
  /** Estimated gas consumption in smallest units (e.g., wei) */
  estimateGasFee: string;
  /** Quote path data set */
  dexRouterList: OkxRouter[];
  /** Information of token to be sold */
  fromToken: OkxTokenInfo;
  /** Information of token to be bought */
  toToken: OkxTokenInfo;
  /** Price impact percentage */
  priceImpactPercentage?: string;
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
