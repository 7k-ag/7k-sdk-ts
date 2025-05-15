import { Transaction } from "@mysten/sui/transactions";
import { Config, TxSorSwap } from "../../types/aggregator";
import { normalizeStructTag, parseStructTag } from "@mysten/sui/utils";
import { SuiUtils } from "../../utils/sui";
import { TransactionResultItem } from "../../types/sui";

export interface BaseContractParams {
  swapInfo: TxSorSwap;
  inputCoinObject: TransactionResultItem;
  currentAccount: string;
  config: Config;
  /** map price feed id to onchain priceInfoObject id */
  pythMap: Record<string, string>;
}

export abstract class BaseContract<T = any> {
  protected swapInfo: TxSorSwap;
  protected inputCoinObject: TransactionResultItem;
  protected currentAccount: string;
  protected config: Config;
  protected pythMap: Record<string, string>;

  constructor({
    swapInfo,
    inputCoinObject,
    currentAccount,
    config,
    pythMap,
  }: BaseContractParams) {
    this.swapInfo = swapInfo;
    this.inputCoinObject = inputCoinObject;
    this.currentAccount = currentAccount;
    this.config = config;
    this.pythMap = pythMap;
  }

  abstract swap(tx: Transaction): Promise<TransactionResultItem>;

  protected getInputCoinValue(tx: Transaction) {
    return SuiUtils.getCoinValue(
      this.swapInfo.assetIn,
      this.inputCoinObject,
      tx,
    );
  }

  protected getTypeParams() {
    return parseStructTag(
      this.swapInfo.extra?.poolStructTag || "",
    ).typeParams.map(normalizeStructTag);
  }

  protected get extra() {
    const extra = this.swapInfo.extra as T;
    if (!extra) {
      throw new Error(`Invalid extra info for getExtra`);
    }
    return extra;
  }
}
