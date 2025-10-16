import { coinWithBalance, Transaction } from "@mysten/sui/transactions";
import { GLOBAL_CONFIG_ID, LIMIT_ORDER_MODULE_ID } from "./constants";

export interface PlaceLimitOrderParams {
  accountAddress: string;
  payCoinType: string;
  targetCoinType: string;
  payCoinAmount: bigint;
  rate: bigint;
  slippage: bigint;
  expireTs: bigint;
  devInspect?: boolean;
}

export async function placeLimitOrder({
  accountAddress,
  payCoinType,
  targetCoinType,
  payCoinAmount,
  rate,
  slippage,
  expireTs,
  devInspect,
}: PlaceLimitOrderParams) {
  const tx = new Transaction();
  const payCoin = tx.add(
    coinWithBalance({
      type: payCoinType,
      balance: payCoinAmount,
      useGasCoin: !devInspect,
    }),
  );

  tx.moveCall({
    target: `${LIMIT_ORDER_MODULE_ID}::place_limit_order`,
    arguments: [
      tx.object(GLOBAL_CONFIG_ID),
      payCoin,
      tx.pure.u64(rate),
      tx.pure.u64(slippage),
      tx.pure.u64(expireTs),
      tx.object.clock(),
    ],
    typeArguments: [payCoinType, targetCoinType],
  });

  tx.setSenderIfNotSet(accountAddress);
  return tx;
}
