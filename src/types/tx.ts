import {
  TransactionBlock,
  TransactionObjectArgument,
} from "@mysten/sui.js/transactions";
import { Commission, QuoteResponse } from "./aggregator";
import BigNumber from "bignumber.js";

export interface CommonParams {
  quoteResponse: QuoteResponse;
  accountAddress: string;
  slippage: BigNumber.Value;
  commission: Commission;
  extendTx?: {
    tx: TransactionBlock;
    coinIn?: TransactionObjectArgument;
  };
}

export interface BuildTxParams extends CommonParams {
  isGasEstimate?: boolean;
}

export interface EstimateGasFeeParams extends CommonParams {
  suiPrice?: number;
}
