import { formatQueryParams } from "../../libs/url";
import { LO_DCA_API } from "./constants";
import { LimitOrder, LoDcaQueryParams } from "./types";

interface Params {
  owner: string;
  offset: number;
  limit: number;
}

export async function getClosedLimitOrders({
  owner,
  offset = 0,
  limit = 10,
}: Params) {
  const queryParams: LoDcaQueryParams = {
    owner,
    statuses: ["CLOSED"],
    offset,
    limit,
  };
  const paramsStr = formatQueryParams(queryParams);

  const response = await fetch(`${LO_DCA_API}/limit-orders?${paramsStr}`);

  if (!response.ok) {
    throw new Error("Failed to fetch closed limit orders");
  }

  const orders = (await response.json()) as LimitOrder[];
  return orders;
}
