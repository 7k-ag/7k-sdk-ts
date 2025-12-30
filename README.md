# 7K TypeScript SDK

The 7K Protocol TypeScript SDK provides a comprehensive toolkit for interacting
with DeFi services on the Sui blockchain. It offers seamless integration with
token swaps, price feeds, limit orders, dollar-cost averaging (DCA), and
multi-provider aggregation services.

## Introduction

The 7K TypeScript SDK is designed to simplify DeFi development on Sui by
providing a unified, type-safe interface for accessing liquidity and trading
services. Whether you're building a wallet, trading application, or DeFi
protocol, this SDK offers the tools you need to integrate advanced trading
functionality.

Key features:

- **Meta Aggregator (Active Simulation)**: The SDK includes an active simulation
  of the Meta Aggregator, allowing developers to test and compare quotes from
  multiple sources — including Bluefin7K, FlowX, and Cetus. This provides a
  preview of how the unified aggregator will optimize routing and liquidity
  aggregation across providers.

  ➤ Additional aggregators and RFQ-based liquidity sources are planned for
  integration in future releases.

- **Price Service**: Fetch token prices with support for single tokens and batch
  queries
- **Limit Orders**: Place and manage limit orders for token swaps
- **DCA Orders**: Set up dollar-cost averaging strategies for automated
  recurring purchases
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Mainnet Support**: Production-ready SDK for Sui mainnet
- **Flexible Configuration**: Customize API keys, slippage, commissions, and
  more

The SDK is built with developer experience in mind, providing both a default
export for convenience and named exports for tree-shaking and modular
development.

## Installation

```bash
npm i @7kprotocol/sdk-ts
```

### Peer Dependencies

This package has peer dependencies that are required for core functionality:

| Package                    | Version   | Purpose                      | Required For       |
| -------------------------- | --------- | ---------------------------- | ------------------ |
| `@mysten/sui`              | `^1.44.0` | Sui blockchain interaction   | Core functionality |
| `@pythnetwork/pyth-sui-js` | `^2.2.0`  | Pyth price feeds integration | Price feeds        |

**Required peer dependencies:**

```bash
npm i @mysten/sui@^1.39.0 @pythnetwork/pyth-sui-js@^2.2.0
```

### Optional Dependencies (for MetaAg providers)

The following dependencies are **optional** and only needed for specific MetaAg
providers:

| Package                                      | Version   | Provider                  |
| -------------------------------------------- | --------- | ------------------------- |
| Package                                      | Version   | Provider                  |
| -------------------------------------------- | --------- | -----------------------   |
| `@flowx-finance/sdk`                         | `^1.13.8` | Flowx MetaAg provider     |
| `@cetusprotocol/aggregator-sdk`              | `^1.4.1`  | Cetus MetaAg provider     |
| `@bluefin-exchange/bluefin7k-aggregator-sdk` | `^5.1.4`  | Bluefin7k MetaAg provider |

To use Flowx or Cetus providers, install their respective dependencies:

```bash
# For Flowx MetaAg provider
npm i @flowx-finance/sdk@^1.13.8

# For Cetus MetaAg provider
npm i @cetusprotocol/aggregator-sdk@^1.4.1

# For Bluefin7k MetaAg provider
npm i @bluefin-exchange/bluefin7k-aggregator-sdk@^5.1.4
```

### Graceful Degradation

The SDK is designed to work gracefully even when optional dependencies are
missing:

- **Missing `@flowx-finance/sdk`**: Flowx MetaAg provider will not be available,
  and a helpful warning with installation instructions will be shown
- **Missing `@cetusprotocol/aggregator-sdk`**: Cetus MetaAg provider will not be
  available, and a helpful warning with installation instructions will be shown
- **Missing `@bluefin-exchange/bluefin7k-aggregator-sdk`**: Bluefin7k MetaAg
  provider will not be available, and a helpful warning with installation
  instructions will be shown
- **Missing `@mysten/sui`**: Core functionality will fail (this is required)

The SDK will provide clear error messages and installation instructions when
optional dependencies are missing.

## Usage

You can import the entire SDK as a module:

```typescript
import SevenK from "@7kprotocol/sdk-ts";
```

or import specific functions as needed:

```typescript
import { MetaAg, getTokenPrice } from "@7kprotocol/sdk-ts";
```

Note: this package only supports **mainnet**.

## MetaAg (Multi-Provider Aggregation)

See [Meta Aggregator](docs/META_AG.md).

## Limit Orders

See [Limit Orders](docs/LIMIT.md).

## DCA Orders

See [DCA Orders](docs/DCA.md).

## Prices

See [Prices](docs/PRICE.md).

## Miscellaneous

If you encounter issues when importing functions from this SDK in a Node.js
environment, refer to [src/examples/nodejs/](./src/examples/nodejs/) for
guidance.

## License

7K TypeScript SDK released under the MIT license. See the [LICENSE](./LICENSE)
file for details.
