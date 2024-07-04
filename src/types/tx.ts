import { TransactionBlock } from "@mysten/sui.js/transactions";
import { QuoteResponse } from "./aggregator";
import BigNumber from "bignumber.js";

export interface BuildTxParams {
  tx?: TransactionBlock;
  sorResponse: QuoteResponse;
  accountAddress: string;
  slippage: BigNumber.Value;
  commissionPartner?: string | null;
  commissionBps?: number | null;
}
