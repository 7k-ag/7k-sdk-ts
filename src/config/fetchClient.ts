import { Config } from "./index";

export async function fetchClient(
  input: string,
  init?: RequestInit,
): Promise<Response> {
  const headers = new Headers(init?.headers);
  const apiKey = (Config.getApiKey() || "").trim();
  const bluefinXApiKey = (Config.getBluefinXApiKey() || "").trim();
  if (apiKey) {
    headers.set("apiKey", apiKey);
  }

  if (bluefinXApiKey) {
    headers.set("Bluefin-X-API-Key", bluefinXApiKey);
  }

  const modifiedInit: RequestInit = {
    ...init,
    headers,
  };

  return fetch(input, modifiedInit);
}
