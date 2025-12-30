export * from "./types/metaAg";

import { MetaAg } from "./features/metaAg";
import { getSuiPrice, getTokenPrice, getTokenPrices } from "./features/prices";

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

export {
  MetaAg,
  cancelDcaOrder,
  cancelLimitOrder,
  claimExpiredLimitOrder,
  getClosedDcaOrders,
  getClosedLimitOrders,
  getDcaOrderExecutions,
  getOpenDcaOrders,
  getOpenLimitOrders,
  // prices
  getSuiPrice,
  getTokenPrice,
  getTokenPrices,
  // dca
  placeDcaOrder,
  // limit order
  placeLimitOrder,
};

export default {
  // prices
  getTokenPrice,
  getTokenPrices,
  getSuiPrice,

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

  // Meta aggregator
  MetaAg,
};
