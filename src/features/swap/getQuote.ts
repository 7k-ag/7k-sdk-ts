import { normalizeStructTag, normalizeSuiObjectId } from "@mysten/sui/utils";
import { QuoteResponse, SourceDex } from "../../types/aggregator";

interface Params {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  sources?: SourceDex[];
  /** Limit the route to a specific set of pools */
  targetPools?: string[];
  /** Exclude a specific set of pools from the route */
  excludedPools?: string[];
}

export const DEFAULT_SOURCES: SourceDex[] = [
  "suiswap",
  "turbos",
  "cetus",
  "bluemove",
  "kriya",
  "kriya_v3",
  "aftermath",
  "deepbook",
  "deepbook_v3",
  "flowx",
  "flowx_v3",
  "bluefin",
  "springsui",
  "obric",
  "stsui",
];

export async function getQuote({
  tokenIn,
  tokenOut,
  amountIn,
  sources = DEFAULT_SOURCES,
  targetPools,
  excludedPools,
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
  const response = await fetch(`https://api.7k.ag/quote?${params}`);

  if (!response.ok) {
    throw new Error("Failed to fetch aggregator quote");
  }

  const quoteResponse = (await response.json()) as QuoteResponse;
  return quoteResponse;
}
