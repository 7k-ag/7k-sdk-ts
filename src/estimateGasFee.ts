import BigNumber from "bignumber.js";
import { SUI_DECIMALS } from "@mysten/sui.js/utils";
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
  tx: _tx,
  commission,
}: EstimateGasFeeParams): Promise<number> {
  if (!accountAddress) return 0;

  const tx = await buildTx({
    tx: _tx,
    quoteResponse,
    accountAddress,
    slippage,
    commission,
  }).catch((err) => {
    console.log("build tx error: ", err);
    return undefined;
  });

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
