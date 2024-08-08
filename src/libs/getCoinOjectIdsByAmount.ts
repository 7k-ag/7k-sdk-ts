import { CoinStruct, PaginatedCoins } from "@mysten/sui/client";
import BigNumber from "bignumber.js";
import { getSuiClient } from "../suiClient";

const orderByKey = (array: any[], key: string, sortBy: "desc" | "asc") => {
  if (!array?.length) {
    return;
  }
  let swapped;
  const compareFunctionName =
    sortBy === "desc" ? "isLessThan" : "isGreaterThan";
  do {
    swapped = false;
    for (let i = 0; i < array.length - 1; i++) {
      if (
        new BigNumber(array[i][key])[compareFunctionName](array[i + 1][key])
      ) {
        const temp = array[i];
        array[i] = array[i + 1];
        array[i + 1] = temp;
        swapped = true;
      }
    }
  } while (swapped);
  return array;
};

export const getCoinOjectIdsByAmount = async (
  address: string,
  amount: string,
  coinType: string,
): Promise<{
  objectIds: string[];
  objectCoins: CoinStruct[];
  balance: string;
}> => {
  let coinBalances: CoinStruct[] = [];
  let hasNextPage = true;
  let nextCursor = undefined;
  while (hasNextPage) {
    try {
      const coins: PaginatedCoins = await getSuiClient().getCoins({
        owner: address,
        coinType,
        cursor: nextCursor,
      });
      coinBalances = [...coinBalances, ...coins.data];
      hasNextPage = coins.hasNextPage;
      nextCursor = coins.nextCursor;
    } catch (error) {
      console.error("Error fetching data:", error);
      hasNextPage = false;
    }
  }
  // sort coin balance before get object id
  const coinObj = orderByKey(
    coinBalances.map((item) => {
      return {
        ...item,
        balance: item.balance,
      };
    }),
    "balance",
    "desc",
  );
  let balance = "0";
  const objectIds = [] as any;
  const objectCoins = [];
  for (const coin of coinObj ?? []) {
    balance = new BigNumber(coin.balance).plus(balance).toFixed();
    objectIds.push(coin.coinObjectId);
    objectCoins.push(coin);
    if (new BigNumber(balance).isGreaterThanOrEqualTo(amount)) {
      break;
    }
  }
  return { objectIds, balance, objectCoins };
};
