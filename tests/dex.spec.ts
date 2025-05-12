import "mocha";

import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { SUI_TYPE } from "../src/constants/tokens";
import { setSuiClient } from "../src/index";
import { testSwap } from "./utils.spec";

const testAccount =
  "0xa851c19ec9a5d661da8d12626b826af105f0bd6654e6dc4213c2a3202be4b413";
const tokenX = SUI_TYPE;
const tokenY =
  "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC";
const tokenYAlt =
  "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN";
const amountX = "1000000000"; // 1 SUI
const amountY = "10000000"; // 10 USDC
const client = new SuiClient({ url: getFullnodeUrl("mainnet") });
setSuiClient(client);
describe("Cetus test", () => {
  it("should routing success for cetus x for y", async () => {
    await testSwap(client, testAccount, {
      amountIn: amountX,
      tokenIn: tokenX,
      tokenOut: tokenY,
      sources: ["cetus"],
    });
  });
  it("should routing success for cetus y for x", async () => {
    await testSwap(client, testAccount, {
      amountIn: amountY,
      tokenIn: tokenY,
      tokenOut: tokenX,
      sources: ["cetus"],
    });
  });
});
describe("Bluefin test", () => {
  it("should routing success for bluefin x for y", async () => {
    await testSwap(client, testAccount, {
      amountIn: amountX,
      tokenIn: tokenX,
      tokenOut: tokenY,
      sources: ["bluefin"],
    });
  });
  it("should routing success for bluefin y for x", async () => {
    await testSwap(client, testAccount, {
      amountIn: amountY,
      tokenIn: tokenY,
      tokenOut: tokenX,
      sources: ["bluefin"],
    });
  });
});
describe("FlowX test", () => {
  it("should routing success for flowx x for y", async () => {
    await testSwap(client, testAccount, {
      amountIn: amountX,
      tokenIn: tokenX,
      tokenOut: tokenY,
      sources: ["flowx"],
    });
  });
  it("should routing success for flowx y for x", async () => {
    await testSwap(client, testAccount, {
      amountIn: amountY,
      tokenIn: tokenY,
      tokenOut: tokenX,
      sources: ["flowx"],
    });
  });
});
describe("FlowX V3 test", () => {
  it("should routing success for flowx v3 x for y", async () => {
    await testSwap(client, testAccount, {
      amountIn: amountX,
      tokenIn: tokenX,
      tokenOut: tokenY,
      sources: ["flowx_v3"],
    });
  });
  it("should routing success for flowx v3 y for x", async () => {
    await testSwap(client, testAccount, {
      amountIn: amountY,
      tokenIn: tokenY,
      tokenOut: tokenX,
      sources: ["flowx_v3"],
    });
  });
});
describe("Deepbook V3 test", () => {
  it("should routing success for deepbook v3 x for y", async () => {
    await testSwap(client, testAccount, {
      amountIn: amountX,
      tokenIn: tokenX,
      tokenOut: tokenY,
      sources: ["deepbook_v3"],
    });
  });
  it("should routing success for deepbook v3 y for x", async () => {
    await testSwap(client, testAccount, {
      amountIn: amountY,
      tokenIn: tokenY,
      tokenOut: tokenX,
      sources: ["deepbook_v3"],
    });
  });
});
describe("Turbos test", () => {
  it("should routing success for turbos x for y", async () => {
    await testSwap(client, testAccount, {
      amountIn: amountX,
      tokenIn: tokenX,
      tokenOut: tokenY,
      sources: ["turbos"],
    });
  });
  it("should routing success for turbos y for x", async () => {
    await testSwap(client, testAccount, {
      amountIn: amountY,
      tokenIn: tokenY,
      tokenOut: tokenX,
      sources: ["turbos"],
    });
  });
});
describe("BlueMove test", () => {
  it("should routing success for bluemove x for y", async () => {
    await testSwap(client, testAccount, {
      amountIn: amountX,
      tokenIn: tokenX,
      tokenOut: tokenYAlt,
      sources: ["bluemove"],
    });
  });
  it("should routing success for bluemove y for x", async () => {
    await testSwap(client, testAccount, {
      amountIn: amountY,
      tokenIn: tokenYAlt,
      tokenOut: tokenX,
      sources: ["bluemove"],
    });
  });
});
describe("Kriya test", () => {
  it("should routing success for kriya x for y", async () => {
    await testSwap(client, testAccount, {
      amountIn: amountX,
      tokenIn: tokenX,
      tokenOut: tokenYAlt,
      sources: ["kriya"],
    });
  });
  it("should routing success for kriya y for x", async () => {
    await testSwap(client, testAccount, {
      amountIn: amountY,
      tokenIn: tokenYAlt,
      tokenOut: tokenX,
      sources: ["kriya"],
    });
  });
});
describe("Kriya V3 test", () => {
  it("should routing success for kriya v3 x for y", async () => {
    await testSwap(client, testAccount, {
      amountIn: amountX,
      tokenIn: tokenX,
      tokenOut: tokenY,
      sources: ["kriya_v3"],
    });
  });
  it("should routing success for kriya v3 y for x", async () => {
    await testSwap(client, testAccount, {
      amountIn: amountY,
      tokenIn: tokenY,
      tokenOut: tokenX,
      sources: ["kriya_v3"],
    });
  });
});
describe("Aftermath test", () => {
  it("should routing success for aftermath x for y", async () => {
    await testSwap(client, testAccount, {
      amountIn: amountX,
      tokenIn: tokenX,
      tokenOut: tokenY,
      sources: ["aftermath"],
    });
  });
  it("should routing success for aftermath y for x", async () => {
    await testSwap(client, testAccount, {
      amountIn: amountY,
      tokenIn: tokenY,
      tokenOut: tokenX,
      sources: ["aftermath"],
    });
  });
});
describe("Steamm test", () => {
  it("should routing success for steamm x for y", async () => {
    await testSwap(client, testAccount, {
      amountIn: amountX,
      tokenIn: tokenX,
      tokenOut: tokenY,
      sources: ["steamm"],
    });
  });
  it("should routing success for steamm y for x", async () => {
    await testSwap(client, testAccount, {
      amountIn: amountY,
      tokenIn: tokenY,
      tokenOut: tokenX,
      sources: ["steamm"],
    });
  });
});
describe("Magma test", () => {
  it("should routing success for magma x for y", async () => {
    await testSwap(client, testAccount, {
      amountIn: amountX,
      tokenIn: tokenX,
      tokenOut: tokenY,
      sources: ["magma"],
    });
  });
  it("should routing success for magma y for x", async () => {
    await testSwap(client, testAccount, {
      amountIn: amountY,
      tokenIn: tokenY,
      tokenOut: tokenX,
      sources: ["magma"],
    });
  });
});
describe("Suiswap test", () => {
  it("should routing success for suiswap x for y", async () => {
    await testSwap(client, testAccount, {
      amountIn: amountX,
      tokenIn: tokenX,
      tokenOut: tokenYAlt,
      sources: ["suiswap"],
    });
  });
  it("should routing success for suiswap y for x", async () => {
    await testSwap(client, testAccount, {
      amountIn: amountY,
      tokenIn: tokenYAlt,
      tokenOut: tokenX,
      sources: ["suiswap"],
    });
  });
});
describe("Obric test", () => {
  it("should routing success for obric x for y", async () => {
    await testSwap(client, testAccount, {
      amountIn: amountX,
      tokenIn: tokenX,
      tokenOut: tokenY,
      sources: ["obric"],
    });
  });
  it("should routing success for obric y for x", async () => {
    await testSwap(client, testAccount, {
      amountIn: amountY,
      tokenIn: tokenY,
      tokenOut: tokenX,
      sources: ["obric"],
    });
  });
});
describe("Haedal PMM test", () => {
  it("should routing success for haedal pmm x for y", async () => {
    await testSwap(client, testAccount, {
      amountIn: amountX,
      tokenIn: tokenX,
      tokenOut: tokenY,
      sources: ["haedal_pmm"],
    });
  });
  it("should routing success for haedal pmm y for x", async () => {
    await testSwap(client, testAccount, {
      amountIn: amountY,
      tokenIn: tokenY,
      tokenOut: tokenX,
      sources: ["haedal_pmm"],
    });
  });
});
describe("Momentum test", () => {
  it("should routing success for momentum x for y", async () => {
    await testSwap(client, testAccount, {
      amountIn: amountX,
      tokenIn: tokenX,
      tokenOut: tokenY,
      sources: ["momentum"],
    });
  });
  it("should routing success for momentum y for x", async () => {
    await testSwap(client, testAccount, {
      amountIn: amountY,
      tokenIn: tokenY,
      tokenOut: tokenX,
      sources: ["momentum"],
    });
  });
});
describe("All sources test", () => {
  it("should routing success for all sources x for y", async () => {
    await testSwap(client, testAccount, {
      amountIn: amountX,
      tokenIn: tokenX,
      tokenOut: tokenY,
    });
  });
  it("should routing success for all sources y for x", async () => {
    await testSwap(client, testAccount, {
      amountIn: amountY,
      tokenIn: tokenY,
      tokenOut: tokenX,
    });
  });
});
