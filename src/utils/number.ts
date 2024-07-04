import BigNumber from "bignumber.js";

export function formatBalance(balance: BigNumber.Value, decimals: number) {
  return new BigNumber(balance).dividedBy(new BigNumber(10).pow(decimals));
}

export function formatRawBalance(balance: BigNumber.Value, decimals: number) {
  const rawBalance = new BigNumber(balance).multipliedBy(
    new BigNumber(10).pow(decimals),
  );
  return new BigNumber(rawBalance.toFixed(0));
}
