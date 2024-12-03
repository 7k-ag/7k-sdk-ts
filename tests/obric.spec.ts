import { assert } from "chai";
import "mocha";

import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { SUI_TYPE } from "../src/constants/tokens";
import { buildTx, getQuote, setSuiClient } from "../src/index";

describe("Obric test", () => {
  const testAccount =
    "0x71e0d70d697c1c9d8511a62cdf7cd6b091c9caa793ca770b46180dfcaacd6c4e";
  const tokenX = SUI_TYPE;
  const tokenY =
    "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC";
  const amountX = "1000000000"; // 1 SUI
  const amountY = "10000000"; // 10 USDC
  const client = new SuiClient({ url: getFullnodeUrl("mainnet") });
  setSuiClient(client);
  it("should routing success for obric x for y", async () => {
    const obricRoute = await getQuote({
      amountIn: amountX,
      tokenIn: tokenX,
      tokenOut: tokenY,
      sources: ["obric"],
    });
    if (obricRoute.swaps.length === 0) {
      console.warn("not found route");
      return;
    }
    const { tx } = await buildTx({
      quoteResponse: obricRoute,
      accountAddress: testAccount,
      commission: {
        commissionBps: 0,
        partner: testAccount,
      },
      slippage: 0.01,
      devInspect: true,
    });

    const result = await client.devInspectTransactionBlock({
      sender: testAccount,
      transactionBlock: tx,
    });
    assert(result.effects.status.status === "success", "Transaction failed");
  });
  it("should routing success for obric y for x", async () => {
    const obricRoute = await getQuote({
      amountIn: amountY,
      tokenIn: tokenY,
      tokenOut: tokenX,
      sources: ["obric"],
    });
    if (obricRoute.swaps.length === 0) {
      console.warn("not found route");
      return;
    }
    const { tx } = await buildTx({
      quoteResponse: obricRoute,
      accountAddress: testAccount,
      commission: {
        commissionBps: 0,
        partner: testAccount,
      },
      slippage: 0.01,
      devInspect: true,
    });

    const result = await client.devInspectTransactionBlock({
      sender: testAccount,
      transactionBlock: tx,
    });
    assert(result.effects.status.status === "success", "Transaction failed");
  });
});
