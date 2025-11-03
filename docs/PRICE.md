# Prices

## Introduction

The Price Service provides token price data for tokens on the Sui blockchain. It
allows you to fetch current prices for individual tokens or batch requests for
multiple tokens simultaneously, making it ideal for portfolio tracking, price
displays, and financial calculations.

Key features:

- **Single token pricing**: Get the current price for 7k supported token on Sui
- **Batch pricing**: Fetch prices for multiple tokens in a single request (up to
  500 tokens)
- **Efficient batching**: Automatically chunks large requests for optimal
  performance (up to 100 tokens per request)
- **SUI price helper**: Convenience function to quickly get the native SUI token
  price
- **USDC denomination**: Prices are returned in USDC by default, providing a
  stable reference currency
- **Error resilience**: Gracefully handles errors by returning 0 for failed
  requests, ensuring your application continues to function
- **Last updated timestamps**: Access metadata about when prices were last
  updated for freshness tracking

The service uses the 7K Protocol price API to provide accurate, up-to-date token
prices sourced from aggregated DEX liquidity pools and market data.

## Example

```typescript
import { getTokenPrice, getTokenPrices, getSuiPrice } from "@7kprotocol/sdk-ts";

const tokenPrice = await getTokenPrice(
  "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
);

const tokenPrices = await getTokenPrices([
  "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI",
  "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
]);

const suiPrice = await getSuiPrice();
```
