# Limit Orders

Limit orders allow you to exchange one type of coin for another at a specific
rate, with an expiration time and slippage tolerance.  
This section covers the key operations you can perform with limit orders,
including placing, retrieving, canceling, and claiming them.

## Place Limit Order

Place a limit order to exchange one type of coin for another at a specified
rate.

```typescript
import { placeLimitOrder } from "@7kprotocol/sdk-ts";

const tx = await placeLimitOrder({
  accountAddress: "0xSenderAddress",
  payCoinType:
    "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC", // The coin type to pay with (e.g., USDC).
  targetCoinType:
    "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI", // The coin type to receive (e.g., SUI).
  expireTs: BigInt("1734946742563"), // Expiration timestamp in Unix format.
  payCoinAmount: BigInt("100000"), // Amount to pay, scaled by the coin's decimals (e.g., 0.1 USDC = 100000 for 6 decimals).
  rate: BigInt("250000000000000"), // Exchange rate scaled by 10^12. For example: 1 USDC = 0.25 SUI.
  // USDC decimals = 6, SUI decimals = 9, so rate = 0.25 * 10^(9 - 6) * 10^12 = 250000000000000.
  slippage: BigInt("100"), // Slippage tolerance, scaled by 10^4. For example: 1% slippage = 0.01 * 10^4 = 100.
  devInspect: false, // Optional: Set to true for development inspection mode.
});
```

## Get Open Limit Orders

Retrieve a list of all open limit orders for a specific account.

```typescript
import { getOpenLimitOrders } from "@7kprotocol/sdk-ts";

const openLimitOrders = await getOpenLimitOrders({
  owner: "0xSenderAddress",
  offset: 0,
  limit: 10,
  tokenPair:
    "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI-0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC", // Optional: Filter by a specific token pair
});
```

## Cancel Limit Order

Cancel an existing limit order by providing its unique order ID.

```typescript
import { cancelLimitOrder } from "@7kprotocol/sdk-ts";

const tx = await cancelLimitOrder({
  orderId: "orderId", // The unique order ID (retrieved from getOpenLimitOrders).
  payCoinType:
    "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC", // The coin type used for payment (e.g., USDC).
  targetCoinType:
    "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI", // The target coin type (e.g., SUI).
});
```

## Claim Expired Order

Claim assets from an expired limit order.

```typescript
import { claimExpiredLimitOrder } from "@7kprotocol/sdk-ts";

const tx = await claimExpiredLimitOrder({
  orderId: "orderId", // The unique order ID (retrieved from getOpenLimitOrders).
  payCoinType:
    "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC", // The coin type used for payment (e.g., USDC).
  targetCoinType:
    "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI", // The target coin type (e.g., SUI).
});
```

## Get Closed Limit Orders

Retrieve a list of closed or fulfilled limit orders for a specific account.

```typescript
import { getClosedLimitOrders } from "@7kprotocol/sdk-ts";

const closedLimitOrders = await getClosedLimitOrders({
  owner: "0xSenderAddress",
  offset: 0,
  limit: 10,
  tokenPair:
    "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI-0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC", // Optional: Filter by a specific token pair
});
```
