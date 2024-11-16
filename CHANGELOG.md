# @7kprotocol/sdk-ts

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
// continute to use coinOut or transfer it back to the sender as normal to complete the transaction.
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
