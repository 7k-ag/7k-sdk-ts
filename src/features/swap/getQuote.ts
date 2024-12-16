import { QuoteResponse, SourceDex } from "../../types/aggregator";
import { normalizeTokenType } from "../../utils/token";

interface Params {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  sources?: SourceDex[];
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
  "bluefin",
  "springsui",
  "obric",
];

export async function getQuote({
  tokenIn,
  tokenOut,
  amountIn,
  sources = DEFAULT_SOURCES,
}: Params) {
  const response = await fetch(
    `https://api.7k.ag/quote?amount=${amountIn}&from=${normalizeTokenType(
      tokenIn,
    )}&to=${normalizeTokenType(tokenOut)}&sources=${sources}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch aggregator quote");
  }

  const quoteResponse = (await response.json()) as QuoteResponse;
  return quoteResponse;
}
