import { SUI_FULL_TYPE, SUI_TYPE } from "../constants/tokens";

export function normalizeTokenType(type: string) {
  return type === SUI_TYPE ? SUI_FULL_TYPE : type;
}

export function denormalizeTokenType(type: string) {
  return type === SUI_FULL_TYPE ? SUI_TYPE : type;
}

export function checkIsSui(type: string) {
  return type === SUI_FULL_TYPE || type === SUI_TYPE;
}
