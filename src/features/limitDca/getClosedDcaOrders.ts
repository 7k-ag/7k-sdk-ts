import { fetchClient } from "../../config/fetchClient";
import { formatQueryParams } from "../../libs/url";
import { LO_DCA_API } from "./constants";
import { LoDcaOrderExecution, LoDcaQueryParams } from "./types";

interface Params {
  owner: string;
  offset: number;
  limit: number;
  tokenPair?: string;
}

export async function getClosedDcaOrders({
  owner,
  offset = 0,
  limit = 10,
  tokenPair,
}: Params) {
  const queryParams: LoDcaQueryParams = {
    owner,
    statuses: ["SUCCESS"],
    offset,
    limit,
    orderType: "DCA",
    tokenPair,
  };
  const paramsStr = formatQueryParams(queryParams);

  const response = await fetchClient(
    `${LO_DCA_API}/order-executions?${paramsStr}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch closed dca orders");
  }

  const orders = (await response.json()) as LoDcaOrderExecution[];
  return orders;
}
