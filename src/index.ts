export * from "./types/aggregator";

import { getSuiClient, setSuiClient } from "./suiClient";
import { getQuote } from "./getQuote";
import { estimateGasFee } from "./estimateGasFee";
import { buildTx } from "./buildTx";

export { getSuiClient, setSuiClient, getQuote, estimateGasFee, buildTx };

export default {
  getSuiClient,
  setSuiClient,
  getQuote,
  estimateGasFee,
  buildTx,
};
