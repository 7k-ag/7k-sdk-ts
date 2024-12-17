import { Transaction } from "@mysten/sui/transactions";
import { LIMIT_ORDER_MODULE_ID } from "./constants";

interface ClaimExpiredLimitOrderParams {
  orderId: string;
  payCoinType: string;
  targetCoinType: string;
}

export async function claimExpiredLimitOrder({
  orderId,
  payCoinType,
  targetCoinType,
}: ClaimExpiredLimitOrderParams) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${LIMIT_ORDER_MODULE_ID}::claim_expired_order`,
    typeArguments: [payCoinType, targetCoinType],
    arguments: [tx.object(orderId), tx.object.clock()],
  });

  return tx;
}
