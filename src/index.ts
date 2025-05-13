export * from "./types/aggregator";

import { Config } from "./config";

import { getSuiPrice, getTokenPrice, getTokenPrices } from "./features/prices";

import {
  buildTx,
  estimateGasFee,
  executeTx,
  getQuote,
  getSwapHistory,
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
  executeTx,

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
  executeTx,

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
