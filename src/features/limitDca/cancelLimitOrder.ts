import { Transaction } from "@mysten/sui/transactions";
import { LIMIT_ORDER_MODULE_ID } from "./constants";

interface CancelLimitOrderParams {
  orderId: string;
  payCoinType: string;
  targetCoinType: string;
}

export async function cancelLimitOrder({
  orderId,
  payCoinType,
  targetCoinType,
}: CancelLimitOrderParams) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${LIMIT_ORDER_MODULE_ID}::cancel_limit_order`,
    typeArguments: [payCoinType, targetCoinType],
    arguments: [tx.object(orderId), tx.object.clock()],
  });

  return tx;
}
