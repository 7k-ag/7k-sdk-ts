import { NATIVE_USDC_TOKEN_TYPE, SUI_FULL_TYPE } from "../../constants/tokens";
import { normalizeTokenType } from "../../utils/token";

export const PRICES_API = "https://prices.7k.ag";

interface TokenPrice {
  price: number;
  lastUpdated: number;
}

export async function getTokenPrice(
  id: string,
  vsCoin = NATIVE_USDC_TOKEN_TYPE,
): Promise<number> {
  try {
    const response = await fetch(
      `${PRICES_API}/price?ids=${normalizeTokenType(id)}&vsCoin=${vsCoin}`,
    );
    const pricesRes = (await response.json()) as Record<string, TokenPrice>;
    return Number(pricesRes?.[id]?.price || 0);
  } catch (error) {
    return 0;
  }
}

export async function getTokenPrices(
  ids: string[],
  vsCoin = NATIVE_USDC_TOKEN_TYPE,
): Promise<Record<string, number>> {
  try {
    const normalizedIdsStr = ids.map(normalizeTokenType).join(",");
    const response = await fetch(
      `${PRICES_API}/price?ids=${normalizedIdsStr}&vsCoin=${vsCoin}`,
    );
    const pricesRes = (await response.json()) as Record<string, TokenPrice>;
    const prices = ids.reduce(
      (acc, id) => {
        acc[id] = Number(pricesRes?.[id]?.price || 0);
        return acc;
      },
      {} as Record<string, number>,
    );
    return prices;
  } catch (error) {
    return ids.reduce(
      (acc, id) => {
        acc[id] = 0;
        return acc;
      },
      {} as Record<string, number>,
    );
  }
}

export async function getSuiPrice(): Promise<number> {
  return await getTokenPrice(SUI_FULL_TYPE);
}
