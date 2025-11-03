# Swap

## Introduction

The Swap Service provides access to the Bluefin7K aggregator (formerly known as
the 7K aggregator), which aggregates liquidity from multiple decentralized
exchanges (DEXs) on the Sui blockchain. It intelligently routes swaps across
various protocols to find the best available rates and execution paths for your
token swaps.

Key features:

- **Multi-DEX aggregation**: Automatically routes through multiple Sui DEXs
  including SuiSwap, Turbos, Cetus, Bluemove, Kriya, Aftermath, Flowx, Bluefin,
  and many others
- **Optimized routing**: Finds the best swap paths across different protocols to
  maximize output amounts
- **Quote generation**: Get accurate quotes with expected output amounts before
  executing swaps
- **Transaction building**: Build ready-to-sign transactions with configurable
  slippage protection and commission options
- **Gas estimation**: Estimate transaction costs in USD before execution
- **Swap history**: Track your past swap transactions with detailed filtering
  options
- **Flexible configuration**: Customize sources, slippage tolerance, commission
  rates, and more
- **Source filtering**: Optionally specify which DEX sources to use or exclude
  specific pools for routing optimization
- **Commission system**: Built-in support for partner commissions and fee
  distribution

The aggregator uses advanced routing algorithms to split orders across multiple
paths and protocols, ensuring you get the best possible exchange rates while
minimizing price impact and gas costs.

## Config

Configuration is optional, but if provided, it must be set before invoking any
SDK functions.

### Set API Key

You can use our SDK with a default rate limit without needing an API key.

- For **frontend (in-browser) usage**, no API key is required, and the rate
  limit cannot be increased.

- For **backend (server-side) usage**, the API key is **optional** for default
  usage. However, to request a **higher rate limit**, you must provide both an
  **API key** and **partner information**.

To request a rate limit increase, please submit your request at:

🔗 <https://7k.ag/collab> and select **"SDK - increase request rate"**.

| Usage    | API Key Required                      | Can Request Higher Rate Limit                |
| -------- | ------------------------------------- | -------------------------------------------- |
| Frontend | No                                    | No                                           |
| Backend  | Optional (required to increase limit) | Yes (requires API Key & partner information) |

```typescript
import { Config } from "@7kprotocol/sdk-ts";

Config.setApiKey("YOUR_API_KEY");
console.log("API key", Config.getApiKey());
```

### Set BluefinX API key

Setting a BluefinX API key is optional. However, if you'd like to use one — for
example, to avoid rate limits when routing through BluefinX — you'll need to
request an API key directly from Bluefin.

```typescript
import { Config } from "@7kprotocol/sdk-ts";

Config.setBluefinXApiKey("YOUR_BLUEFINX_API_KEY");
console.log("BluefinX API key", Config.getBluefinXApiKey());
```

### Set Sui Client

```typescript
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Config } from "@7kprotocol/sdk-ts";

const network = "mainnet";
const suiClient = new SuiClient({ url: getFullnodeUrl(network) });
Config.setSuiClient(suiClient);
console.log("Sui client", Config.getSuiClient());
```

## 1. Get Quote

```typescript
import { getQuote } from "@7kprotocol/sdk-ts";

const quoteResponse = await getQuote({
  tokenIn: "0x2::sui::SUI",
  tokenOut:
    "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
  amountIn: "1000000000",
});
```

or

```typescript
import { getQuote } from "@7kprotocol/sdk-ts";

const quoteResponse = await getQuote({
  tokenIn: "0x2::sui::SUI",
  tokenOut:
    "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
  amountIn: "1000000000",
  sources: [
    "suiswap",
    "turbos",
    "cetus",
    "bluemove",
    "kriya",
    "kriya_v3",
    "aftermath",
    "flowx",
  ], // Optional: if empty, the latest sources supported by the current SDK version will be used.
});
```

## 2. Build Transaction

```typescript
import { buildTx } from "@7kprotocol/sdk-ts";

const result = await buildTx({
  quoteResponse,
  accountAddress: "0xSenderAddress",
  slippage: 0.01, // 1%
  commission: {
    partner: "<address to receive fee>",
    commissionBps: 0, // 0 means no fee, 1bps = 0.01%, for example, 20bps = 0.2%
  },
});
const { tx, coinOut } = result || {};
```

or

```typescript
import { Transaction } from "@mysten/sui/transactions";
import { buildTx } from "@7kprotocol/sdk-ts";

const tx = new Transaction();

const result = await buildTx({
  quoteResponse,
  accountAddress: "0xSenderAddress",
  slippage: 0.01, // 1%
  commission: {
    partner: "<address to receive fee>",
    commissionBps: 0, // 0 means no fee, 1bps = 0.01%, for example, 20bps = 0.2%
  },
  extendTx: {
    tx,
    // explicit consume this coin object instead of loading all available coin objects from wallet
    coinIn: tx.object("0xCoinObjectAddress"),
  },
});
const { coinOut } = result || {};
```

Note: Even when commissionBps is set to 0, you must still provide a partner
address. This is required for partner tracking and analytics purposes.

## Full Example

```typescript
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { getQuote, buildTx, executeTx, BluefinXTx } from "@7kprotocol/sdk-ts";
import { useSignTransaction } from "@mysten/wallet-kit";

const { mutateAsync: signTransaction } = useSignTransaction();

const quoteResponse = await getQuote({
  tokenIn: "0x2::sui::SUI",
  tokenOut:
    "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
  amountIn: "1000000000",
  // BluefinX must be explicitly specified if needed
  sources: [...DEFAULT_SOURCES, "bluefinx"],
});

const { tx } = await buildTx({
  quoteResponse,
  accountAddress: "0xSenderAddress",
  slippage: 0.01, // 1%
  commission: {
    partner: "<address to receive fee>",
    commissionBps: 0, // 0 means no fee, 1bps = 0.01%, for example, 20bps = 0.2%
  },
});

const { signature, bytes } = await signTransaction({
  transaction: tx instanceof BluefinXTx ? tx.txBytes : tx,
});

const res = await executeTx(tx, signature, bytes);

console.log(res);
```

For BluefinX transaction See [BluefinX](./BLUEFINX.md).

## Estimate Gas Fee

```typescript
import { estimateGasFee } from "@7kprotocol/sdk-ts";

const feeInUsd = await estimateGasFee({
  quoteResponse,
  accountAddress: "0xSenderAddress",
  slippage: 0.01, // 1%
  commission: {
    partner: "<address to receive fee>",
    commissionBps: 0, // 0 means no fee, 1bps = 0.01%, for example, 20bps = 0.2%
  },
});
```

or

```typescript
import { getSuiPrice, estimateGasFee } from "@7kprotocol/sdk-ts";

// get sui price using sdk or from else where
const suiPrice = await getSuiPrice();

const feeInUsd = await estimateGasFee({
  quoteResponse,
  accountAddress: "0xSenderAddress",
  slippage: 0.01, // 1%
  suiPrice,
  commission: {
    partner: "<address to receive fee>",
    commissionBps: 0, // 0 means no fee, 1bps = 0.01%, for example, 20bps = 0.2%
  },
});
```

## Get Swap History

```typescript
import { getSwapHistory } from "@7kprotocol/sdk-ts";

const swapHistory = await getSwapHistory({
  owner: "0xSenderAddress",
  offset: 0,
  limit: 10,
  tokenPair:
    "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI-0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC", // Optional: Filter by a specific token pair
});
```
