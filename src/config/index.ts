import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import {
  SuiPriceServiceConnection,
  SuiPythClient,
} from "@pythnetwork/pyth-sui-js";

const HERMES_API = "https://hermes.pyth.network";
const WORMHOLE_STATE_ID =
  "0xaeab97f96cf9877fee2883315d459552b2b921edc16d7ceac6eab944dd88919c";
const PYTH_STATE_ID =
  "0x1f9310238ee9298fb703c3419030b35b22bb1cc37113e3bb5007c99aec79e5b8";

let apiKey: string = "";
let suiClient: SuiClient = new SuiClient({
  url: getFullnodeUrl("mainnet"),
});
let pythClient: SuiPythClient = new SuiPythClient(
  suiClient as any,
  PYTH_STATE_ID,
  WORMHOLE_STATE_ID,
);
let pythConnection: SuiPriceServiceConnection = new SuiPriceServiceConnection(
  HERMES_API,
);

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

function setPythClient(client: SuiPythClient): void {
  pythClient = client;
}

function getPythClient(): SuiPythClient {
  return pythClient;
}

function setPythConnection(connection: SuiPriceServiceConnection): void {
  pythConnection = connection;
}

function getPythConnection(): SuiPriceServiceConnection {
  return pythConnection;
}

const Config = {
  setApiKey,
  getApiKey,
  setSuiClient,
  getSuiClient,
  setPythClient,
  getPythClient,
  setPythConnection,
  getPythConnection,
};

export { Config };
