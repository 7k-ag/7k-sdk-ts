import { CoinStruct, PaginatedCoins } from "@mysten/sui/client";
import { Config } from "../config";

const orderByKey = <T extends object>(
  array: T[],
  key: string,
  sortBy: "desc" | "asc",
) => {
  if (!array?.length) {
    return;
  }
  let swapped: boolean;
  do {
    swapped = false;
    for (let i = 0; i < array.length - 1; i++) {
      const a = BigInt((array[i] as any)[key]);
      const b = BigInt((array[i + 1] as any)[key]);
      if (sortBy === "desc" ? a < b : a > b) {
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
  let nextCursor: string | null | undefined = undefined;
  while (hasNextPage) {
    try {
      const coins: PaginatedCoins = await Config.getSuiClient().getCoins({
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
  const coinObj =
    orderByKey(
      coinBalances.map((item) => {
        return {
          ...item,
          balance: item.balance,
        };
      }),
      "balance",
      "desc",
    ) ?? [];
  let balance = "0";
  const objectIds: string[] = [];
  const objectCoins: CoinStruct[] = [];
  for (const coin of coinObj) {
    balance = (BigInt(coin.balance) + BigInt(balance)).toString(10);
    objectIds.push(coin.coinObjectId);
    objectCoins.push(coin);
    if (BigInt(balance) >= BigInt(amount)) {
      break;
    }
  }
  return { objectIds, balance, objectCoins };
};
