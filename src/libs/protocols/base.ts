import { Transaction } from "@mysten/sui/transactions";
import { TxSorSwap } from "../../types/aggregator";
import { normalizeStructTag, parseStructTag } from "@mysten/sui/utils";
import { SuiUtils } from "../../utils/sui";
import { TransactionResultItem } from "../../types/sui";

export interface BaseContractParams {
  swapInfo: TxSorSwap;
  inputCoinObject: TransactionResultItem;
  currentAccount: string;
}

export abstract class BaseContract {
  protected swapInfo: TxSorSwap;
  protected inputCoinObject: TransactionResultItem;
  protected currentAccount: string;

  constructor({
    swapInfo,
    inputCoinObject,
    currentAccount,
  }: BaseContractParams) {
    this.swapInfo = swapInfo;
    this.inputCoinObject = inputCoinObject;
    this.currentAccount = currentAccount;
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
