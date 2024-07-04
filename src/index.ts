export * from "./types/aggregator";

import { getQuote } from "./getQuote";
import { estimateGasFee } from "./estimateGasFee";
import { buildTx } from "./buildTx";

export { getQuote, estimateGasFee, buildTx };

export default {
  getQuote,
  estimateGasFee,
  buildTx,
};
