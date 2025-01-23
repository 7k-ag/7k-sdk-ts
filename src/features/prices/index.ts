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

const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

const MAX_TOTAL_IDS = 500;
const MAX_IDS_PER_REQUEST = 100;
export async function getTokenPrices(
  ids: string[],
  vsCoin = NATIVE_USDC_TOKEN_TYPE,
): Promise<Record<string, number>> {
  try {
    const limitedIds = ids.slice(0, MAX_TOTAL_IDS).map(normalizeTokenType);
    const idChunks = chunkArray(limitedIds, MAX_IDS_PER_REQUEST);

    const responses = await Promise.all(
      idChunks.map(async (chunk) => {
        const response = await fetch(`${PRICES_API}/price`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ids: chunk,
            vsCoin,
          }),
        });
        const pricesRes = (await response.json()) as Record<string, TokenPrice>;
        return pricesRes;
      }),
    );

    const combinedPrices = responses.reduce(
      (acc, pricesRes) => {
        Object.keys(pricesRes).forEach((id) => {
          acc[id] = Number(pricesRes[id]?.price || 0);
        });
        return acc;
      },
      {} as Record<string, number>,
    );

    const finalPrices = limitedIds.reduce(
      (acc, id) => {
        acc[id] = combinedPrices[id] || 0;
        return acc;
      },
      {} as Record<string, number>,
    );

    return finalPrices;
  } catch (error) {
    return ids.slice(0, MAX_TOTAL_IDS).reduce(
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
