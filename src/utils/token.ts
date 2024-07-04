import { EXPLORER } from "../constants/explorer";
import { SUI_FULL_TYPE, SUI_TYPE } from "../constants/tokens";
import { SuiscanToken } from "../types/token";

export function normalizeTokenType(type: string) {
  return type === SUI_TYPE ? SUI_FULL_TYPE : type;
}

export function denormalizeTokenType(type: string) {
  return type === SUI_FULL_TYPE ? SUI_TYPE : type;
}

export function checkIsSui(type: string) {
  return type === SUI_FULL_TYPE || type === SUI_TYPE;
}

export async function getSuiscanTokenMetadata(type: string) {
  const response: any = await fetch(
    `${EXPLORER.ADDRESS}/api/sui-backend/mainnet/api/coins/${denormalizeTokenType(type)}`,
  );
  if (!response.ok) {
    throw new Error("Failed to fetch token metadata");
  }
  const data = await response.json();
  return { ...data, type: normalizeTokenType(data.type || "") } as SuiscanToken;
}
