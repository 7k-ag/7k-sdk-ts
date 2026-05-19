# @7kprotocol/sdk-ts

## 5.0.0-beta.0

### Major Changes

- **Sui SDK v2 migration (BREAKING)**:
  - Peer dependency `@mysten/sui` bumped from `^1.44.0` to `^2.17.0`.
  - All Sui client calls now route through the v2 `ClientWithCoreApi` /
    `client.core.*` surface. Legacy `@mysten/sui/client` (JSON-RPC) imports have
    been removed from the SDK.
  - The default client is now `SuiGrpcClient` (mainnet). To select a different
    transport (`SuiGraphQLClient`, `SuiJsonRpcClient`, or a custom one), pass a
    pre-constructed client via the new `MetaAgOptions.client` option.
- **`MetaAgOptions` shape change (BREAKING)**:
  - `fullnodeUrl?: string` — **removed**. Construct your own client and pass it
    via `client?: ClientWithCoreApi` instead.
  - `client?: ClientWithCoreApi` — **new**. Accepts any v2 client. Defaults to
    `new SuiGrpcClient({ baseUrl: <mainnet gRPC>, network: "mainnet" })` when
    omitted.
- **`MetaAg.fastSwap` signature change (BREAKING)**:
  - Second argument renamed from `getTransactionBlockParams` to
    `extraOptions: ExecuteTransactionExtraOptions` exposing only `signal` and a
    transport-agnostic `include` subset (`effects`, `events`, `balanceChanges`,
    `objectTypes`).
  - Return type changed from `SuiTransactionBlockResponse` to
    `MetaTransactionResult` — the v2 transaction envelope. Read the digest via
    `result.Transaction?.digest`; `FailedTransaction` is the reverted-tx arm and
    is never returned as success.
- **`MetaAg.client` field type change (BREAKING)**:
  - The public `MetaAg.client` field is now typed `ClientWithCoreApi` instead of
    the concrete `SuiClient`. Callers that previously called legacy JSON-RPC
    methods directly on this field must migrate to `client.core.*` or supply
    their own typed client.
- **Optional vendor SDKs bumped (BREAKING upstream changes)**:
  - `@cetusprotocol/aggregator-sdk`: `^1.4.1` → `^1.5.4`.
  - `@flowx-finance/sdk`: `^1.13.8` → `^2.0.3` (major).
  - `@bluefin-exchange/bluefin7k-aggregator-sdk`: `^5.1.4` → `^7.2.0` (major).

### Cetus + non-JSON-RPC transport caveat

The bumped Cetus SDK (1.5.4) still types its internal client as
`SuiJsonRpcClient` and calls legacy JSON-RPC methods (`getDynamicFieldObject`,
`getCoins`, `getOwnedObjects`) on Pyth-priced and DeepBookV3-driven routes.
Routes that don't touch those paths work on gRPC / GraphQL (verified live for
SUI→USDC via `DEEPBOOKV3` at 50 SUI and `OBRIC` at 10 SUI). Routes that do touch
them (e.g. `HAEDALPMM`) fail deterministically on non-JSON-RPC transports with
an `INVALID_ARGUMENT BatchGetObjects` server error. **If you rely on full Cetus
coverage, pass a `SuiJsonRpcClient` via `MetaAgOptions.client`.** This is
documented inline on the option's JSDoc.

### Minor Changes

- New: `ExecuteTransactionExtraOptions.include?: MetaExecuteInclude` lets
  callers opt into populating `effects`, `events`, `balanceChanges`, and
  `objectTypes` on the `fastSwap` response. Default returns
  `digest`/`signatures` only.
- New helpers exposed from `MetaAg`: `MetaTransactionResult`,
  `MetaExecuteInclude`, `ExecuteTransactionExtraOptions`.
- `OkxProvider.fastSwap` now throws when the chain returns a `FailedTransaction`
  envelope instead of silently returning the failed transaction's digest.
  Callers can no longer mistake a reverted swap for a success.
- `MetaAg.updateMetaAgOptions` correctly re-initializes the provider cache when
  the transport client is swapped (previously stale providers could keep a
  reference to the prior client).
- `SuiClientUtils.simulateTransaction` (renamed from
  `devInspectTransactionBlock`) attaches its build plugin at most once per
  `Transaction` instance via a `WeakSet`, preventing duplicate cache plugin runs
  across retries.
- Internal: `ObjectCache.resolveObjects` now routes through
  `client.core.getObjects` (transport-agnostic) instead of the concrete
  `SuiGrpcClient` method.

### Migration guide

Before (v4.x):

```typescript
import { getFullnodeUrl } from "@mysten/sui/client";
import { MetaAg } from "@7kprotocol/sdk-ts";

const metaAg = new MetaAg({
  fullnodeUrl: getFullnodeUrl("mainnet"),
  partner: "0x...",
});

const result = await metaAg.fastSwap({ quote, signer, signTransaction });
console.log(result.digest);
```

After (v5.0.0-beta.0):

```typescript
import { MetaAg } from "@7kprotocol/sdk-ts";

// Default: SuiGrpcClient against mainnet. No URL needed.
const metaAg = new MetaAg({ partner: "0x..." });

const result = await metaAg.fastSwap(
  { quote, signer, signTransaction },
  { include: { effects: true, events: true } }, // opt-in
);
// v2 envelope shape: Transaction (success) | FailedTransaction (reverted)
const digest = result.Transaction?.digest;
if (!digest) throw new Error("swap reverted");
```

To select a different transport (e.g. JSON-RPC for full Cetus coverage):

```typescript
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { MetaAg } from "@7kprotocol/sdk-ts";

const metaAg = new MetaAg({
  client: new SuiJsonRpcClient({
    url: "https://fullnode.mainnet.sui.io:443",
    network: "mainnet",
  }),
});
```

### Internal Changes

- Test infra: switched test loader from `ts-node` to `tsx` (under bun); added
  unit tests for the v2 simulation result reader and the `ObjectCache` v2
  effects mapping; added a live-mainnet probe suite for Cetus transport
  compatibility.
- Build: `tsup` DTS resolution moved to `moduleResolution: "bundler"` to pick up
  `@mysten/sui` v2 subpath exports.

## 4.0.0

### Major Changes

- **Legacy Aggregator Removal (BREAKING)**:
  - Removed all legacy aggregator APIs (`getQuote`, `buildTx`, `buildTxV2`,
    `executeTx`, `estimateGasFee`, `multiSwap`).
  - All swap operations now use the `MetaAg` class.
  - Removed `EProvider.BLUEFIN7K_LEGACY`. Use `EProvider.BLUEFIN7K` instead.
- **Price API Migration (BREAKING)**:
  - Migrated to new LP pro infrastructure with batch request support.
  - Prices are now strictly returned in USD; `vsCoin` parameter has been
    removed.
- **Config Module Removal (BREAKING)**:
  - Removed global `Config` module. Configuration and `SuiClient` are now
    handled via the `MetaAg` constructor.
- **Protocol Implementation Refactor (BREAKING)**:
  - Moved protocol-specific logic to external SDKs (Bluefin7K, Cetus, Flowx).
  - Cleaned up legacy types and protocol-specific implementation files.

### Minor Changes

- Extracted `getExpectedReturn` utility function.
- Removed legacy constants and utility functions like `getCoinOjectIdsByAmount`.

### Internal Changes

- Removed deprecated directories: `src/features/swap/`, `src/config/`, and
  protocol implementations.
- Cleaned up legacy tests and examples.
- Added comprehensive tests for the new Price API.

## 3.6.0

### Minor Changes

- Deprecate Bluefin7K legacy api
- Support OKX swap

## 3.5.4

### Patch Changes

- Use 7K quote endpoint

## 3.5.2

### Patch Changes

- Use Bluefin quote endpoint

## 3.5.1

### Patch Changes

- Add 7k's partner address to underlying aggregator.

## 3.5.0

### Minor Changes

- Meta Aggregator
- New Liquidity: Cetus DLMM, Ferra DLMM + CLMM

## 3.4.1

### Patch Changes

- Add an optional `isSponsored` parameter to `getQuote` – automatically excludes
  all liquidity sources that rely on Pyth price feeds for sponsored swaps.

## 3.4.0

### Minor Changes

- New liquidity: Full Sail

## 3.3.1

### Patch Changes

- Add BluefinX API key config

## 3.3.0

### Minor Changes

- Send commission directly to partner address after swap

## 3.2.0

### Minor Changes

- New liquidity: SevenK V1.

## 3.1.0

### Minor Changes

- Upgrade @mysten/sui SDK.
- New liquidity: Steamm oracle quoter v2.

### Patch Changes

- Refactor oracle based DEX command.

## 3.0.2

### Patch Changes

- Fix: Redundant price updates

## 3.0.1

### Patch Changes

- Fix: transfer or destroy zero `coinIn` after being splited instead of
  collecting as dust
- Update DEX package configs

## 3.0.0

### Major Changes

- New version of contract to optimize gas fees.
- Sunsetting Deepbook V2
- Support to quote, build and execute BluefinX transaction
- Remove peer dependecies: `bn.js`, `bignumber.js`
- Require `@pythnetwork/pyth-sui-js` as peer dependency

### Minor Changes

- New dex sources: Haedal PMM, Steamm Oracle Quoter, Momentum
- New quote params: `commissionBps?: number` and return
  `returnAmountAfterCommission`, `returnAmountAfterCommissionWithDecimal` in
  quote response

## 2.4.1

### Patch Changes

- Add optional `isSponsored` param for sponsored transactions

## 2.4.0

### Minor Changes

- Support custom API key

## 2.3.7

### Patch Changes

- Add optional `isSponsored` param for sponsored transactions

## 2.3.6

### Patch Changes

- Add steamm, magma to default sources

## 2.3.5

### Patch Changes

- New Liquidity sources: Steamm, Magma
- Fix: apply remote config for turbos, kriya, kriya_v3, obric, springsui, stsui,
  suiswap

## 2.3.4

### Patch Changes

- Remove Beta tags for Limit Orders and DCA Orders

## 2.3.3

### Patch Changes

- Fix minor issues

## 2.3.2

### Patch Changes

- Update `getTokenPrices` using POST request

## 2.3.1

### Patch Changes

- Support new imports: `@7kprotocol/sdk-ts/esm` (es modules) and
  `@7kprotocol/sdk-ts/cjs` (commonjs)

## 2.3.0

### Minor Changes

- Added package configuration from the aggregator API.
- Supported `targetPools` and `excludedPools` params in `getQuote`
- New Liquidity sources: Flowx V3

## 2.2.2

### Patch Changes

- Update bluefin package

## 2.2.1

### Patch Changes

- Update stsui package

## 2.2.0

### Minor Changes

- Add Limit Orders (Beta)
- Add DCA Orders (Beta)
- Add NodeJS code example
- New Liquidity sources: stSUI

## 2.1.7

### Patch Changes

- New Liquidity sources: SpringSui and Obric

## 2.1.6

### Patch Changes

- Upgrade bluefin package

## 2.1.5

### Patch Changes

- Support Bluefin
- Optimize gas fee
- Destroy `extendTx.coinIn` object if its value is zero after the swap

```typescript
const tx = new Transaction();
const coinIn = tx.splitCoins(tx.gas, [1000]);
const { tx: extendedTx, coinOut } = buildTx({
  extendTx: { tx, coinIn },
  quoteResponse,
  slippage,
  commission,
});
// no need to consume the coinIn after the swap anymore
// extendedTx.transferObjects([coinIn], address);
// continue to use coinOut or transfer it back to the sender as normal to complete the transaction.
```

## 2.1.4

### Patch Changes

- Fix `CommandArgumentError` when swapping on Deepbook V3

## 2.1.3

### Patch Changes

- Support Deepbook V3

## 2.1.2

### Patch Changes

- Upgrade Bluemove package

## 2.1.1

### Patch Changes

- Upgrade 7k package

## 2.1.0

### Minor Changes

- Return `coinOut` in `buildTx`
- Rename `isGasEstimate` to `devInspect`

## 2.0.4

### Patch Changes

- Add `.npmrc`

## 2.0.1

### Patch Changes

- Fix build transaction through Bluemove

## 2.0.0

### Major Changes

- Upgrade package to use `@mysten/sui`

## 1.3.4

### Patch Changes

- Extend transaction with optional `coinIn`

## 1.3.3

### Patch Changes

- Fix `getTokenPrice` because of new api response

## 1.3.2

### Patch Changes

- Improve `getQuote` logic

## 1.3.1

### Patch Changes

- Add `kriya` to default sources

## 1.3.0

### Minor Changes

- Update Kriya contract v3
- Update `getQuote` to support `sources` param

## 1.2.7

### Patch Changes

- Improve `buildTx` params validation

## 1.2.6

### Patch Changes

- Improve gas estimate

## 1.2.5

### Patch Changes

- Remove unused vars

## 1.2.4

### Patch Changes

- Fix tx gas bug

## 1.2.3

### Patch Changes

- Update 7k contract

## 1.2.2

### Patch Changes

- Update commission explanation in `README.md`

## 1.2.1

### Patch Changes

- Update `CHANGELOG.md`

## 1.2.0

### Minor Changes

- Update commission code example

## 1.1.1

### Patch Changes

- Add `CHANGELOG.md`

## 1.1.0

### Minor Changes

- Update `getSuiPrice` to use 7k api instead of Suiscan

## 1.0.0

### Major Changes

- Publish package
