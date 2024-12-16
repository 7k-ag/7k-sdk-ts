import { formatQueryParams } from "../../libs/url";
import { LO_DCA_API } from "./constants";
import { DcaOrder, LoDcaQueryParams } from "./types";

interface Params {
  owner: string;
  offset: number;
  limit: number;
}

export async function getOpenDcaOrders({
  owner,
  offset = 0,
  limit = 10,
}: Params) {
  const queryParams: LoDcaQueryParams = {
    owner,
    statuses: ["ACTIVE", "EXPIRED"],
    offset,
    limit,
  };
  const paramsStr = formatQueryParams(queryParams);

  const response = await fetch(`${LO_DCA_API}/dca-orders?${paramsStr}`);

  if (!response.ok) {
    throw new Error("Failed to fetch open dca orders");
  }

  const orders = (await response.json()) as DcaOrder[];
  return orders;
}
