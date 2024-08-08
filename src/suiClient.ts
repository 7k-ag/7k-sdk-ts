import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";

let suiClient = new SuiClient({
  url: getFullnodeUrl("mainnet"),
});

export function getSuiClient() {
  return suiClient;
}

export function setSuiClient(client: SuiClient) {
  suiClient = client;
}
