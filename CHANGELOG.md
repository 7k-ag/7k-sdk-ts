# @7kprotocol/sdk-ts

## 2.4.2-beta.2

### Major Changes

- New version of contract to optimize gas fees.
- New dex sources: BluefinX, Haedal PMM, Steamm Oracle Quoter, Momentum
- New quote params: `commissionBps?: number` and return
  `returnAmountAfterCommission`, `returnAmountAfterCommissionWithDecimal` in
  quote response
- Sunsetting Deepbook V2

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
