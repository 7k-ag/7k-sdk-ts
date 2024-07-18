import {
  TransactionBlock,
  TransactionResult,
} from "@mysten/sui.js/transactions";
import { getCoinOjectIdsByAmount } from "./getCoinOjectIdsByAmount";
import { SUI_TYPE } from "../constants/tokens";

export const getSplitCoinForTx = async (
  account: string,
  amount: string,
  splits: string[],
  coinType: string,
  inheritTx?: TransactionBlock,
  inspecTransaction?: boolean,
): Promise<{
  tx: TransactionBlock;
  coinData: TransactionResult;
}> => {
  const tx = inheritTx ?? new TransactionBlock();
  const { objectIds } = await getCoinOjectIdsByAmount(
    account,
    amount,
    coinType,
  );
  const coinObjectId: any = objectIds[0];
  if (coinType === SUI_TYPE) {
    const pureAmount = [];
    for (const split of splits) {
      pureAmount.push(tx.pure(split));
    }
    let coin;
    if (inspecTransaction) {
      if (objectIds.length > 1) {
        tx.mergeCoins(
          tx.object(coinObjectId),
          objectIds.slice(1).map((item) => tx.object(item)),
        );
      }
      coin = tx.splitCoins(tx.object(coinObjectId), pureAmount);
    } else {
      coin = tx.splitCoins(tx.gas, pureAmount);
    }
    return { tx, coinData: coin };
  }

  if (objectIds.length > 1) {
    tx.mergeCoins(
      tx.object(coinObjectId),
      objectIds.slice(1).map((item) => tx.object(item)),
    );
  }

  //handle split coin
  const pureAmount = [];
  for (const split of splits) {
    pureAmount.push(tx.pure(split));
  }

  // split correct amount to swap
  const coinData = tx.splitCoins(tx.object(coinObjectId), pureAmount);
  return { tx, coinData };
};
