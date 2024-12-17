import { assert } from "chai";
import "mocha";

import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { SUI_TYPE } from "../src/constants/tokens";
import { buildTx, getQuote, setSuiClient } from "../src/index";

describe("SpringSui test", () => {
  const testAccount =
    "0x287f8f83503410cf474adbf8f69b24a66b081e6f9673e7c61bcdc6f5ace4bb88";
  const tokenX = SUI_TYPE;
  const tokenY =
    "0x83556891f4a0f233ce7b05cfe7f957d4020492a34f5405b2cb9377d060bef4bf::spring_sui::SPRING_SUI";
  const amountX = "100000000"; // 0.1 SUI
  const amountY = "100000000"; // 0.1 sSUI
  const client = new SuiClient({ url: getFullnodeUrl("mainnet") });
  setSuiClient(client);
  it("should routing success for springsui x for y", async () => {
    const springsuiRoute = await getQuote({
      amountIn: amountX,
      tokenIn: tokenX,
      tokenOut: tokenY,
      sources: ["springsui"],
    });
    if (springsuiRoute.swaps.length === 0) {
      console.warn("not found route");
      return;
    }
    const { tx } = await buildTx({
      quoteResponse: springsuiRoute,
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
  it("should routing success for springsui y for x", async () => {
    const springsuiRoute = await getQuote({
      amountIn: amountY,
      tokenIn: tokenY,
      tokenOut: tokenX,
      sources: ["springsui"],
    });
    if (springsuiRoute.swaps.length === 0) {
      console.warn("not found route");
      return;
    }
    const { tx } = await buildTx({
      quoteResponse: springsuiRoute,
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
