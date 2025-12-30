# @7kprotocol/sdk-ts

## 4.0.0

### Major Changes

#### Legacy Aggregator Removal

- **BREAKING**: Removed legacy 7K aggregator API completely
  - Removed `getQuote()` - Use `MetaAg.quote()` instead
  - Removed `buildTx()` - Use `MetaAg.swap()` instead
  - Removed `buildTxV2()` - Use `MetaAg.swap()` instead
  - Removed `estimateGasFee()` - Use MetaAg simulation instead
  - Removed `executeTx()` - Use `MetaAg.fastSwap()` instead
  - Removed `getSwapHistory()` - No longer available
  - Removed `multiSwap()` - No longer available
  - Removed `DEFAULT_SOURCES` constant - No longer needed
  - Removed `BluefinLegacyProvider` from MetaAg - Use `Bluefin7kProvider`
    instead

- **BREAKING**: Removed `EProvider.BLUEFIN7K_LEGACY` enum value
  - Use `EProvider.BLUEFIN7K` instead, which uses the new
    `@bluefin-exchange/bluefin7k-aggregator-sdk`

- **BREAKING**: Removed all protocol swap implementations
  - Protocol implementations are now handled by external SDKs (Bluefin7K, Cetus,
    Flowx)
  - Removed `src/libs/protocols/` directory (except BluefinX client/types)

- **BREAKING**: Removed legacy types
  - Removed `QuoteResponse`, `SourceDex`, `SorSwap`, `SorRoute`,
    `BuildTxResult`, `Config`, `Commission`, `AggregatorTx` from
    `src/types/aggregator.ts`
  - Removed `src/types/aggregator.ts` and `src/types/tx.ts` files
  - `BluefinXTx` is now exported directly from
    `src/libs/protocols/bluefinx/types`

- **BREAKING**: Removed legacy swap documentation
  - Removed `docs/SWAP.md` - See `docs/META_AG.md` for Meta Aggregator usage

#### Price API Migration

- **BREAKING**: Migrated price API to new LP pro infrastructure
  - Changed from `/price` endpoint to `/prices/batch` endpoint
  - Updated request format: now requires `timestamp` and `token_ids` array
  - Updated response format: now returns `TokenPriceResponse[]` with `token_id`,
    `timestamp`, and `price` fields
  - Removed `vsCoin` parameter from `getTokenPrice()` and `getTokenPrices()` -
    prices are always returned in base currency (USD)
  - Improved error handling and chunking for large batch requests

#### Config Module Removal

- **BREAKING**: Removed `Config` module and centralized configuration management
  - Removed `Config` export from SDK - no longer available
  - Removed `Config.setApi()` and `Config.getApi()` - API endpoint configuration
    no longer needed
  - Removed `Config.setApiKey()` and `Config.getApiKey()` - API key management
    removed
  - Removed `Config.setSuiClient()` and `Config.getSuiClient()` - SuiClient
    should be passed directly to MetaAg constructor
  - Removed `src/config/index.ts` file completely
  - Updated `getCoinOjectIdsByAmount()` to use `getSuiClient()` from main index
    (now removed, function also removed)

#### Migration Guide

**Before (Legacy Aggregator):**

```typescript
import { getQuote, buildTx, executeTx } from "@7kprotocol/sdk-ts";

const quote = await getQuote({
  tokenIn: "0x2::sui::SUI",
  tokenOut: "0x...::usdc::USDC",
  amountIn: "1000000000",
});

const { tx } = await buildTx({
  quoteResponse: quote,
  accountAddress: "0x...",
  slippage: 0.01,
  commission: { partner: "0x...", commissionBps: 0 },
});

const { signature, bytes } = await signTransaction({ transaction: tx });
const result = await executeTx(tx, signature, bytes);
```

**After (Meta Aggregator):**

```typescript
import { MetaAg, EProvider } from "@7kprotocol/sdk-ts";

const metaAg = new MetaAg({
  providers: {
    [EProvider.BLUEFIN7K]: {},
    [EProvider.CETUS]: {},
    [EProvider.FLOWX]: {},
  },
});

const quotes = await metaAg.quote({
  coinTypeIn: "0x2::sui::SUI",
  coinTypeOut: "0x...::usdc::USDC",
  amountIn: "1000000000",
  signer: "0x...",
});

const bestQuote = quotes.sort(
  (a, b) => Number(b.amountOut) - Number(a.amountOut),
)[0];

// Option 1: Build transaction manually
const tx = new Transaction();
const coinOut = await metaAg.swap({
  quote: bestQuote,
  signer: "0x...",
  tx,
  coinIn: coinWithBalance({
    type: "0x2::sui::SUI",
    balance: BigInt("1000000000"),
  }),
});
tx.transferObjects([coinOut], "0x...");

// Option 2: Fast swap (build, sign, and execute in one call)
const result = await metaAg.fastSwap({
  quote: bestQuote,
  signer: "0x...",
  signTransaction: async (txBytes) => {
    const { signature, bytes } = await signTransaction({
      transaction: txBytes,
    });
    return { signature, bytes };
  },
});
```

**Price API Migration:**

**Before:**

```typescript
import { getTokenPrice, getTokenPrices } from "@7kprotocol/sdk-ts";

const price = await getTokenPrice("0x2::sui::SUI", "0x...::usdc::USDC");
const prices = await getTokenPrices(["0x2::sui::SUI"], "0x...::usdc::USDC");
```

**After:**

```typescript
import { getTokenPrice, getTokenPrices } from "@7kprotocol/sdk-ts";

// vsCoin parameter removed - prices are always in USD
const price = await getTokenPrice("0x2::sui::SUI");
const prices = await getTokenPrices(["0x2::sui::SUI"]);
```

**Config Module Removal:**

**Before:**

```typescript
import { Config, MetaAg } from "@7kprotocol/sdk-ts";

// Set API endpoint and key
Config.setApi("https://api.example.com");
Config.setApiKey("your-api-key");

// Set SuiClient
const client = new SuiClient({ url: getFullnodeUrl("mainnet") });
Config.setSuiClient(client);

const metaAg = new MetaAg({
  /* ... */
});
```

**After:**

```typescript
import { MetaAg } from "@7kprotocol/sdk-ts";

// Config module removed - no global configuration needed
// MetaAg creates its own SuiClient internally
// You can customize the fullnode URL via MetaAg options:
const metaAg = new MetaAg({
  fullnodeUrl: getFullnodeUrl("mainnet"), // Optional, defaults to mainnet
  // ... other options
});
```

### Minor Changes

- Extracted `getExpectedReturn` utility function to `src/utils/swap.ts` for
  reuse
- Updated `SuiUtils.collectDust()` and `SuiUtils.transferOrDestroyZeroCoin()` to
  use Meta Aggregator constants (`_7K_META_*`)
- Removed legacy constants (`_7K_PACKAGE_ID`, `_7K_CONFIG`, `_7K_VAULT`) - now
  using Meta Aggregator constants
- Removed `getCoinOjectIdsByAmount()` utility function - no longer needed

### Internal Changes

- Removed `src/features/swap/` directory entirely
- Removed `src/libs/swapWithRoute.ts` and `src/libs/groupSwapRoutes.ts`
- Removed protocol contract implementations from `src/libs/protocols/`
- Removed `src/config/index.ts` - Config module completely removed
- Removed `src/libs/getCoinOjectIdsByAmount.ts` - utility function removed
- Removed legacy test files (`tests/dex.spec.ts`, `tests/utils.spec.ts`)
- Removed legacy example (`src/examples/nodejs/index.ts`)
- Added comprehensive test suite for new price API (`tests/prices.spec.ts`)

## 3.6.0
