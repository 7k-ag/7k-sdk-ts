import { SUI_DECIMALS } from "@mysten/sui/utils";
import { Config } from "../../config";
import { isBluefinXRouting } from "../../types/aggregator";
import { EstimateGasFeeParams } from "../../types/tx";
import { formatBalance } from "../../utils/number";
import { getSuiPrice } from "../prices";
import { buildTx } from "./buildTx";
import { BluefinXTx } from "../../libs/protocols/bluefinx/types";

export async function estimateGasFee({
  quoteResponse,
  accountAddress,
  slippage,
  suiPrice: _suiPrice,
  extendTx,
  commission,
}: EstimateGasFeeParams): Promise<number> {
  if (!accountAddress) return 0;
  // BluefinX is sponsored, no need to estimate gas fee
  if (!accountAddress || isBluefinXRouting(quoteResponse)) return 0;

  const result = await buildTx({
    extendTx,
    quoteResponse,
    accountAddress,
    slippage,
    commission,
    devInspect: true,
  }).catch((err) => {
    console.log("build tx error: ", err);
    return undefined;
  });

  const { tx } = result || {};

  if (!tx || tx instanceof BluefinXTx) return 0;

  const suiPrice = _suiPrice || (await getSuiPrice());
  const suiDecimals = SUI_DECIMALS;

  const {
    effects: { gasUsed, status },
  } = await Config.getSuiClient().devInspectTransactionBlock({
    sender: accountAddress,
    transactionBlock: tx,
  });

  if (status.status !== "success") return 0;

  const fee =
    BigInt(gasUsed.computationCost) +
    BigInt(gasUsed.storageCost) -
    BigInt(gasUsed.storageRebate);
  const feeUsd = Number(suiPrice) * Number(formatBalance(fee, suiDecimals));

  return feeUsd;
}
