import { API_ENDPOINTS } from "../../constants/apiEndpoints";

export const GLOBAL_CONFIG_ID =
  "0xffc7f420b481ed7a012b42e125fd7e5716b5673759cf4629e5fcfebce970a72d";
export const RATE_SCALE = BigInt("1000000000000");
export const SLIPPAGE_SCALE = BigInt("10000");
export const PACKAGE =
  "0x0ef0f805710cf53c10f29c4f73e1144a662747e1839689a846e2520cae122adc";
export const LIMIT_ORDER_MODULE_ID = `${PACKAGE}::limit_order`;
export const DCA_ORDER_MODULE_ID = `${PACKAGE}::dca_order`;
export const CONFIG_MODULE_ID = `${PACKAGE}::config`;
export const DCA_MAX_RATE = BigInt("18446744073709551615");
export const LO_DCA_API = `${API_ENDPOINTS.LO_DCA}/api`;
