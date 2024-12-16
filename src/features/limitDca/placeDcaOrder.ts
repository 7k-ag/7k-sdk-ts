import { DCA_ORDER_MODULE_ID, GLOBAL_CONFIG_ID } from "./constants";
import {
  coinWithBalance,
  Transaction,
  TransactionObjectArgument,
} from "@mysten/sui/transactions";

interface PlaceDcaOrderParams {
  payCoinType: string;
  targetCoinType: string;
  payCoinAmountEach: bigint;
  numOrders: number;
  interval: number;
  slippage: bigint;
  minRate: bigint;
  maxRate: bigint;
}

export async function placeDcaOrder({
  payCoinType,
  targetCoinType,
  payCoinAmountEach,
  numOrders,
  interval,
  slippage,
  minRate,
  maxRate,
}: PlaceDcaOrderParams) {
  const tx = new Transaction();

  const coinElements: TransactionObjectArgument[] = [];
  for (let i = 0; i < numOrders; i++) {
    const coin = coinWithBalance({
      type: payCoinType,
      balance: payCoinAmountEach,
    });
    coinElements.push(coin);
  }
  const vectorCoin = tx.makeMoveVec({
    elements: coinElements,
  });
  tx.moveCall({
    target: `${DCA_ORDER_MODULE_ID}::place_dca_order`,
    arguments: [
      tx.object(GLOBAL_CONFIG_ID),
      vectorCoin,
      tx.pure.u64(interval),
      tx.pure.u64(slippage),
      tx.pure.u64(minRate),
      tx.pure.u64(maxRate),
      tx.object.clock(),
    ],
    typeArguments: [payCoinType, targetCoinType],
  });

  return tx;
}
