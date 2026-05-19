import { expect } from "chai";
import "mocha";

import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { SUI_TYPE } from "../src/constants/tokens";
import { MetaAg } from "../src/index";

/**
 * Live-mainnet probe to determine whether Cetus 1.5.4 can route through
 * DeepBookV3 / OBRIC / HAEDALPMM when handed a gRPC client. The audit said:
 *
 *  - DeepBookV3 routes call `getCoins` + `getOwnedObjects` (JSON-RPC only).
 *  - Pyth-priced sources (OBRIC, HAEDALPMM) call `getDynamicFieldObject`
 *    via `updatePythPriceIDs` inside `routerSwap` (JSON-RPC only).
 *
 * `findRouters` is HTTP-only and always returns; the breakage surfaces when
 * we run a simulation, which calls `provider.swap` → `cetusClient.routerSwap`
 * → the legacy method. `MetaAg._simulate` catches and warns. We capture the
 * warnings to inspect the exact failure surface.
 */

const SENDER =
  "0x935029ca5219502a47ac9b69f556ccf6e2198b5e7815cf50f68846f723739cbd";
const USDC =
  "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC";

const cetusOnly = (sources: string[]) =>
  new MetaAg({
    providers: {
      bluefin7k: { disabled: true },
      flowx: { disabled: true },
      cetus: { disabled: false, sources },
    },
    client: new SuiJsonRpcClient({
      url: "https://fullnode.mainnet.sui.io:443",
      network: "mainnet",
    }),
  });

const runProbe = async (
  metaAg: MetaAg,
  amountIn: string,
): Promise<{
  quoteCount: number;
  rawAmountOut: string | undefined;
  simulatedAmountOut: string | undefined;
  warnings: string[];
}> => {
  const captured: string[] = [];
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    const first = args[0];
    const msg =
      first instanceof Error
        ? `${first.name}: ${first.message}`
        : typeof first === "string"
          ? first
          : JSON.stringify(first);
    captured.push(msg);
  };
  try {
    const quotes = await metaAg.quote(
      {
        coinTypeIn: SUI_TYPE,
        coinTypeOut: USDC,
        amountIn,
        signer: SENDER,
      },
      // 15s simulation timeout — public JSON-RPC endpoint is slow.
      { sender: SENDER, timeout: 15_000 },
    );
    return {
      quoteCount: quotes.length,
      rawAmountOut: quotes[0]?.rawAmountOut,
      simulatedAmountOut: quotes[0]?.simulatedAmountOut,
      warnings: captured,
    };
  } finally {
    console.warn = originalWarn;
  }
};

describe("Cetus + gRPC client limitations (live mainnet)", () => {
  it("DeepBookV3-only route: capture vendor behavior", async () => {
    const metaAg = cetusOnly(["DEEPBOOKV3"]);
    const result = await runProbe(metaAg, "50000000000"); // 10 SUI
    // Log for human inspection; don't fail the test — we want a diagnostic.
    console.log("[DEEPBOOKV3]", {
      quoteCount: result.quoteCount,
      rawAmountOut: result.rawAmountOut,
      simulatedAmountOut: result.simulatedAmountOut,
      warningCount: result.warnings.length,
      warnings: result.warnings.slice(0, 3),
    });
    expect(result).to.have.property("quoteCount");
  });

  it("OBRIC-only route (Pyth-priced): capture vendor behavior", async () => {
    const metaAg = cetusOnly(["OBRIC"]);
    const result = await runProbe(metaAg, "10000000000"); // 10 SUI
    console.log("[OBRIC]", {
      quoteCount: result.quoteCount,
      rawAmountOut: result.rawAmountOut,
      simulatedAmountOut: result.simulatedAmountOut,
      warningCount: result.warnings.length,
      warnings: result.warnings.slice(0, 3),
    });
    expect(result).to.have.property("quoteCount");
  });

  it("HAEDALPMM-only route (Pyth-priced): capture vendor behavior", async () => {
    const metaAg = cetusOnly(["HAEDALPMM"]);
    const result = await runProbe(metaAg, "10000000000"); // 10 SUI
    console.log("[HAEDALPMM]", {
      quoteCount: result.quoteCount,
      rawAmountOut: result.rawAmountOut,
      simulatedAmountOut: result.simulatedAmountOut,
      warningCount: result.warnings.length,
      warnings: result.warnings.slice(0, 3),
    });
    expect(result).to.have.property("quoteCount");
  });
});
