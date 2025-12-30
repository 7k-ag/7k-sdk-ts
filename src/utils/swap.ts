/**
 * Calculate expected return amount after applying slippage, commission, and tip
 * @param returnAmount - The raw return amount (with decimals)
 * @param slippageBps - Slippage in basis points (1 bps = 0.01%)
 * @param commissionBps - Commission in basis points
 * @param tipBps - Tip in basis points (default: 0)
 * @returns Object containing tipAmount, minAmount, commissionAmount, and expectedAmount
 */
export const getExpectedReturn = (
  returnAmount: string,
  slippageBps: number,
  commissionBps: number,
  tipBps: number = 0,
) => {
  if (slippageBps > 10000) {
    throw new Error("Slippage must be less than 100%");
  }
  if (commissionBps > 10000) {
    throw new Error("Commission must be less than 100%");
  }
  if (tipBps > 10000) {
    throw new Error("Tip must be less than 100%");
  }
  const returnAmountWithDecimal = BigInt(returnAmount);
  const tipAmountWithDecimal =
    (returnAmountWithDecimal * BigInt(tipBps || 0)) / 10000n;
  const commissionAmountWithDecimal =
    ((returnAmountWithDecimal - tipAmountWithDecimal) * BigInt(commissionBps)) /
    10000n;
  const expectedReturnWithDecimal =
    returnAmountWithDecimal -
    tipAmountWithDecimal -
    commissionAmountWithDecimal;
  const minAmountWithDecimal =
    (expectedReturnWithDecimal * BigInt(1e4 - slippageBps)) / 10000n;

  return {
    tipAmount: tipAmountWithDecimal,
    minAmount: minAmountWithDecimal,
    commissionAmount: commissionAmountWithDecimal,
    expectedAmount: expectedReturnWithDecimal.toString(10),
  };
};
