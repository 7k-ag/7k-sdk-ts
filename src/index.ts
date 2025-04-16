export * from "./types/aggregator";

import { Config } from "./config";

import { getTokenPrice, getTokenPrices, getSuiPrice } from "./features/prices";

import {
  buildTx,
  getQuote,
  estimateGasFee,
  getSwapHistory,
} from "./features/swap";

import {
  placeLimitOrder,
  getOpenLimitOrders,
  cancelLimitOrder,
  claimExpiredLimitOrder,
  getClosedLimitOrders,
  placeDcaOrder,
  getOpenDcaOrders,
  cancelDcaOrder,
  getClosedDcaOrders,
  getDcaOrderExecutions,
} from "./features/limitDca";

// avoid breaking changes
const getSuiClient = Config.getSuiClient;
const setSuiClient = Config.setSuiClient;

export {
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
  getSwapHistory,

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
  getSwapHistory,

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
