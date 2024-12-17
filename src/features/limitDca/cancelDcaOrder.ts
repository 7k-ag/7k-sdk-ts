import { Transaction } from "@mysten/sui/transactions";
import { DCA_ORDER_MODULE_ID } from "./constants";

interface CancelDcaOrderParams {
  orderId: string;
  payCoinType: string;
  targetCoinType: string;
}

export async function cancelDcaOrder({
  orderId,
  payCoinType,
  targetCoinType,
}: CancelDcaOrderParams) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${DCA_ORDER_MODULE_ID}::cancel_dca_order`,
    arguments: [tx.object(orderId), tx.object.clock()],
    typeArguments: [payCoinType, targetCoinType],
  });

  return tx;
}
