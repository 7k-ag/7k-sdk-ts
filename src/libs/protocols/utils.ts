import BigNumber from "bignumber.js";
import { MIN_SQRT_PRICE, MAX_SQRT_PRICE } from "./constants";

export function getDefaultSqrtPriceLimit(a2b: boolean): BigNumber {
  return new BigNumber(a2b ? MIN_SQRT_PRICE : MAX_SQRT_PRICE);
}
