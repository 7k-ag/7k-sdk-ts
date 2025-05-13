import {
  SuiTransactionBlockResponse,
  SuiTransactionBlockResponseOptions,
} from "@mysten/sui/client";
import { Config } from "../../config";
import { executeBluefinTx } from "../../libs/protocols/bluefinx/client";
import { BluefinXTx } from "../../libs/protocols/bluefinx/types";
import { AggregatorTx } from "../../types/aggregator";

/**
 * Execute a transaction after it is signed
 *
 * Automatically handle BluefinX transaction execution if needed
 * @example
 * ```ts
 * const { mutateAsync: signTransaction } = useSignTransaction();
 * const quoteResponse = await getQuote(...quoteParams);
 * const { tx } = await buildTx(...buildTxParams);
 * const {signature, bytes} = await signTransaction({
 *  transaction: tx instanceof BluefinXTx ? tx.txBytes : tx,
 * });
 * const res = await executeTx(tx, signature, bytes);
 * ```
 * @param tx - AggregatorTx - received from `buildTx`
 * @param signature - User signature after signing the transaction
 * @param signedTxBytes - Signed transaction bytes after signing the transaction
 * @param options - Options for the transaction
 * @returns `SuiTransactionBlockResponse`
 */
export const executeTx = async (
  tx: AggregatorTx,
  signature: string,
  signedTxBytes: string,
  options?: SuiTransactionBlockResponseOptions,
) => {
  const isBluefinTx = tx instanceof BluefinXTx;
  const client = Config.getSuiClient();
  let res: SuiTransactionBlockResponse;
  if (isBluefinTx) {
    try {
      const result = await executeBluefinTx(tx, signature);
      res = await client.waitForTransaction({
        digest: result.txDigest,
        options,
      });
    } catch (e) {
      throw Error(
        `Could not retrieve BluefinX transaction with quoteId: ${tx.quoteId} ${e}`,
      );
    }
  } else {
    res = await client.executeTransactionBlock({
      transactionBlock: signedTxBytes,
      signature,
      options,
    });
  }

  return res;
};
