# DCA Orders

Dollar-Cost Averaging (DCA) allows you to automate trades at regular intervals,
spreading your investments over time to reduce the impact of market volatility.
This section provides APIs for managing DCA orders, including placing, querying,
canceling, and tracking executions.

## Place DCA Order

Use this API to create a new DCA order.

```typescript
import { placeDcaOrder } from "@7kprotocol/sdk-ts";

const tx = await placeDcaOrder({
  payCoinType:
    "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC", // The coin type to pay with (e.g., USDC).
  targetCoinType:
    "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI", // The coin type to receive (e.g., SUI).
  payCoinAmountEach: BigInt("100000"), // Amount to pay in each order, scaled by the coin's decimals (e.g., 0.1 USDC = 100000 for 6 decimals).
  interval: 86400000, // Time interval between orders, in milliseconds (e.g., 86400000 = 1 day).
  minRate: BigInt("1000000000000000"), // Minimum acceptable exchange rate, scaled by 10^12.
  // For example: 1 USDC = 1 SUI. USDC decimals = 6, SUI decimals = 9.
  // Min rate = 1 * 10^(9 - 6) * 10^12 = 1000000000000000.
  maxRate: BigInt("2000000000000000"), // Maximum acceptable exchange rate, scaled by 10^12.
  // For example: 1 USDC = 2 SUI. USDC decimals = 6, SUI decimals = 9.
  // Max rate = 2 * 10^(9 - 6) * 10^12 = 2000000000000000.
  numOrders: 2, // Total number of DCA orders to execute.
  slippage: BigInt("100"), // Slippage tolerance, scaled by 10^4 (e.g., 1% slippage = 0.01 * 10^4 = 100).
});
```

## Get Open DCA Orders

Use this API to retrieve a list of open DCA orders.

```typescript
import { getOpenDcaOrders } from "@7kprotocol/sdk-ts";

const openDcaOrders = await getOpenDcaOrders({
  owner: "0xSenderAddress",
  offset: 0,
  limit: 10,
  tokenPair:
    "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI-0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC", // Optional: Filter by a specific token pair
});
```

## Get DCA Order Executions

Retrieve the execution history of a specific DCA order.

```typescript
import { getDcaOrderExecutions } from "@7kprotocol/sdk-ts";

const orderExecutions = await getDcaOrderExecutions({
  orderId: "orderId", // The unique order ID (retrieved from getOpenDcaOrders).
  owner: "0xSenderAddress",
  offset: 0,
  limit: 10,
});
```

## Cancel DCA Order

Cancel an active DCA order using its unique order ID.

```typescript
import { cancelDcaOrder } from "@7kprotocol/sdk-ts";

const tx = await cancelDcaOrder({
  orderId: "orderId", // The unique order ID (retrieved from getOpenDcaOrders).
  payCoinType:
    "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC", // The coin type used for payment (e.g., USDC).
  targetCoinType:
    "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI", // The target coin type (e.g., SUI).
});
```

## Get Closed DCA Orders

Retrieve a list of closed DCA orders.

```typescript
import { getClosedDcaOrders } from "@7kprotocol/sdk-ts";

const closedDcaOrders = await getClosedDcaOrders({
  owner: "0xSenderAddress",
  offset: 0,
  limit: 10,
  tokenPair:
    "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI-0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC", // Optional: Filter by a specific token pair
});
```
