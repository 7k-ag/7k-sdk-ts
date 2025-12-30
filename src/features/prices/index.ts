import { fetchClient } from "../../config/fetchClient";
import { API_ENDPOINTS } from "../../constants/apiEndpoints";
import { SUI_FULL_TYPE } from "../../constants/tokens";
import { normalizeTokenType } from "../../utils/token";

/**
 * Response structure from the new price service API
 */
interface TokenPriceResponse {
  token_id: string;
  timestamp: number;
  price: number;
}

/**
 * Request structure for the batch price API
 */
interface BatchPriceRequest {
  timestamp: string; // Unix timestamp as string
  token_ids: string[];
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

/**
 * Get the current Unix timestamp as a string
 */
function getCurrentTimestamp(): string {
  return Math.floor(Date.now() / 1000).toString();
}

/**
 * Get price for a single token
 * @param id - Token ID (coin type)
 * @returns Token price, or 0 if not found or on error
 */
export async function getTokenPrice(id: string): Promise<number> {
  try {
    const normalizedId = normalizeTokenType(id);
    const prices = await getTokenPrices([normalizedId]);
    return prices[normalizedId] || 0;
  } catch (_) {
    return 0;
  }
}

/**
 * Get prices for multiple tokens
 * @param ids - Array of token IDs (coin types)
 * @returns Record mapping token IDs to their prices
 */
export async function getTokenPrices(
  ids: string[],
): Promise<Record<string, number>> {
  try {
    if (ids.length === 0) {
      return {};
    }

    const limitedIds = ids.slice(0, MAX_TOTAL_IDS).map(normalizeTokenType);
    const idChunks = chunkArray(limitedIds, MAX_IDS_PER_REQUEST);
    const timestamp = getCurrentTimestamp();

    const responses = await Promise.all(
      idChunks.map(async (chunk) => {
        const requestBody: BatchPriceRequest = {
          timestamp,
          token_ids: chunk,
        };

        const response = await fetchClient(
          `${API_ENDPOINTS.PRICES}/prices/batch`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          },
        );

        if (!response.ok) {
          throw new Error(`Price API returned status ${response.status}`);
        }

        const pricesRes = (await response.json()) as TokenPriceResponse[];
        return pricesRes;
      }),
    );

    // Combine all responses into a single record
    const combinedPrices = responses.reduce(
      (acc, priceResponses) => {
        priceResponses.forEach((priceResponse) => {
          acc[priceResponse.token_id] = priceResponse.price;
        });
        return acc;
      },
      {} as Record<string, number>,
    );

    // Ensure all requested IDs are in the result (set to 0 if not found)
    const finalPrices = limitedIds.reduce(
      (acc, id) => {
        acc[id] = combinedPrices[id] || 0;
        return acc;
      },
      {} as Record<string, number>,
    );

    return finalPrices;
  } catch (_) {
    // On error, return 0 for all requested IDs
    return ids.slice(0, MAX_TOTAL_IDS).reduce(
      (acc, id) => {
        acc[normalizeTokenType(id)] = 0;
        return acc;
      },
      {} as Record<string, number>,
    );
  }
}

/**
 * Get the current SUI token price
 * @returns SUI price, or 0 if not found or on error
 */
export async function getSuiPrice(): Promise<number> {
  return await getTokenPrice(SUI_FULL_TYPE);
}
