import { Config } from "./index";

export async function fetchClient(
  input: string,
  init?: RequestInit,
): Promise<Response> {
  const headers = new Headers(init?.headers);
  const apiKey = (Config.getApiKey() || "").trim();
  if (apiKey) {
    headers.set("apiKey", apiKey);
  }

  const modifiedInit: RequestInit = {
    ...init,
    headers,
  };

  return fetch(input, modifiedInit);
}
