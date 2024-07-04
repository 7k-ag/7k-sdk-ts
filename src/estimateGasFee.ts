import BigNumber from "bignumber.js";
import { SUI_DECIMALS } from "@mysten/sui.js/utils";
import { buildTx } from "./buildTx";
import { BIG_ZERO } from "./constants/amount";
import { getSuiscanTokenMetadata } from "./utils/token";
import { suiClient } from "./constants/suiClient";
import { formatBalance } from "./utils/number";
import { SUI_TYPE } from "./constants/tokens";
import { BuildTxParams } from "./types/tx";

export async function estimateGasFee({
  tx: _tx,
  sorResponse,
  accountAddress,
  slippage,
  commissionPartner,
  commissionBps,
}: BuildTxParams): Promise<BigNumber> {
  if (!accountAddress) return BIG_ZERO;

  const tx = await buildTx({
    tx: _tx,
    sorResponse,
    accountAddress,
    slippage,
    commissionPartner,
    commissionBps,
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
  } = await suiClient.devInspectTransactionBlock({
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
