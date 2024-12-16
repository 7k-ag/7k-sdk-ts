import { formatQueryParams } from "../../libs/url";
import { LO_DCA_API } from "./constants";
import { LoDcaOrderExecution, LoDcaQueryParams } from "./types";

interface Params {
  owner: string;
  offset: number;
  limit: number;
}

export async function getClosedDcaOrders({
  owner,
  offset = 0,
  limit = 10,
}: Params) {
  const queryParams: LoDcaQueryParams = {
    owner,
    statuses: ["SUCCESS"],
    offset,
    limit,
    orderType: "DCA",
  };
  const paramsStr = formatQueryParams(queryParams);

  const response = await fetch(`${LO_DCA_API}/order-executions?${paramsStr}`);

  if (!response.ok) {
    throw new Error("Failed to fetch closed limit orders");
  }

  const orders = (await response.json()) as LoDcaOrderExecution[];
  return orders;
}
