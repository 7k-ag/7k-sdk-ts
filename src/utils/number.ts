export function formatBalance(balance: bigint, decimals: number) {
  const exp = BigInt(Math.pow(10, decimals));
  const whole = balance / exp;
  const remain = balance % exp;
  return Number(whole) + Number(remain) / Number(exp);
}
