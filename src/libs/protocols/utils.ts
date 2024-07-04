import BN from "bn.js";
import { MIN_SQRT_PRICE, MAX_SQRT_PRICE } from "./constants";

export function getDefaultSqrtPriceLimit(a2b: boolean): BN {
  return new BN(a2b ? MIN_SQRT_PRICE : MAX_SQRT_PRICE);
}
