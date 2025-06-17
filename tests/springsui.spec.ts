import "mocha";

import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { SUI_TYPE } from "../src/constants/tokens";
import { setSuiClient } from "../src/index";
import { testSwap } from "./utils.spec";

describe("SpringSui test", () => {
  const testAccount =
    "0x02c1d18325782b70819b0a82b975e235acc4309a80bdbe315ab2c805434a1fdd";
  const tokenX = SUI_TYPE;
  const tokenY =
    "0x83556891f4a0f233ce7b05cfe7f957d4020492a34f5405b2cb9377d060bef4bf::spring_sui::SPRING_SUI";
  const amountX = "100000000"; // 0.1 SUI
  const amountY = "100000000"; // 0.1 sSUI
  const client = new SuiClient({ url: getFullnodeUrl("mainnet") });
  setSuiClient(client);
  it("should routing success for springsui sources x for y", async () => {
    await testSwap(client, testAccount, {
      amountIn: amountX,
      tokenIn: tokenX,
      tokenOut: tokenY,
      sources: ["springsui"],
    });
  });
  it("should routing success for springsui sources y for x", async () => {
    await testSwap(client, testAccount, {
      amountIn: amountY,
      tokenIn: tokenY,
      tokenOut: tokenX,
      sources: ["springsui"],
    });
  });
});
