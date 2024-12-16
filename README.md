# 7K TypeScript SDK

## Installation

```bash
npm i @7kprotocol/sdk-ts
```

## Usage

## Config (Optional)

### Set Sui Client

```typescript
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { setSuiClient } from "@7kprotocol/sdk-ts";

const network = "mainnet";
const suiClient = new SuiClient({ url: getFullnodeUrl(network) });
setSuiClient(suiClient);
```

Note: this package only supports **mainnet** for now.

## Swap

### 1. Get Quote

```typescript
import { getQuote } from "@7kprotocol/sdk-ts";

const quoteResponse = await getQuote({
  tokenIn: "0x2::sui::SUI",
  tokenOut:
    "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",
  amountIn: "1000000000",
});
```

or

```typescript
import { getQuote } from "@7kprotocol/sdk-ts";

const quoteResponse = await getQuote({
  tokenIn: "0x2::sui::SUI",
  tokenOut:
    "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",
  amountIn: "1000000000",
  sources: [
    "suiswap",
    "turbos",
    "cetus",
    "bluemove",
    "kriya",
    "kriya_v3",
    "aftermath",
    "deepbook",
    "flowx",
  ], // Optional: if empty, the latest sources supported by the current SDK version will be used.
});
```

### 2. Build Transaction

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

### Full Example

```typescript
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { setSuiClient, getQuote, buildTx } from "@7kprotocol/sdk-ts";

// optional
const network = "mainnet";
const suiClient = new SuiClient({ url: getFullnodeUrl(network) });
setSuiClient(suiClient);

const quoteResponse = await getQuote({
  tokenIn: "0x2::sui::SUI",
  tokenOut:
    "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",
  amountIn: "1000000000",
});

const result = await buildTx({
  quoteResponse,
  accountAddress: "0xSenderAddress",
  slippage: 0.01, // 1%
  commission: {
    partner: "<address to receive fee>",
    commissionBps: 0, // 0 means no fee, 1bps = 0.01%, for example, 20bps = 0.2%
  },
});

console.log(result);
```

### Estimate Gas Fee

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

## License

7K TypeScript SDK released under the MIT license. See the [LICENSE](./LICENSE)
file for details.
