import { Transaction, TransactionArgument } from "@mysten/sui/transactions";
import { normalizeSuiAddress, parseStructTag } from "@mysten/sui/utils";
import {
  _7K_META_CONFIG,
  _7K_META_PACKAGE_ID,
  _7K_META_VAULT,
} from "../constants/_7k";

export const SuiUtils = {
  getSuiCoin(
    amount: bigint | TransactionArgument,
    txb: Transaction,
  ): TransactionArgument {
    const [coin] = txb.splitCoins(txb.gas, [amount]);
    return coin;
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

  isValidStructTag(value: string) {
    try {
      return !!parseStructTag(value);
    } catch (_) {
      return false;
    }
  },

  zeroBalance(tx: Transaction, coinType: string) {
    return tx.moveCall({
      target: `0x2::balance::zero`,
      typeArguments: [coinType],
      arguments: [],
    })[0];
  },

  zeroCoin(tx: Transaction, coinType: string) {
    return tx.moveCall({
      target: `0x2::coin::zero`,
      typeArguments: [coinType],
      arguments: [],
    })[0];
  },

  coinIntoBalance(
    tx: Transaction,
    coinType: string,
    coinObject: TransactionArgument,
  ) {
    return tx.moveCall({
      target: `0x2::coin::into_balance`,
      typeArguments: [coinType],
      arguments: [coinObject],
    })[0];
  },

  coinFromBalance(
    tx: Transaction,
    coinType: string,
    balance: TransactionArgument,
  ) {
    return tx.moveCall({
      target: `0x2::coin::from_balance`,
      typeArguments: [coinType],
      arguments: [balance],
    })[0];
  },

  balanceDestroyZero(
    tx: Transaction,
    coinType: string,
    balance: TransactionArgument,
  ) {
    tx.moveCall({
      target: `0x2::balance::destroy_zero`,
      typeArguments: [coinType],
      arguments: [balance],
    });
  },

  collectDust(tx: Transaction, coinType: string, coin: TransactionArgument) {
    tx.moveCall({
      target: `${_7K_META_PACKAGE_ID}::vault::collect_dust`,
      typeArguments: [coinType],
      arguments: [tx.object(_7K_META_VAULT), tx.object(_7K_META_CONFIG), coin],
    });
  },

  transferOrDestroyZeroCoin(
    tx: Transaction,
    coinType: string,
    coin: TransactionArgument,
    address: string,
  ) {
    tx.moveCall({
      target: `${_7K_META_PACKAGE_ID}::utils::transfer_or_destroy`,
      typeArguments: [coinType],
      arguments: [coin, tx.pure.address(address)],
    });
  },
};

const RESERVED_ADDRESSES = [
  "0x0000000000000000000000000000000000000000000000000000000000000000", // zero
  "0x0000000000000000000000000000000000000000000000000000000000000001", // std
  "0x0000000000000000000000000000000000000000000000000000000000000002", // sui framework
  "0x0000000000000000000000000000000000000000000000000000000000000003", // unknown but we reserved to be safe
  "0x0000000000000000000000000000000000000000000000000000000000000004", // unknown but we reserved to be safe
  "0x0000000000000000000000000000000000000000000000000000000000000005", // system state
  "0x0000000000000000000000000000000000000000000000000000000000000006", // time
  "0x0000000000000000000000000000000000000000000000000000000000000007", // unknown but we reserved to be safe
  "0x0000000000000000000000000000000000000000000000000000000000000008", // random
  "0x0000000000000000000000000000000000000000000000000000000000000009", // unknown but we reserved to be safe
  "0x0000000000000000000000000000000000000000000000000000000000000403", // coin deny list
  "0x000000000000000000000000000000000000000000000000000000000000000c", // coin registry
];

export const isSystemAddress = (address: string) => {
  const addr = normalizeSuiAddress(address);
  return RESERVED_ADDRESSES.includes(addr);
};
