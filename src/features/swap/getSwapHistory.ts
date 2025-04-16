import { fetchClient } from "../../config/fetchClient";
import { API_ENDPOINTS } from "../../constants/apiEndpoints";
import { formatQueryParams } from "../../libs/url";

interface Params {
  owner: string;
  offset: number;
  limit: number;
  tokenPair?: string;
}

interface TradingHistoryQueryParams {
  addr: string;
  offset: number;
  limit: number;
  token_pair?: string;
}

interface TradingHistoryItem {
  digest: string;
  timestamp: string;
  coin_in: string;
  coin_out: string;
  amount_in: string;
  amount_out: string;
  volume: string | null;
}

interface TradingHistoryResponse {
  count: number;
  history: TradingHistoryItem[];
}

export async function getSwapHistory({
  owner,
  offset = 0,
  limit = 10,
  tokenPair,
}: Params) {
  const queryParams: TradingHistoryQueryParams = {
    addr: owner,
    offset,
    limit,
    token_pair: tokenPair,
  };
  const paramsStr = formatQueryParams(queryParams);

  const response = await fetchClient(
    `${API_ENDPOINTS.STATISTIC}/trading-history?${paramsStr}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch open limit orders");
  }

  const orders = (await response.json()) as TradingHistoryResponse;
  return orders;
}
