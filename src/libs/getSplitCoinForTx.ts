import { Transaction, TransactionResult } from "@mysten/sui/transactions";
import { normalizeStructTag } from "@mysten/sui/utils";
import { SUI_TYPE } from "../constants/tokens";
import { getCoinOjectIdsByAmount } from "./getCoinOjectIdsByAmount";

export const getSplitCoinForTx = async (
  account: string,
  amount: string,
  splits: string[],
  coinType: string,
  inheritTx?: Transaction,
  inspecTransaction?: boolean,
  isSponsored = false,
): Promise<{
  tx: Transaction;
  coinData: TransactionResult;
}> => {
  const tx = inheritTx ?? new Transaction();
  const { objectIds } = await getCoinOjectIdsByAmount(
    account,
    amount,
    coinType,
  );
  const coinObjectId: any = objectIds[0];
  if (
    normalizeStructTag(coinType) === normalizeStructTag(SUI_TYPE) &&
    !isSponsored
  ) {
    let coin;
    if (inspecTransaction) {
      if (objectIds.length > 1) {
        tx.mergeCoins(
          tx.object(coinObjectId),
          objectIds.slice(1).map((item) => tx.object(item)),
        );
      }
      coin = tx.splitCoins(tx.object(coinObjectId), splits);
    } else {
      coin = tx.splitCoins(tx.gas, splits);
    }
    return { tx, coinData: coin };
  }

  if (objectIds.length > 1) {
    tx.mergeCoins(
      tx.object(coinObjectId),
      objectIds.slice(1).map((item) => tx.object(item)),
    );
  }

  // split correct amount to swap
  const coinData = tx.splitCoins(tx.object(coinObjectId), splits);
  return { tx, coinData };
};
