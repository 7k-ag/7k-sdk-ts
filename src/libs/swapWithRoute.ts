import { Transaction } from "@mysten/sui/transactions";
import { ProtocolContract } from "./protocols";
import { TxSorSwap } from "../types/aggregator";
import { TransactionResultItem } from "../types/sui";

export async function swapWithRoute({
  route,
  inputCoinObject,
  currentAccount,
  tx,
}: {
  route: TxSorSwap[];
  inputCoinObject: TransactionResultItem;
  currentAccount: string;
  tx: Transaction;
}): Promise<TransactionResultItem | undefined> {
  let inputTokenObject = inputCoinObject;
  let txbResultToReturn;

  for (const swap of route) {
    const ContractClass = ProtocolContract[swap.pool.type];
    const contractInstance = new ContractClass({
      swapInfo: swap,
      inputCoinObject: inputTokenObject,
      currentAccount,
    });
    const tokenOut = await contractInstance.swap(tx);
    inputTokenObject = tokenOut;
    txbResultToReturn = tokenOut;
  }

  return txbResultToReturn;
}
