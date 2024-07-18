import { QuoteResponse } from "./types/aggregator";
import { normalizeTokenType } from "./utils/token";

interface Params {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
}

export async function getQuote({
  tokenIn,
  tokenOut,
  amountIn,
}: Params): Promise<QuoteResponse> {
  const response: any = await fetch(
    `https://api.7k.ag/quote?amount=${amountIn}&from=${normalizeTokenType(tokenIn)}&to=${normalizeTokenType(tokenOut)}`,
  );
  if (!response.ok) {
    throw new Error("Failed to fetch aggregator quote");
  }
  return response.json();
}
