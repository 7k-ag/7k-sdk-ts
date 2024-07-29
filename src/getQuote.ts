import { QuoteResponse, SourceDex } from "./types/aggregator";
import { normalizeTokenType } from "./utils/token";

interface Params {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  sources?: SourceDex[];
}

const DEFAULT_SOURCES: SourceDex[] = [
  "suiswap",
  "turbos",
  "cetus",
  "bluemove",
  "kriya_v3",
  "aftermath",
  "deepbook",
  "flowx",
];

export async function getQuote({
  tokenIn,
  tokenOut,
  amountIn,
  sources = DEFAULT_SOURCES,
}: Params): Promise<QuoteResponse> {
  const response: any = await fetch(
    `https://api.7k.ag/quote?amount=${amountIn}&from=${normalizeTokenType(tokenIn)}&to=${normalizeTokenType(tokenOut)}&sources=${sources.join(",")}`,
  );
  if (!response.ok) {
    throw new Error("Failed to fetch aggregator quote");
  }
  return response.json();
}
