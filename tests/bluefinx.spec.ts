import "mocha";
import { Config } from "../src";
import { SUI_TYPE } from "../src/constants/tokens";
import { testSwap } from "./utils.spec";

const testAccount =
  "0x935029ca5219502a47ac9b69f556ccf6e2198b5e7815cf50f68846f723739cbd";
const USDC =
  "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC";
const tokenX = SUI_TYPE;
const tokenY = USDC;
const amountX = "10000000000"; // 10 SUI
const amountY = "10000000"; // 10 USDC
const client = Config.getSuiClient();
describe("BluefinX test", () => {
  it("should routing success for bluefin x for y", async () => {
    await testSwap(client, testAccount, {
      amountIn: amountX,
      tokenIn: tokenX,
      tokenOut: tokenY,
      sources: ["bluefinx"],
    });
  });
  it("should routing success for bluefin y for x", async () => {
    await testSwap(client, testAccount, {
      amountIn: amountY,
      tokenIn: tokenY,
      tokenOut: tokenX,
      sources: ["bluefinx"],
    });
  });
});
