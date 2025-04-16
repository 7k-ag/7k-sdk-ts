import { fetchClient } from "../../config/fetchClient";
import { formatQueryParams } from "../../libs/url";
import { LO_DCA_API } from "./constants";
import { LoDcaOrderExecution, LoDcaQueryParams } from "./types";

interface Params {
  owner: string;
  orderId: string;
  offset: number;
  limit: number;
}

export async function getDcaOrderExecutions({
  owner,
  orderId,
  offset = 0,
  limit = 10,
}: Params) {
  const queryParams: LoDcaQueryParams = {
    owner,
    orderId,
    statuses: ["SUCCESS"],
    offset,
    limit,
    orderType: "DCA",
  };
  const paramsStr = formatQueryParams(queryParams);

  const response = await fetchClient(
    `${LO_DCA_API}/order-executions?${paramsStr}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch dca order executions");
  }

  const orders = (await response.json()) as LoDcaOrderExecution[];
  return orders;
}
