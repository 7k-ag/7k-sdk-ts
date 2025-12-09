# Meta Aggregator

## Introduction

Meta Aggregator is a unified interface that aggregates quotes from multiple DEX
aggregators (Bluefin7K, Flowx, Cetus, OKX) to provide the best swap rates. It
compares quotes across different providers and allows you to choose the most
favorable one based on output amount, gas costs, or other metrics.

Key features:

- **Multi-provider quotes**: Get quotes from multiple providers in parallel
  (Bluefin7K, Flowx, Cetus, OKX)
- **Simulation support**: Simulate transactions to get actual output amounts and
  gas estimates
- **Unified interface**: Single API to interact with multiple aggregators
- **Flexible configuration**: Customize provider options, slippage, commissions,
  etc
- **Deferred simulation**: Optionally return quotes immediately and simulate in
  the background

## Install

```bash
npm install @7kprotocol/sdk-ts
```

### Optional Dependencies

To use specific aggregator providers, you may need to install their respective
SDKs:

```bash
# For Bluefin7K aggregator
npm install @bluefin-exchange/bluefin7k-aggregator-sdk

# For Cetus aggregator
npm install @cetusprotocol/aggregator-sdk

# For Flowx aggregator
npm install @flowx-finance/sdk
```

## Quick Start

Here's a simple example to get started:

```typescript
import { MetaAg } from "@7kprotocol/sdk-ts";

// Create MetaAggregator instance (using all default providers)
const metaAg = new MetaAg();

// Get quotes
const quotes = await metaAg.quote({
  amountIn: "1000000000", // 1 SUI
  coinTypeIn: "0x2::sui::SUI",
  coinTypeOut:
    "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
});

// Find the best quote
const bestQuote = quotes.sort(
  (a, b) =>
    Number(b.simulatedAmountOut || b.amountOut) -
    Number(a.simulatedAmountOut || a.amountOut),
)[0];

console.log(`Best quote: ${bestQuote.amountOut} from ${bestQuote.provider}`);
```

## API Reference

### Constructor

```typescript
new MetaAg(options?: MetaAgOptions)
```

Creates a new MetaAggregator instance.

#### Parameters

| Parameter                      | Type     | Description                                                                                 | Default                                                              |
| ------------------------------ | -------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `options.providers`            | `object` | Configuration for each aggregator provider. See [Provider Options](#provider-options) below | All enabled by default                                               |
| `options.fullnodeUrl`          | `string` | Sui network RPC endpoint                                                                    | Mainnet default URL                                                  |
| `options.hermesApi`            | `string` | Pyth Hermes API URL for price feeds                                                         | `https://hermes.pyth.network`                                        |
| `options.partner`              | `string` | Partner address for analytics and commission                                                | `0x0000000000000000000000000000000000000000000000000000000000000000` |
| `options.partnerCommissionBps` | `number` | Partner commission in basis points (1 bps = 0.01%)                                          | `0`                                                                  |
| `options.slippageBps`          | `number` | Default slippage tolerance in basis points (1 bps = 0.01%)                                  | `100` (1%)                                                           |
| `options.tipBps`               | `number` | Tip to 7K Protocol in basis points (1 bps = 0.01%)                                          | `0`                                                                  |

#### Provider Options

Each provider can be configured with provider-specific options:

**Bluefin7K Provider:**

| Parameter       | Type          | Description                     |
| --------------- | ------------- | ------------------------------- |
| `api`           | `string`      | Bluefin7K API endpoint          |
| `apiKey`        | `string`      | API key for Bluefin7K           |
| `disabled`      | `boolean`     | Disable this provider           |
| `sources`       | `SourceDex[]` | Specific DEX sources to include |
| `excludedPools` | `string[]`    | Pool addresses to exclude       |
| `targetPools`   | `string[]`    | Pool addresses to target        |

**Note:** Requires `@bluefin-exchange/bluefin7k-aggregator-sdk` package.

**Flowx Provider:**

| Parameter                  | Type         | Description                   |
| -------------------------- | ------------ | ----------------------------- |
| `api`                      | `string`     | Flowx API endpoint            |
| `apiKey`                   | `string`     | API key for Flowx             |
| `disabled`                 | `boolean`    | Disable this provider         |
| `sources`                  | `Protocol[]` | Specific protocols to include |
| `excludePools`             | `string[]`   | Pool addresses to exclude     |
| `excludeSources`           | `Protocol[]` | Protocols to exclude          |
| `maxHops`                  | `number`     | Maximum hops in route         |
| `splitDistributionPercent` | `number`     | Split distribution percentage |

**Note:** Requires `@flowx-finance/sdk` package.

**Cetus Provider:**

| Parameter          | Type                      | Description                 |
| ------------------ | ------------------------- | --------------------------- |
| `api`              | `string`                  | Cetus API endpoint          |
| `apiKey`           | `string`                  | API key for Cetus           |
| `disabled`         | `boolean`                 | Disable this provider       |
| `sources`          | `string[]`                | Specific sources to include |
| `splitCount`       | `number`                  | Number of splits            |
| `splitAlgorithm`   | `string`                  | Split algorithm to use      |
| `splitFactor`      | `number`                  | Split factor                |
| `depth`            | `number`                  | Search depth                |
| `liquidityChanges` | `PreSwapLpChangeParams[]` | Liquidity change parameters |

**Note:** Requires `@cetusprotocol/aggregator-sdk` package.

**OKX Provider:**

| Parameter       | Type      | Description                   |
| --------------- | --------- | ----------------------------- |
| `apiKey`        | `string`  | OKX API key (required)        |
| `secretKey`     | `string`  | OKX secret key (required)     |
| `apiPassphrase` | `string`  | OKX API passphrase (required) |
| `projectId`     | `string`  | OKX project ID (required)     |
| `api`           | `string`  | OKX API endpoint (optional)   |
| `disabled`      | `boolean` | Disable this provider         |

**Note:** OKX is a SwapAPI provider that executes swaps via API. No additional
package required.

#### Constructor Example

```typescript
const metaAg = new MetaAg({
  // Configure specific providers
  providers: {
    bluefin7k: {
      apiKey: "your-bluefin-api-key",
      sources: ["suiswap", "turbos", "cetus"],
      disabled: false,
    },
    flowx: {
      apiKey: "your-flowx-api-key",
      // default disabled = false
    },
    // cetus will use default configuration
  },
  // Global settings
  slippageBps: 50, // 0.5% slippage
  tipBps: 10, // 0.1% tip to 7K
  partner: "0xYourPartnerAddress",
  partnerCommissionBps: 25, // 0.25% commission
});
```

### quote

```typescript
await metaAg.quote(
  options: MetaQuoteOptions,
  simulation?: MetaSimulationOptions
): Promise<MetaQuote[]>
```

Get quotes from all enabled providers in parallel.

#### Parameters

**options:**

| Parameter     | Type     | Description                                                                                                         | Required                         |
| ------------- | -------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| `amountIn`    | `string` | Input amount as string (e.g., "1000000000" for 1 SUI)                                                               | Yes                              |
| `coinTypeIn`  | `string` | Coin type for input token (e.g., "0x2::sui::SUI")                                                                   | Yes                              |
| `coinTypeOut` | `string` | Coin type for output token (e.g., "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC") | Yes                              |
| `signer`      | `string` | Signer address (required for SwapAPI providers like OKX)                                                            | No (required for some providers) |
| `timeout`     | `number` | Timeout in milliseconds for each quote request                                                                      | No (default: 2000ms)             |

**simulation (optional):**

| Parameter     | Type       | Description                                                                                                 |
| ------------- | ---------- | ----------------------------------------------------------------------------------------------------------- |
| `sender`      | `string`   | Sender address for transaction simulation                                                                   |
| `timeout`     | `number`   | Simulation timeout in milliseconds                                                                          |
| `onSimulated` | `function` | Callback for deferred simulation. If provided, simulation runs in background and updates quote via callback |

#### Returns

Array of `MetaQuote` objects with the following structure:

| Property             | Type             | Description                                                               |
| -------------------- | ---------------- | ------------------------------------------------------------------------- |
| `id`                 | `string`         | Unique quote ID (UUID)                                                    |
| `provider`           | `EProvider`      | Provider that generated this quote ("bluefin7k", "flowx", "cetus", "okx") |
| `quote`              | `object`         | Raw quote response from the provider                                      |
| `coinTypeIn`         | `string`         | Input coin type                                                           |
| `coinTypeOut`        | `string`         | Output coin type                                                          |
| `amountIn`           | `string`         | Input amount as string                                                    |
| `rawAmountOut`       | `string`         | Raw output amount before commissions                                      |
| `amountOut`          | `string`         | Final output amount after commissions                                     |
| `simulatedAmountOut` | `string`         | Simulated output amount (if simulation was enabled)                       |
| `gasUsed`            | `GasCostSummary` | Gas cost estimate (if simulation was enabled)                             |

#### Quote Example

```typescript
// Simple quote without simulation
const quotes = await metaAg.quote({
  amountIn: "1000000000",
  coinTypeIn: "0x2::sui::SUI",
  coinTypeOut:
    "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
});

// Quote with immediate simulation
const quotesWithSim = await metaAg.quote(
  {
    amountIn: "1000000000",
    coinTypeIn: "0x2::sui::SUI",
    coinTypeOut:
      "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
  },
  {
    sender: "0xYourAddress",
  },
);

// Quote with deferred simulation
const quotesDeferred = await metaAg.quote(
  {
    amountIn: "1000000000",
    coinTypeIn: "0x2::sui::SUI",
    coinTypeOut:
      "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
  },
  {
    sender: "0xYourAddress",
    onSimulated: (payload) => {
      // payload contains: { id, simulatedAmountOut, gasUsed, provider }
      console.log(
        `Quote ${payload.id} simulated: ${payload.simulatedAmountOut}`,
      );
      // Update UI with simulation result
    },
  },
);
```

### swap

```typescript
await metaAg.swap(
  options: MetaSwapOptions,
  slippageBps?: number
): Promise<TransactionObjectArgument>
```

Build a swap transaction from a quote and return the coin out object.

**Note:** This method is for aggregator providers (Bluefin7K, Flowx, Cetus). For
SwapAPI providers like OKX, use `fastSwap` instead.

#### Parameters

**options:**

| Parameter | Type                        | Description                                              | Required |
| --------- | --------------------------- | -------------------------------------------------------- | -------- |
| `quote`   | `MetaQuote`                 | Quote object from the `quote` method                     | Yes      |
| `signer`  | `string`                    | Signer address (owner of input coins)                    | Yes      |
| `tx`      | `Transaction`               | Sui Transaction object                                   | Yes      |
| `coinIn`  | `TransactionObjectArgument` | Input coin object with balance matching `quote.amountIn` | Yes      |

**slippageBps (optional):**

- `number`: Slippage tolerance in basis points. If not provided, uses the global
  `slippageBps` from constructor.

#### Returns

`TransactionObjectArgument`: The output coin object.

**Important:** You must add subsequent commands (like `transferObjects`) to
consume the returned coin object.

#### Swap Example

```typescript
import { Transaction, coinWithBalance } from "@mysten/sui/transactions";

// Get the best quote
const quotes = await metaAg.quote({
  amountIn: "1000000000",
  coinTypeIn: "0x2::sui::SUI",
  coinTypeOut:
    "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
});

const bestQuote = quotes.sort(
  (a, b) =>
    Number(b.simulatedAmountOut || b.amountOut) -
    Number(a.simulatedAmountOut || a.amountOut),
)[0];

// Build swap transaction
const tx = new Transaction();
const coinOut = await metaAg.swap(
  {
    quote: bestQuote,
    signer: "0xYourAddress",
    coinIn: coinWithBalance({
      balance: BigInt("1000000000"),
      type: "0x2::sui::SUI",
    }),
    tx,
  },
  100, // Optional: 1% slippage (overrides global setting)
);

// Transfer coin out to yourself
tx.transferObjects([coinOut], "0xYourAddress");

// Execute the transaction
const result = await client.signAndExecuteTransaction({
  transaction: tx,
  signer: keypair, // your keypair
});
```

### fastSwap

```typescript
await metaAg.fastSwap(
  options: MetaFastSwapOptions,
  getTransactionBlockParams?: Omit<GetTransactionBlockParams, "digest">
): Promise<SuiTransactionBlockResponse>
```

Build, sign, and execute a swap transaction in one step. This method is used for
SwapAPI providers (like OKX) that handle transaction execution via API, as well
as aggregator providers for convenience.

#### Parameters

**options:**

| Parameter         | Type        | Description                                           | Required |
| ----------------- | ----------- | ----------------------------------------------------- | -------- |
| `quote`           | `MetaQuote` | Quote object from the `quote` method                  | Yes      |
| `signer`          | `string`    | Signer address (owner of input coins)                 | Yes      |
| `signTransaction` | `function`  | Function to sign the transaction bytes                | Yes      |
| `useGasCoin`      | `boolean`   | Whether to use the gas coin as input (default: false) | No       |

**getTransactionBlockParams (optional):**

- Options for waiting for the transaction, such as `options` and `signal`

#### Returns

`SuiTransactionBlockResponse`: The transaction response with digest and effects.

#### FastSwap Example

```typescript
// For SwapAPI providers (OKX)
const quotes = await metaAg.quote({
  amountIn: "1000000000",
  coinTypeIn: "0x2::sui::SUI",
  coinTypeOut:
    "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
  signer: "0xYourAddress", // Required for OKX
});

const okxQuote = quotes.find((q) => q.provider === "okx");

if (okxQuote) {
  const result = await metaAg.fastSwap({
    quote: okxQuote,
    signer: "0xYourAddress",
    signTransaction: async (txBytes) => {
      // Sign transaction bytes with your keypair
      const signature = await keypair.signPersonalMessage(
        await keypair.signTransactionBlock(txBytes),
      );
      return { signature, bytes: txBytes };
    },
  });

  console.log(`Transaction executed: ${result.digest}`);
}
```

## Full Example

Here's a complete working example:

```typescript
import "mocha";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { coinWithBalance, Transaction } from "@mysten/sui/transactions";
import { SUI_TYPE } from "../src/constants/tokens";
import { Config, MetaAg } from "../src/index";

const client = new SuiClient({ url: getFullnodeUrl("mainnet") });

const metaAg = new MetaAg({
  partner: "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf",
  partnerCommissionBps: 100, // 1% commission
});

const tokenX = SUI_TYPE;
const tokenY =
  "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC";
const amountX = "1000000000"; // 1 SUI

// Get quotes from all providers
const quotes = await metaAg.quote(
  {
    amountIn: amountX,
    coinTypeIn: tokenX,
    coinTypeOut: tokenY,
  },
  { sender: "0xYourAddress" }, // Enable simulation
);

// Sort by best output
const quote = quotes.sort(
  (a, b) =>
    Number(b.simulatedAmountOut || b.amountOut) -
    Number(a.simulatedAmountOut || a.amountOut),
)[0];

// Build transaction
const tx = new Transaction();
const coinOut = await metaAg.swap(
  {
    quote,
    signer: "0xYourAddress",
    coinIn: coinWithBalance({ balance: BigInt(amountX), type: tokenX }),
    tx,
  },
  100, // 1% slippage
);

tx.transferObjects([coinOut], "0xYourAddress");

// Inspect transaction (optional, for testing)
const res = await client.devInspectTransactionBlock({
  transactionBlock: tx,
  sender: "0xYourAddress",
});

console.log("Transaction ready to execute!");
```

## Additional Methods

### updateMetaAgOptions

Update the aggregator configuration after initialization:

```typescript
metaAg.updateMetaAgOptions({
  slippageBps: 50,
  tipBps: 20,
  // Other options...
});
```

## Error Handling

The `quote` method uses `Promise.allSettled`, so it will return quotes from
successful providers even if some fail. Failed providers are logged to console.
Each provider also has its own timeout mechanism.

## Sponsored Transactions

When building sponsored transactions, `tx.gas` can not be used for swap.

**Important considerations:**

1.  **Gas coin usage**: Set `useGasCoin: false` when creating your coin input
    object to prevent the SDK from trying to use `tx.gas`.

2.  **Pyth oracle dependencies**: Transactions that use the gas coin cannot be
    sponsored because Pyth oracle fees are paid from `tx.gas`. Exclude DEX
    sources that depend on Pyth oracles.

**Example configuration:**

```typescript
import { MetaAg, EProvider } from "@7kprotocol/sdk-ts";
import { coinWithBalance } from "@mysten/sui/transactions";
import { Protocol } from "@flowx-finance/sdk"; // Required for Flowx sources
import { CETUS, BLUEFIN } from "@cetusprotocol/aggregator-sdk

const metaAg = new MetaAg({
  providers: {
    [EProvider.BLUEFIN7K]: {
      sources: ["cetus", "bluefin"], // Excludes Pyth oracle-based DEX
    },
    [EProvider.FLOWX]: {
      sources: [Protocol.BLUEFIN, Protocol.CETUS, Protocol.FLOWX_V3],
    },
    [EProvider.CETUS]: {
      sources: [CETUS, BLUEFIN],
    },
  },
});

// Create coin input WITHOUT using the gas coin
const coinIn = coinWithBalance({
  balance: 1000000000n, // 1 SUI
  type: "0x2::sui::SUI",
  useGasCoin: false, // Important: must be false for sponsored transactions
});
```

## Tips and Best Practices

1. **Always enable simulation** to get accurate output amounts and gas estimates
   before executing
2. **Use deferred simulation** (`onSimulated` callback) if you want to display
   quotes quickly
3. **Sort by `simulatedAmountOut`** for the most accurate best quote comparison
   (also compare gasUsed for even better quote)
4. **Handle errors gracefully** - not all providers may respond successfully
5. **Set appropriate timeouts** based on your UX requirements
