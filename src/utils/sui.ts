import {
  TransactionArgument,
  TransactionBlock,
} from "@mysten/sui.js/transactions";
import {
  CoinStruct,
  PaginatedObjectsResponse,
  SuiObjectResponseQuery,
} from "@mysten/sui.js/client";
import { parseStructTag } from "@mysten/sui.js/utils";
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
    txb: TransactionBlock,
  ): TransactionArgument {
    const inputCoinAmount =
      typeof amount === "bigint" ? txb.pure(amount) : amount;
    const [coin] = txb.splitCoins(txb.gas, [inputCoinAmount]);
    return coin;
  },

  mergeCoins(
    coinObjects: Array<string | TransactionArgument>,
    txb: TransactionBlock,
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
      // @ts-expect-error mismatched typing
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
    txb: TransactionBlock,
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
    txb: TransactionBlock,
  ) {
    if (checkIsSui(coinType)) {
      const [coinA] = txb.splitCoins(txb.gas, [txb.pure(amount)]);
      return coinA;
    } else {
      const coinsX = SuiUtils.getCoinsGreaterThanAmount(amount, coins);

      if (coinsX.length > 1) {
        txb.mergeCoins(
          txb.object(coinsX[0]),
          coinsX.slice(1).map((coin) => txb.object(coin)),
        );
      }

      const [coinA] = txb.splitCoins(txb.object(coinsX[0]), [txb.pure(amount)]);
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

      const txb = new TransactionBlock();

      if (checkIsSui(coinType)) {
        totalBalance = totalBalance - BigInt("1000");
        txb.splitCoins(txb.gas, [txb.pure(totalBalance.toString())]);
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
    txb: TransactionBlock,
  ) {
    let totalBalance = BigInt(0);
    coins.forEach((coin) => {
      totalBalance += BigInt(coin.balance);
    });

    if (checkIsSui(coinType)) {
      totalBalance = totalBalance - BigInt("1000");
      txb.splitCoins(txb.gas, [txb.pure(totalBalance.toString())]);
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
