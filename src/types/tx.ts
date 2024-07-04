import { TransactionBlock } from "@mysten/sui.js/transactions";
import { Commission, QuoteResponse } from "./aggregator";
import BigNumber from "bignumber.js";

export interface BuildTxParams {
  tx?: TransactionBlock;
  quoteResponse: QuoteResponse;
  accountAddress: string;
  slippage: BigNumber.Value;
  commission?: Commission;
}

export interface EstimateGasFeeParams extends BuildTxParams {
  suiPrice?: number;
}
