import { ClientWithCoreApi, SuiClientTypes } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { CustomObjectCache } from "./ObjectCache";

export interface SimulateTransactionInput {
  sender: string;
  transactionBlock: Transaction;
}

export type SimulateTransactionResult =
  SuiClientTypes.SimulateTransactionResult<{
    effects: true;
    events: true;
    commandResults: true;
  }>;

/**
 * Utility class for interacting with the Sui blockchain via any
 * {@link ClientWithCoreApi} implementation (gRPC, GraphQL, JSON-RPC).
 *
 * Wraps `client.core.simulateTransaction` and applies the shared
 * {@link CustomObjectCache} build plugin so multi-object lookups are
 * batched and cached on the hot path.
 */
export class SuiClientUtils {
  #devInspectCache: CustomObjectCache;
  // The Transaction.addBuildPlugin API has no idempotency guard: calling it
  // twice with the same plugin instance pushes two entries and runs the
  // cache plugin twice on the next build. Track which transactions have
  // already had the plugin attached.
  #attachedTxns = new WeakSet<Transaction>();

  /**
   * Creates a new instance of SuiClientUtils
   * @param client - Any Sui client implementing `ClientWithCoreApi`
   */
  constructor(private client: ClientWithCoreApi) {
    this.#devInspectCache = new CustomObjectCache({ client: this.client });
  }

  simulateTransaction = async (
    params: SimulateTransactionInput,
  ): Promise<SimulateTransactionResult> => {
    params.transactionBlock.setSenderIfNotSet(params.sender);
    if (!this.#attachedTxns.has(params.transactionBlock)) {
      params.transactionBlock.addBuildPlugin(this.#devInspectCache.asPlugin());
      this.#attachedTxns.add(params.transactionBlock);
    }
    try {
      const res = await this.client.core.simulateTransaction({
        transaction: params.transactionBlock,
        checksEnabled: false,
        include: {
          effects: true,
          events: true,
          commandResults: true,
        },
      });
      return res;
    } catch (error) {
      await this.#devInspectCache.clear();
      throw error;
    } finally {
      await this.#devInspectCache.clearOwnedObjects();
    }
  };
}
