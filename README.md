# 7K TypeScript SDK

## Installation

```bash
npm i @7kprotocol/sdk-ts
```

### Peer Dependencies

This package has peer dependencies that are required for core functionality:

| Package                    | Version   | Purpose                      | Required For       |
| -------------------------- | --------- | ---------------------------- | ------------------ |
| `@mysten/sui`              | `^1.39.0` | Sui blockchain interaction   | Core functionality |
| `@pythnetwork/pyth-sui-js` | `^2.2.0`  | Pyth price feeds integration | Price feeds        |

**Required peer dependencies:**

```bash
npm i @mysten/sui@^1.39.0 @pythnetwork/pyth-sui-js@^2.2.0
```

### Optional Dependencies (for MetaAg providers)

The following dependencies are **optional** and only needed for specific MetaAg
providers:

| Package                         | Version   | Provider              |
| ------------------------------- | --------- | --------------------- |
| `@flowx-finance/sdk`            | `^1.13.8` | Flowx MetaAg provider |
| `@cetusprotocol/aggregator-sdk` | `^1.4.1`  | Cetus MetaAg provider |

**Note**: The Bluefin7K MetaAg provider is built-in and requires no additional
dependencies.

To use Flowx or Cetus providers, install their respective dependencies:

```bash
# For Flowx MetaAg provider
npm i @flowx-finance/sdk@^1.13.8

# For Cetus MetaAg provider
npm i @cetusprotocol/aggregator-sdk@^1.4.1
```

### Graceful Degradation

The SDK is designed to work gracefully even when optional dependencies are
missing:

- **Missing `@flowx-finance/sdk`**: Flowx MetaAg provider will not be available,
  and a helpful warning with installation instructions will be shown
- **Missing `@cetusprotocol/aggregator-sdk`**: Cetus MetaAg provider will not be
  available, and a helpful warning with installation instructions will be shown
- **Missing `@mysten/sui`**: Core functionality will fail (this is required)

The SDK will provide clear error messages and installation instructions when
optional dependencies are missing.

**Note**: The Bluefin7K provider works out-of-the-box with no additional
dependencies.

## Usage

You can import the entire SDK as a module:

```typescript
import SevenK from "@7kprotocol/sdk-ts";
```

or import specific functions as needed:

```typescript
import { getQuote, buildTx } from "@7kprotocol/sdk-ts";
```

## Config

Configuration is optional, but if provided, it must be set before invoking any
SDK functions.

### Set API Key

You can use our SDK with a default rate limit of **5 requests per second**
without needing an API key.

- For **frontend (in-browser) usage**, no API key is required, and the rate
  limit cannot be increased.

- For **backend (server-side) usage**, the API key is **optional** for default
  usage. However, to request a **higher rate limit**, you must provide both an
  **API key** and **partner information**.

To request a rate limit increase, please submit your request at:

🔗 <https://7k.ag/collab> and select **"SDK - increase request rate"**.

| Usage    | API Key Required                      | Default Rate Limit              | Can Request Higher Rate Limit                |
| -------- | ------------------------------------- | ------------------------------- | -------------------------------------------- |
| Frontend | No                                    | 5 requests/second               | No                                           |
| Backend  | Optional (required to increase limit) | 5 requests/second (without key) | Yes (requires API Key & partner information) |

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

Note: this package only supports **mainnet**.

## Swap

See [Swap](docs/SWAP.md).

## BluefinX

See [BluefinX](docs/BLUEFINX.md).

## Limit Orders

See [Limit Orders](docs/LIMIT.md).

## DCA Orders

See [DCA Orders](docs/DCA.md).

## MetaAg (Multi-Provider Aggregation)

The MetaAg feature allows you to aggregate quotes from multiple DEX Aggregator
providers. By default, all available providers are enabled. You can optionally
configure specific providers or install optional dependencies to enable
additional providers.

### Using Default Providers

The Bluefin7K provider is built-in and works without additional dependencies:

```typescript
import { MetaAg, EProvider } from "@7kprotocol/sdk-ts";

const metaAg = new MetaAg();

// Get quotes from all available providers
const quotes = await metaAg.quote({
  amountIn: "1000000000", // 1 SUI (9 decimals)
  coinInType:
    "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI",
  coinOutType:
    "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
});

// Find the best quote
const bestQuote = quotes.reduce((best, current) =>
  Number(current.amountOut) > Number(best.amountOut) ? current : best,
);
```

### Configuring Specific Providers

You can configure specific providers and their options:

```typescript
const metaAg = new MetaAg({
  providers: {
    [EProvider.BLUEFIN7K]: {
      apiKey: "your-bluefin-api-key", // Optional
    },
    [EProvider.FLOWX]: {
      apiKey: "your-flowx-api-key", // Optional
    },
    [EProvider.CETUS]: {
      apiKey: "your-cetus-api-key", // Optional
    },
  },
});
```

**Note**: To use Flowx or Cetus providers, you must install their respective
optional dependencies. See the
[Optional Dependencies](#optional-dependencies-for-metaag-providers) section
above.

### Sponsored Transactions

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

## Prices

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

## Miscellaneous

If you encounter issues when importing functions from this SDK in a Node.js
environment, refer to [src/examples/nodejs/](./src/examples/nodejs/) for
guidance.

## License

7K TypeScript SDK released under the MIT license. See the [LICENSE](./LICENSE)
file for details.
