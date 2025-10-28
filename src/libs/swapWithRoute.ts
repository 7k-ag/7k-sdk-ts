import {
  Transaction,
  TransactionObjectArgument,
} from "@mysten/sui/transactions";
import { Config, TxSorSwap } from "../types/aggregator";
import { ProtocolContract } from "./protocols";

export async function swapWithRoute({
  route,
  inputCoinObject,
  currentAccount,
  config,
  pythMap,
  tx,
}: {
  route: TxSorSwap[];
  inputCoinObject: TransactionObjectArgument;
  currentAccount: string;
  config: Config;
  /** map price feed id to onchain priceInfoObject id */
  pythMap: Record<string, string>;
  tx: Transaction;
}): Promise<TransactionObjectArgument | undefined> {
  let inputTokenObject = inputCoinObject;
  let txbResultToReturn;

  for (const swap of route) {
    const ContractClass = ProtocolContract[swap.pool.type];
    const contractInstance = new ContractClass({
      swapInfo: swap,
      inputCoinObject: inputTokenObject,
      currentAccount,
      config,
      pythMap,
    });
    const tokenOut = await contractInstance.swap(tx);
    inputTokenObject = tokenOut;
    txbResultToReturn = tokenOut;
  }

  return txbResultToReturn;
}
