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
}

export abstract class BaseContract {
  protected swapInfo: TxSorSwap;
  protected inputCoinObject: TransactionResultItem;
  protected currentAccount: string;
  protected config: Config;

  constructor({
    swapInfo,
    inputCoinObject,
    currentAccount,
    config,
  }: BaseContractParams) {
    this.swapInfo = swapInfo;
    this.inputCoinObject = inputCoinObject;
    this.currentAccount = currentAccount;
    this.config = config;
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
}
