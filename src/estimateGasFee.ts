import BigNumber from "bignumber.js";
import { SUI_DECIMALS } from "@mysten/sui/utils";
import { buildTx } from "./buildTx";
import { formatBalance } from "./utils/number";
import { EstimateGasFeeParams } from "./types/tx";
import { getSuiClient } from "./suiClient";
import { getSuiPrice } from "./getSuiPrice";

export async function estimateGasFee({
  quoteResponse,
  accountAddress,
  slippage,
  suiPrice: _suiPrice,
  extendTx,
  commission,
}: EstimateGasFeeParams): Promise<number> {
  if (!accountAddress) return 0;

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

  if (!tx) return 0;

  const suiPrice = _suiPrice || (await getSuiPrice());
  const suiDecimals = SUI_DECIMALS;

  const {
    effects: { gasUsed, status },
  } = await getSuiClient().devInspectTransactionBlock({
    sender: accountAddress,
    transactionBlock: tx,
  });

  if (status.status !== "success") return 0;

  const fee = new BigNumber(gasUsed.computationCost)
    .plus(gasUsed.storageCost)
    .minus(gasUsed.storageRebate);
  const feeUsd = new BigNumber(suiPrice).multipliedBy(
    formatBalance(fee, suiDecimals),
  );

  return feeUsd.toNumber();
}
