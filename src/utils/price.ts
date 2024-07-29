import { USDC_TOKEN_TYPE } from "../constants/tokens";

const PRICES_API = "https://prices.7k.ag";

interface TokenPrice {
  price: number | null;
  lastUpdated: number;
}

export async function getTokenPrice(
  id: string,
  vsCoin = USDC_TOKEN_TYPE,
): Promise<number> {
  try {
    const response = await fetch(
      `${PRICES_API}/price?ids=${id}&vsCoin=${vsCoin}`,
    );
    const prices = (await response.json()) as Record<string, TokenPrice>;
    return prices?.[id]?.price || 0;
  } catch (error) {
    return 0;
  }
}
