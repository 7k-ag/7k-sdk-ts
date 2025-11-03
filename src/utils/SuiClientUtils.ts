import {
  DevInspectTransactionBlockParams,
  SuiClient,
} from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { CustomObjectCache } from "./ObjectCache";

/**
 * Utility class for interacting with Sui blockchain coins
 */
export class SuiClientUtils {
  #devInspectCache: CustomObjectCache;
  /**
   * Creates a new instance of SuiClientUtils
   * @param client - The Sui client instance to use for blockchain interactions
   */
  constructor(private client: SuiClient) {
    this.#devInspectCache = new CustomObjectCache({ client: this.client });
  }

  devInspectTransactionBlock = async (
    params: DevInspectTransactionBlockParams,
  ) => {
    if (params.transactionBlock instanceof Transaction) {
      params.transactionBlock.addBuildPlugin(this.#devInspectCache.asPlugin());
    }
    try {
      const res = await this.client.devInspectTransactionBlock(params);
      return res;
    } catch (error) {
      // clear all cache if devInspectTransactionBlock fails
      await this.#devInspectCache.clear();
      throw error;
    } finally {
      await this.#devInspectCache.clearOwnedObjects();
    }
  };
}
