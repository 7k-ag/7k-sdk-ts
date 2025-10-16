export * from "./types/aggregator";

import { Config } from "./config";

import { getSuiPrice, getTokenPrice, getTokenPrices } from "./features/prices";
import { executeBluefinTx } from "./libs/protocols/bluefinx/client";

import {
  buildTx,
  buildTxV2,
  DEFAULT_SOURCES,
  estimateGasFee,
  executeTx,
  getQuote,
  getSwapHistory,
  multiSwap,
} from "./features/swap";

import {
  cancelDcaOrder,
  cancelLimitOrder,
  claimExpiredLimitOrder,
  getClosedDcaOrders,
  getClosedLimitOrders,
  getDcaOrderExecutions,
  getOpenDcaOrders,
  getOpenLimitOrders,
  placeDcaOrder,
  placeLimitOrder,
} from "./features/limitDca";

// avoid breaking changes
const getSuiClient = Config.getSuiClient;
const setSuiClient = Config.setSuiClient;

export {
  buildTx,
  buildTxV2,
  cancelDcaOrder,
  cancelLimitOrder,
  claimExpiredLimitOrder,
  // config
  Config,
  DEFAULT_SOURCES,
  estimateGasFee,
  executeBluefinTx,
  executeTx,
  getClosedDcaOrders,
  getClosedLimitOrders,
  getDcaOrderExecutions,
  getOpenDcaOrders,
  getOpenLimitOrders,
  // swap
  getQuote,
  // sui client
  getSuiClient,
  getSuiPrice,
  getSwapHistory,
  // prices
  getTokenPrice,
  getTokenPrices,
  multiSwap,
  // dca
  placeDcaOrder,
  // limit order
  placeLimitOrder,
  setSuiClient,
};

export default {
  // config
  Config,

  // sui client
  getSuiClient,
  setSuiClient,

  // prices
  getTokenPrice,
  getTokenPrices,
  getSuiPrice,

  // swap
  getQuote,
  estimateGasFee,
  buildTx,
  buildTxV2,
  multiSwap,
  getSwapHistory,
  executeTx,
  executeBluefinTx,
  DEFAULT_SOURCES,

  // limit order
  placeLimitOrder,
  getOpenLimitOrders,
  cancelLimitOrder,
  claimExpiredLimitOrder,
  getClosedLimitOrders,

  // dca
  placeDcaOrder,
  getOpenDcaOrders,
  cancelDcaOrder,
  getClosedDcaOrders,
  getDcaOrderExecutions,
};
