export * from "./types/aggregator";

import { getSuiClient, setSuiClient } from "./suiClient";
import { getQuote } from "./getQuote";
import { getSuiPrice } from "./getSuiPrice";
import { estimateGasFee } from "./estimateGasFee";
import { buildTx } from "./buildTx";

export {
  getSuiClient,
  setSuiClient,
  getQuote,
  getSuiPrice,
  estimateGasFee,
  buildTx,
};

export default {
  getSuiClient,
  setSuiClient,
  getQuote,
  getSuiPrice,
  estimateGasFee,
  buildTx,
};
