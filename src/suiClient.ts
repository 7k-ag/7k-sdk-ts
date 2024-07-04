import { SuiClient, getFullnodeUrl } from "@mysten/sui.js/client";

let suiClient = new SuiClient({
  url: getFullnodeUrl("mainnet"),
});

export function getSuiClient() {
  return suiClient;
}

export function setSuiClient(client: SuiClient) {
  suiClient = client;
}
