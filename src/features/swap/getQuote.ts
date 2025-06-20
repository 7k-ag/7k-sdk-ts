import { normalizeStructTag, normalizeSuiObjectId } from "@mysten/sui/utils";
import { fetchClient } from "../../config/fetchClient";
import { API_ENDPOINTS } from "../../constants/apiEndpoints";
import {
  isBluefinXRouting,
  QuoteResponse,
  SourceDex,
} from "../../types/aggregator";

interface Params {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  /**
   * @default DEFAULT_SOURCES
   * @warning BluefinX must be explicitly specified if needed
   * @example ```sources: [...DEFAULT_SOURCES, "bluefinx"]``` */
  sources?: SourceDex[];
  commissionBps?: number;
  /** Limit the route to a specific set of pools */
  targetPools?: string[];
  /** Exclude a specific set of pools from the route */
  excludedPools?: string[];
  /** The taker address, required for bluefinx */
  taker?: string;
}

export const DEFAULT_SOURCES: SourceDex[] = [
  "suiswap",
  "turbos",
  "cetus",
  "bluemove",
  "kriya",
  "kriya_v3",
  "aftermath",
  "deepbook_v3",
  "flowx",
  "flowx_v3",
  "bluefin",
  "springsui",
  "obric",
  "stsui",
  "steamm",
  "steamm_oracle_quoter",
  "steamm_oracle_quoter_v2",
  "magma",
  "haedal_pmm",
  "momentum",
  "sevenk_v1",
];

export async function getQuote({
  tokenIn,
  tokenOut,
  amountIn,
  sources = DEFAULT_SOURCES,
  commissionBps,
  targetPools,
  excludedPools,
  taker,
}: Params) {
  const params = new URLSearchParams({
    amount: amountIn,
    from: normalizeStructTag(tokenIn),
    to: normalizeStructTag(tokenOut),
    sources: sources.join(","),
  });
  if (targetPools?.length) {
    params.append(
      "target_pools",
      targetPools.map((v) => normalizeSuiObjectId(v)).join(","),
    );
  }
  if (excludedPools?.length) {
    params.append(
      "excluded_pools",
      excludedPools.map((v) => normalizeSuiObjectId(v)).join(","),
    );
  }
  if (taker) {
    params.append("taker", taker);
  }
  const response = await fetchClient(`${API_ENDPOINTS.MAIN}/quote?${params}`);

  if (!response.ok) {
    throw new Error("Failed to fetch aggregator quote");
  }

  const quoteResponse = (await response.json()) as QuoteResponse;
  computeReturnAmountAfterCommission(quoteResponse, commissionBps);
  return quoteResponse;
}

const computeReturnAmountAfterCommission = (
  quoteResponse: QuoteResponse,
  commissionBps?: number,
) => {
  const _commissionBps = isBluefinXRouting(quoteResponse) ? 0 : commissionBps;
  if (quoteResponse.returnAmount && +quoteResponse.returnAmount > 0) {
    quoteResponse.returnAmountAfterCommissionWithDecimal = (
      (BigInt(quoteResponse.returnAmountWithDecimal || 0) *
        BigInt(10_000 - (_commissionBps ?? 0))) /
      BigInt(10_000)
    ).toString(10);
    const exp = Math.round(
      +quoteResponse.returnAmountWithDecimal / +quoteResponse.returnAmount,
    );
    quoteResponse.returnAmountAfterCommission = (
      +quoteResponse.returnAmountAfterCommissionWithDecimal / exp
    ).toString(10);
  } else {
    quoteResponse.returnAmountAfterCommission = "";
    quoteResponse.returnAmountAfterCommissionWithDecimal = "";
  }
};
