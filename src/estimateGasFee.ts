import BigNumber from "bignumber.js";
import { SUI_DECIMALS } from "@mysten/sui.js/utils";
import { buildTx } from "./buildTx";
import { BIG_ZERO } from "./constants/amount";
import { getSuiscanTokenMetadata } from "./utils/token";
import { formatBalance } from "./utils/number";
import { SUI_TYPE } from "./constants/tokens";
import { BuildTxParams } from "./types/tx";
import { getSuiClient } from "./suiClient";

export async function estimateGasFee({
  quoteResponse,
  accountAddress,
  slippage,
  tx: _tx,
  commission,
}: BuildTxParams): Promise<BigNumber> {
  if (!accountAddress) return BIG_ZERO;

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

  if (!tx) return BIG_ZERO;

  const suiToken = await getSuiscanTokenMetadata(SUI_TYPE);
  const suiPrice = suiToken?.tokenPrice ?? "0";
  const suiDecimals = suiToken?.decimals ?? SUI_DECIMALS;

  const {
    effects: { gasUsed, status },
  } = await getSuiClient().devInspectTransactionBlock({
    sender: accountAddress,
    transactionBlock: tx,
  });

  if (status.status !== "success") return BIG_ZERO;

  const fee = new BigNumber(gasUsed.computationCost)
    .plus(gasUsed.storageCost)
    .minus(gasUsed.storageRebate);
  const feeUsd = new BigNumber(suiPrice).multipliedBy(
    formatBalance(fee, suiDecimals),
  );

  return feeUsd;
}
