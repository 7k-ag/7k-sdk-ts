# Legacy 7K Aggregator Removal Plan

## Overview

This document outlines the plan to completely remove the legacy 7K aggregator
from the SDK. The SDK has evolved to use the Meta Aggregator as the primary
interface, and the legacy direct aggregator API is being deprecated.

## ⚠️ Key Decision Point

**Protocol Implementations (`src/libs/protocols/`):** The protocol swap
implementations (Cetus, Bluefin, SuiSwap, etc.) are currently used by the legacy
swap functions via `swapWithRoute`. The new `Bluefin7kProvider` uses
`@bluefin-exchange/bluefin7k-aggregator-sdk` which likely has its own protocol
implementations.

**Decision needed:** Are the local protocol implementations
(`src/libs/protocols/`) used anywhere else, or can they be completely removed?

- **If removed:** Also remove `swapWithRoute`, `groupSwapRoutes`, legacy types,
  legacy constants, and related utilities
- **If kept:** Keep protocol implementations, utilities, and constants (they may
  be useful for other purposes)

**Recommendation:** Check if any external code or future features depend on
these protocol implementations before removal.

## Components to Remove

### 1. Direct Exports from Main Index (`src/index.ts`)

Remove the following exports that expose the legacy aggregator API:

- `getQuote` - Legacy aggregator quote function
- `buildTx` - Legacy aggregator transaction builder
- `buildTxV2` - Legacy aggregator transaction builder v2
- `estimateGasFee` - Uses legacy buildTx
- `executeTx` - Executes legacy aggregator transactions
- `getSwapHistory` - Legacy swap history API
- `multiSwap` - Legacy multi-swap function
- `DEFAULT_SOURCES` - Legacy sources constant

### 2. Legacy Swap Feature Directory (`src/features/swap/`)

**Files to remove:**

- `getQuote.ts` - Legacy quote function
- `buildTx.ts` - Legacy transaction builder (NOTE: `getExpectedReturn` function
  is used by metaAg - needs to be extracted)
- `buildTxV2.ts` - Legacy transaction builder v2
- `estimateGasFee.ts` - Uses buildTx
- `executeTx.ts` - Executes legacy transactions
- `getSwapHistory.ts` - Legacy swap history
- `config.ts` - Legacy config (check if used elsewhere)
- `index.ts` - Exports all the above

**Action Required:**

- Extract `getExpectedReturn` function from `buildTx.ts` to a shared utility
  (e.g., `src/utils/swap.ts` or `src/features/metaAg/common.ts`)
- Update imports in `src/features/metaAg/index.ts` and
  `src/features/metaAg/common.ts`

### 3. Legacy Aggregator Types (`src/types/aggregator.ts`)

**Dependencies:**

- Used by `BluefinLegacyProvider` (to be removed) ✅
- Used by `Bluefin7kProvider` - **NO**, it uses types from
  `@bluefin-exchange/bluefin7k-aggregator-sdk` ✅
- Used by `libs/swapWithRoute.ts` - Only if protocol implementations are kept
- Used by `libs/groupSwapRoutes.ts` - Only if protocol implementations are kept
- Used by `libs/protocols/bluefinx/types.ts` - `BluefinXTx` export (keep the
  type, remove from aggregator.ts)

**Types to remove (if protocol implementations are removed):**

- `QuoteResponse` - Legacy quote response type
- `SourceDex` - Legacy source DEX types
- `SorSwap`, `SorPool`, `SorHop`, `SorRoute` - Legacy routing types
- `BuildTxResult` - Legacy build result type
- `Config` - Legacy config type
- `Commission` - Check if used by metaAg (likely not, metaAg has its own
  commission handling)
- `DexConfig` - Legacy DEX config
- `AggregatorTx` - Only used by legacy `executeTx` (to be removed)
- `isBluefinXRouting` - Only used by legacy functions
- `isSuiTransaction` - Only used with `AggregatorTx`

**Action:**

- Move `BluefinXTx` export to a different location (e.g.,
  `src/types/bluefinx.ts` or keep in `libs/protocols/bluefinx/types.ts`)
- Remove entire `src/types/aggregator.ts` file if protocol implementations are
  removed

### 4. Meta Aggregator Legacy Provider

**Remove:**

- `src/features/metaAg/providers/bluefin7kLegacy.ts` - Entire file
- `EProvider.BLUEFIN7K_LEGACY` enum value from `src/types/metaAg.ts`
- `BluefinLegacyProviderOptions` type from `src/types/metaAg.ts`
- References in `src/features/metaAg/index.ts`:
  - Import statement
  - Case in `_getProvider` switch
  - Default providers (if included)
  - Error mapping in `catchImportError`

### 5. Documentation

**Files to update/remove:**

- `docs/SWAP.md` - **REMOVE ENTIRE FILE** (legacy swap documentation)
- `README.md` - Remove reference to "Swap" section
- `docs/BLUEFINX.md` - Check if it references legacy swap functions, update if
  needed
- Update `docs/META_AG.md` - Remove any references to `BLUEFIN7K_LEGACY`
  provider

### 6. Tests

**Files to update/remove:**

- `tests/dex.spec.ts` - Remove or update tests for legacy swap functions
- `tests/utils.spec.ts` - Remove or update tests for legacy swap functions
- `tests/index.spec.ts` - Remove tests for `getQuote` and `buildTx` exports
- `tests/meta.spec.ts` - Remove `bluefin7k_legacy` from test providers

### 7. Examples

**Files to update/remove:**

- `src/examples/nodejs/index.ts` - **REMOVE ENTIRE FILE** or rewrite to use
  MetaAg

### 8. Supporting Libraries (Review)

**Files to review:**

- `src/libs/swapWithRoute.ts` - **REMOVE** - Only used by legacy swap functions
- `src/libs/groupSwapRoutes.ts` - **REMOVE** - Only used by legacy swap
  functions
- `src/libs/protocols/` - **REVIEW CAREFULLY**:
  - These protocol implementations are used by `swapWithRoute`
  - The new `Bluefin7kProvider` uses
    `@bluefin-exchange/bluefin7k-aggregator-sdk` which likely has its own
    protocol implementations
  - **Decision needed**: Are these protocol implementations used anywhere else,
    or can they be removed?
  - If removed, also remove: `src/libs/protocols/index.ts`, all protocol files
- `src/libs/protocols/bluefinx/types.ts` - **KEEP** - `BluefinXTx` is still
  needed for BluefinX integration
- `src/libs/protocols/bluefinx/client.ts` - **KEEP** - `executeBluefinTx` is
  still needed for BluefinX

### 9. Constants

**Review:**

- `src/constants/_7k.ts` - **DECISION NEEDED**:
  - Legacy constants (`_7K_PACKAGE_ID`, `_7K_CONFIG`, `_7K_VAULT`) are used by:
    - Legacy swap functions (to be removed) ✅
    - `SuiUtils.collectDust()` and `SuiUtils.transferOrDestroyZeroCoin()` in
      `src/utils/sui.ts`
    - These utils are used by protocol implementations in `src/libs/protocols/`
  - **If protocol implementations are removed**: Remove legacy constants
  - **If protocol implementations are kept**: Keep legacy constants (they're
    used by protocol swap implementations)
  - Keep meta aggregator constants (`_7K_META_*`) ✅

### 10. Utilities

**Review:**

- `src/utils/sui.ts` - **DECISION NEEDED**:
  - `collectDust()` and `transferOrDestroyZeroCoin()` use legacy
    `_7K_PACKAGE_ID`
  - These are used by protocol implementations in `src/libs/protocols/`
  - **If protocol implementations are removed**: Remove these functions
  - **If protocol implementations are kept**: Keep these functions (they're
    utility functions for protocol swaps)
  - Other functions in `SuiUtils` (like `getSuiCoin`, `zeroCoin`, etc.) are
    likely still needed

## Migration Path for Users

Users currently using the legacy API should migrate to MetaAg:

**Before (Legacy):**

```typescript
import { getQuote, buildTx } from "@7kprotocol/sdk-ts";

const quote = await getQuote({ ... });
const { tx } = await buildTx({ quoteResponse: quote, ... });
```

**After (MetaAg):**

```typescript
import { MetaAg, EProvider } from "@7kprotocol/sdk-ts";

const metaAg = new MetaAg({
  providers: {
    [EProvider.BLUEFIN7K]: {},
    // other providers
  }
});

const quotes = await metaAg.quote({ ... });
const coinOut = await metaAg.swap({ quote: quotes[0], ... });
```

## Dependencies to Verify

Before removal, verify:

1. `Bluefin7kProvider` (new) uses `@bluefin-exchange/bluefin7k-aggregator-sdk`,
   not local swap functions ✅
2. `getExpectedReturn` is only used by metaAg (extract to utility)
3. `swapWithRoute` and `groupSwapRoutes` are not used by metaAg
4. `BluefinXTx` is still needed for BluefinX integration
5. Legacy constants are not used by meta aggregator

## Breaking Changes

This removal will be a **major breaking change**. Consider:

- Bumping major version number
- Adding deprecation warnings in a minor version first (if not already done)
- Updating CHANGELOG.md with migration guide

## Estimated Impact

- **Files to remove:** ~10-15 files
- **Lines of code to remove:** ~2000-3000 lines
- **Breaking changes:** High - all direct swap API users affected
- **Migration effort for users:** Medium - need to switch to MetaAg API
