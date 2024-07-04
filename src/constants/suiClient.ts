import { SuiClient, getFullnodeUrl } from "@mysten/sui.js/client";

export const suiClient = new SuiClient({
  url: getFullnodeUrl("mainnet"),
});
