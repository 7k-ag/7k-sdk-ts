# Swap

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
