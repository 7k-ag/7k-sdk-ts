export interface LoDcaQueryParams {
  owner: string;
  tokenPair?: string;
  minFilled?: number;
  maxFilled?: number;
  statuses: string[];
  offset?: number;
  limit?: number;
  orderId?: string;
  orderType?: "DCA" | "LIMIT";
}

export interface LoDcaQueryConfig {
  refetchInterval?: number;
}

export enum LoDcaOrderStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  CANCELED = "CANCELED",
}

export interface LimitOrder {
  id: number;
  createdAt: string;
  updatedAt: string;
  softDeleteAt: string;
  orderId: string;
  owner: string;
  payCoinName: string;
  targetCoinName: string;
  totalPayAmount: string;
  paidAmount: string;
  obtainedAmount: string;
  claimedAmount: string;
  targetBalance: string;
  createdTs: number;
  expireTs: number;
  canceledTs: number;
  lastExecutedTs: number;
  status: LoDcaOrderStatus;
  payBalance: string;
  rate: string;
  slippageBps: string;
  filled: number;
  volume: number;
  digest: string | null;
}

export interface DcaOrder {
  id: number;
  createdAt: string;
  updatedAt: string;
  softDeletedAt: string;
  orderId: string;
  owner: string;
  payCoinName: string;
  targetCoinName: string;
  totalPayAmount: string;
  paidAmount: string;
  obtainedAmount: string;
  claimedAmount: string;
  targetBalance: string;
  createdTs: number;
  expireTs: number;
  canceledTs: number;
  status: LoDcaOrderStatus;
  slippage: number;
  minRate: string;
  maxRate: string;
  amountPerOrder: string;
  interval: number;
  filled: number;
  volume: number;
  digest: string | null;
  numOrders: number; // unfilled orders
}

export enum LoDcaOrderExecutionStatus {
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
}

export interface LoDcaOrderExecution {
  id: number;
  createdAt: string;
  updatedAt: string;
  softDeletedAt: null;
  orderId: string;
  digest: string;
  payCoinName: string;
  targetCoinName: string;
  payAmount: string;
  repayAmount: string;
  obtainedAmount: string;
  executedTs: number;
  slippage: number;
  status: LoDcaOrderExecutionStatus;
  orderType: string;
  volume: number | null;
}
