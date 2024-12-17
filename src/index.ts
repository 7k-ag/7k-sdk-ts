export * from "./types/aggregator";

import { getSuiClient, setSuiClient } from "./suiClient";

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

export {
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
