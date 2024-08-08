import { TransactionArgument, Transaction } from "@mysten/sui/transactions";
import {
  CoinStruct,
  PaginatedObjectsResponse,
  SuiObjectResponseQuery,
} from "@mysten/sui/client";
import { parseStructTag } from "@mysten/sui/utils";
import { checkIsSui } from "./token";
import { getSuiClient } from "../suiClient";

type DataPage<T> = {
  data: T[];
  nextCursor?: any;
  hasNextPage: boolean;
};

type PageQuery = {
  cursor?: any;
  limit?: number | null;
};

type PaginationArgs = "all" | PageQuery;

export const SuiUtils = {
  getSuiCoin(
    amount: bigint | TransactionArgument,
    txb: Transaction,
  ): TransactionArgument {
    const [coin] = txb.splitCoins(txb.gas, [amount]);
    return coin;
  },

  mergeCoins(
    coinObjects: Array<string | TransactionArgument>,
    txb: Transaction,
  ): TransactionArgument | undefined {
    if (coinObjects.length == 1) {
      return typeof coinObjects[0] == "string"
        ? txb.object(coinObjects[0])
        : coinObjects[0];
    }
    const firstCoin =
      typeof coinObjects[0] == "string"
        ? txb.object(coinObjects[0])
        : coinObjects[0];
    txb.mergeCoins(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      firstCoin,
      coinObjects
        .slice(1)
        .map((coin) => (typeof coin == "string" ? txb.object(coin) : coin)),
    );
    return firstCoin;
  },

  getCoinValue(
    coinType: string,
    coinObject: string | TransactionArgument,
    txb: Transaction,
  ): TransactionArgument {
    const inputCoinObject =
      typeof coinObject == "string" ? txb.object(coinObject) : coinObject;
    const [value] = txb.moveCall({
      target: `0x2::coin::value`,
      typeArguments: [coinType],
      arguments: [inputCoinObject],
    });
    return value;
  },

  getExactCoinByAmount(
    coinType: string,
    coins: { objectId: string; balance: bigint }[],
    amount: bigint,
    txb: Transaction,
  ) {
    if (checkIsSui(coinType)) {
      const [coinA] = txb.splitCoins(txb.gas, [amount]);
      return coinA;
    } else {
      const coinsX = SuiUtils.getCoinsGreaterThanAmount(amount, coins);

      if (coinsX.length > 1) {
        txb.mergeCoins(
          txb.object(coinsX[0]),
          coinsX.slice(1).map((coin) => txb.object(coin)),
        );
      }

      const [coinA] = txb.splitCoins(txb.object(coinsX[0]), [amount]);
      return coinA;
    }
  },

  async mergeAllUserCoins(coinType: string, signerAddress: string) {
    try {
      const coins = await SuiUtils.getAllUserCoins({
        address: signerAddress,
        type: coinType,
      });

      let totalBalance = BigInt(0);

      coins.forEach((coin) => {
        totalBalance += BigInt(coin.balance);
      });

      const txb = new Transaction();

      if (checkIsSui(coinType)) {
        totalBalance = totalBalance - BigInt("1000");
        txb.splitCoins(txb.gas, [totalBalance]);
      }

      const coinObjectsIds = coins.map((coin) => coin.coinObjectId);

      if (coins.length > 1) {
        txb.mergeCoins(
          txb.object(coinObjectsIds[0]),
          coinObjectsIds.slice(1).map((coin) => txb.object(coin)),
        );
      }

      return txb;
    } catch (error) {
      console.log(error);
    }
  },

  mergeAllCoinsWithoutFetch(
    coins: CoinStruct[],
    coinType: string,
    txb: Transaction,
  ) {
    let totalBalance = BigInt(0);
    coins.forEach((coin) => {
      totalBalance += BigInt(coin.balance);
    });

    if (checkIsSui(coinType)) {
      totalBalance = totalBalance - BigInt("1000");
      txb.splitCoins(txb.gas, [totalBalance]);
    }

    const coinObjectsIds = coins.map((coin) => coin.coinObjectId);

    if (coins.length > 1) {
      txb.mergeCoins(
        txb.object(coinObjectsIds[0]),
        coinObjectsIds.slice(1).map((coin) => txb.object(coin)),
      );
    }
  },

  async getAllUserCoins({ address, type }: { type: string; address: string }) {
    let cursor: string | null | undefined = undefined;

    let coins: CoinStruct[] = [];
    let iter = 0;

    do {
      try {
        const res = await getSuiClient().getCoins({
          owner: address,
          coinType: type,
          cursor: cursor,
          limit: 50,
        });
        coins = coins.concat(res.data);
        cursor = res.nextCursor;
        if (!res.hasNextPage || iter === 8) {
          cursor = null;
        }
      } catch (error) {
        console.log(error);
        cursor = null;
      }
      iter++;
    } while (cursor !== null);

    return coins;
  },

  getCoinsGreaterThanAmount(
    amount: bigint,
    coins: { objectId: string; balance: bigint }[],
  ) {
    const coinsWithBalance: string[] = [];

    let collectedAmount = BigInt(0);

    for (const coin of coins) {
      if (
        collectedAmount < amount &&
        !coinsWithBalance.includes(coin.objectId)
      ) {
        coinsWithBalance.push(coin.objectId);
        collectedAmount = collectedAmount + coin.balance;
      }
      if (
        coin.balance === BigInt(0) &&
        !coinsWithBalance.includes(coin.objectId)
      )
        coinsWithBalance.push(coin.objectId);
    }

    if (collectedAmount >= amount) {
      return coinsWithBalance;
    } else {
      throw new Error("Insufficient balance");
    }
  },

  async getOwnedObjectsByPage(
    owner: string,
    query: SuiObjectResponseQuery,
    paginationArgs: PaginationArgs = "all",
  ): Promise<DataPage<any>> {
    let result: any = [];
    let hasNextPage = true;
    const queryAll = paginationArgs === "all";
    let nextCursor = queryAll ? null : paginationArgs.cursor;
    do {
      const res: PaginatedObjectsResponse =
        await getSuiClient().getOwnedObjects({
          owner,
          ...query,
          cursor: nextCursor,
          limit: queryAll ? null : paginationArgs.limit,
        });
      if (res.data) {
        result = [...result, ...res.data];
        hasNextPage = res.hasNextPage;
        nextCursor = res.nextCursor;
      } else {
        hasNextPage = false;
      }
    } while (queryAll && hasNextPage);

    return { data: result, nextCursor, hasNextPage };
  },

  isValidStructTag(value: string) {
    try {
      return !!parseStructTag(value);
    } catch (error) {
      return false;
    }
  },
};
