import BigNumber from "bignumber.js";
import { getSuiscanTokenMetadata } from "./utils/token";
import { SUI_TYPE } from "./constants/tokens";

export async function getSuiPrice(): Promise<number> {
  try {
    const suiToken = await getSuiscanTokenMetadata(SUI_TYPE);
    const suiPrice = suiToken?.tokenPrice ?? "0";
    return new BigNumber(suiPrice).toNumber();
  } catch (error) {
    return 0;
  }
}
