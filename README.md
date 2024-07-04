# 7K TypeScript SDK

## Installation

```bash
npm i @7kprotocol/sdk-ts
```

## Usage

### 1. Set Sui Client (Optional)

```typescript
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { setSuiClient } from "@7kprotocol/sdk-ts";

const network = "mainnet";
const suiClient = new SuiClient({ url: getFullnodeUrl(network) });

setSuiClient(suiClient);
```

Note: this package only supports mainnet for now.

### 2. Get Quote

```typescript
import { getQuote } from "@7kprotocol/sdk-ts";

const quoteResponse = await getQuote({
  tokenIn: "0x2::sui::SUI",
  tokenOut:
    "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",
  amountIn: "1000000000",
});
```

### 3. Build Transaction

```typescript
import { buildTx } from "@7kprotocol/sdk-ts";

const tx = await buildTx({
  quoteResponse,
  accountAddress: "0xSenderAddress",
  slippage: 0.01, // 1%
});
```

or

```typescript
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { buildTx } from "@7kprotocol/sdk-ts";

const tx = new TransactionBlock();

await buildTx({
  tx,
  quoteResponse,
  accountAddress: "0xSenderAddress",
  slippage: 0.01, // 1%
});
```

### Estimate Gas Fee

```typescript
import { estimateGasFee } from "@7kprotocol/sdk-ts";

const feeInUsd = await estimateGasFee({
  quoteResponse,
  accountAddress: "0xSenderAddress",
  slippage: 0.01, // 1%
});
```

### Full Example

```typescript
import { getQuote, buildTx } from "@7kprotocol/sdk-ts";

const quoteResponse = await getQuote({
  tokenIn: "0x2::sui::SUI",
  tokenOut:
    "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",
  amountIn: "1000000000",
});

const tx = await buildTx({
  quoteResponse,
  accountAddress: "0xSenderAddress",
  slippage: 0.01, // 1%
});

console.log(tx);
```

## License

7K TypeScript SDK released under the MIT license. See the [LICENSE](./LICENSE)
file for details.
