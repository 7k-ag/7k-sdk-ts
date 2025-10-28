import {
  Transaction,
  TransactionObjectArgument,
} from "@mysten/sui/transactions";
import { normalizeStructTag, parseStructTag, toHex } from "@mysten/sui/utils";
import { Config, ExtraOracle, TxSorSwap } from "../../types/aggregator";
import { SuiUtils } from "../../utils/sui";

export interface BaseContractParams {
  swapInfo: TxSorSwap;
  inputCoinObject: TransactionObjectArgument;
  currentAccount: string;
  config: Config;
  /** map price feed id to onchain priceInfoObject id */
  pythMap: Record<string, string>;
}

export abstract class BaseContract<T = any> {
  protected swapInfo: TxSorSwap;
  protected inputCoinObject: TransactionObjectArgument;
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

  abstract swap(tx: Transaction): Promise<TransactionObjectArgument>;

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

  protected getPythPriceInfoId(oracle?: ExtraOracle) {
    // FIXME: deprecation price_identifier in the next version
    const bytes =
      oracle?.Pyth?.bytes || (oracle?.Pyth as any)?.price_identifier?.bytes;
    if (!bytes) {
      throw new Error(`Invalid oracle info for getPythPriceInfoId`);
    }
    const feedId = "0x" + toHex(Uint8Array.from(bytes));
    const id = this.pythMap[feedId];
    if (!id) {
      throw new Error(`Missing price info for oracle ${feedId}`);
    }
    return id;
  }
}
