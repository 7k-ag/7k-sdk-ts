import "mocha";

import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { normalizeSuiAddress } from "@mysten/sui/utils";
import { expect } from "chai";
import { SUI_TYPE } from "../src/constants/tokens";
import { ORACLE_BASED_SOURCES } from "../src/features/swap";
import { buildTx, Config, getQuote } from "../src/index";
import { testBuildTxV2, testMultiSwap, testSwap } from "./utils.spec";

const testAccount =
  "0x935029ca5219502a47ac9b69f556ccf6e2198b5e7815cf50f68846f723739cbd";
const testAccount2 =
  "0xec522ec6182e9e58446a4b870ea21ce3350a033b5923c8657d99b76706cc2601";
const WAL =
  "0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59::wal::WAL";
const USDC =
  "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC";
const tokenX = SUI_TYPE;
const tokenY = USDC;
const tokenYAlt =
  "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN";
const amountX = "1000000000"; // 1 SUI
const amountY = "10000000"; // 10 USDC

const client = new SuiClient({ url: getFullnodeUrl("mainnet") });
Config.setSuiClient(client);
Config.setApiKey(process.env.API_KEY || "");
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
describe("Steamm oracle quoter test", () => {
  it("should routing success for steamm oracle quoter x for y", async () => {
    await testSwap(client, testAccount2, {
      amountIn: amountX,
      tokenIn: tokenX,
      tokenOut: WAL,
      sources: ["steamm_oracle_quoter"],
    });
  });
  it("should routing success for steamm oracle quoter y for x", async () => {
    await testSwap(client, testAccount2, {
      amountIn: amountY,
      tokenIn: WAL,
      tokenOut: tokenX,
      sources: ["steamm_oracle_quoter"],
    });
  });
});
// describe("Steamm oracle quoter v2 test", () => {
//   it("should routing success for steamm oracle quoter v2 x for y", async () => {
//     await testSwap(client, testAccount, {
//       amountIn: amountX,
//       tokenIn: tokenX,
//       tokenOut: tokenY,
//       sources: ["steamm_oracle_quoter_v2"],
//     });
//   });
//   it("should routing success for steamm oracle quoter v2 y for x", async () => {
//     await testSwap(client, testAccount, {
//       amountIn: amountY,
//       tokenIn: tokenY,
//       tokenOut: tokenX,
//       sources: ["steamm_oracle_quoter_v2"],
//     });
//   });
// });
describe("SevenK V1 test", () => {
  it("should routing success for sevenk v1 x for y", async () => {
    await testSwap(client, testAccount, {
      amountIn: amountX,
      tokenIn: tokenX,
      tokenOut: tokenY,
      sources: ["sevenk_v1"],
    });
  });
  it("should routing success for sevenk v1 y for x", async () => {
    await testSwap(client, testAccount, {
      amountIn: amountY,
      tokenIn: tokenY,
      tokenOut: tokenX,
      sources: ["sevenk_v1"],
    });
  });
});
describe("Full Sail test", () => {
  it("should routing success for Full Sail x for y", async () => {
    await testSwap(client, testAccount, {
      amountIn: amountX,
      tokenIn: tokenX,
      tokenOut: tokenY,
      sources: ["fullsail"],
    });
  });
  it("should routing success for Full Sail y for x", async () => {
    await testSwap(client, testAccount, {
      amountIn: amountY,
      tokenIn: tokenY,
      tokenOut: tokenX,
      sources: ["fullsail"],
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
describe("sponsored tx", () => {
  it("should validate sponsored tx", async () => {
    const quote = await getQuote({
      amountIn: amountX,
      tokenIn: tokenX,
      tokenOut: tokenY,
      sources: [...ORACLE_BASED_SOURCES],
    });

    try {
      await buildTx({
        quoteResponse: quote,
        accountAddress: testAccount,
        slippage: 0.01,
        commission: {
          commissionBps: 0,
          partner: normalizeSuiAddress("0x0"),
        },
        isSponsored: true,
      });
      // If we reach here, the function didn't throw an error, so the test should fail
      expect.fail(
        "Expected buildTx to throw an error for sponsored tx with oracle sources",
      );
    } catch (error) {
      expect(error.message).to.equal(
        "Oracle based sources are not supported for sponsored tx",
      );
    }
  });
});

describe("multi swap", () => {
  it("should routing success for multi swap", async () => {
    await testMultiSwap(client, testAccount, [
      { amountIn: amountX, tokenIn: tokenX, tokenOut: tokenY },
      { amountIn: amountY, tokenIn: tokenY, tokenOut: tokenX },
    ]);
  });
});

describe("Compare gas usage between build tx v1 and build tx v2", () => {
  it("should routing success for build tx v2", async () => {
    await testBuildTxV2(
      client,
      "0xc53c8cc31554dcf7e30b0432c998ffab5263bd6fd78907cf31515e6b16e4b6f0",
      {
        amountIn: "10000000000000",
        tokenIn:
          "0x8b4d553839b219c3fd47608a0cc3d5fcc572cb25d41b7df3833208586a8d2470::hawal::HAWAL",
        tokenOut:
          "0xd1b72982e40348d069bb1ff701e634c117bb5f741f44dff91e472d3b01461e55::stsui::STSUI",
      },
      true,
    );
  });
});
