import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";

let apiKey: string = "";
let suiClient: SuiClient = new SuiClient({
  url: getFullnodeUrl("mainnet"),
});

function setApiKey(key: string): void {
  apiKey = key;
}

function getApiKey(): string {
  return apiKey;
}

function getSuiClient(): SuiClient {
  return suiClient;
}

function setSuiClient(client: SuiClient): void {
  suiClient = client;
}

const Config = {
  setApiKey,
  getApiKey,
  setSuiClient,
  getSuiClient,
};

export { Config };
