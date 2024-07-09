import { USDC_TOKEN_TYPE } from "../constants/tokens";

const PRICES_API = "https://prices.7k.ag";

export async function getTokenPrice(
  id: string,
  vsCoin = USDC_TOKEN_TYPE,
): Promise<number> {
  try {
    const response = await fetch(
      `${PRICES_API}/price?ids=${id}&vsCoin=${vsCoin}`,
    );
    const prices = (await response.json()) as Record<string, number | null>;
    return prices?.[id] || 0;
  } catch (error) {
    return 0;
  }
}
