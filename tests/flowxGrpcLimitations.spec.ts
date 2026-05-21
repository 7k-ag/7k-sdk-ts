import { Protocol } from "@flowx-finance/sdk";
import { expect } from "chai";
import "mocha";

import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { SUI_TYPE } from "../src/constants/tokens";
import { MetaAg } from "../src/index";

/**
 * Live-mainnet probe for the FlowX provider through MetaAg with the default
 * gRPC client. The previous detached-method bug
 *
 *   const swap = builder.build().swap;
 *   await swap({ ... });                            // `this` is undefined
 *
 * surfaced as `TypeError: Cannot read properties of undefined (reading
 * 'network')` inside `@flowx-finance/sdk/index.cjs.js:2127`, because
 * `Trade.swap` reads `this.network`. The fix calls `trade.swap(...)` as a
 * method so the binding is preserved.
 *
 * This suite restricts FlowX's routing to Pyth-priced sources (OBRIC and
 * HAEDAL_PMM) so the simulation path actually exercises `Trade.swap` →
 * `PythHelper.updatePythPriceFeedsIfNecessary` → the line that touches
 * `this.network`.
 */

const SENDER =
  "0x935029ca5219502a47ac9b69f556ccf6e2198b5e7815cf50f68846f723739cbd";
const USDC =
  "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC";

const flowxOnly = (sources: Protocol[]) =>
  new MetaAg({
    providers: {
      bluefin7k: { disabled: true },
      cetus: { disabled: true },
      flowx: { disabled: false, sources },
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
      // 15s simulation timeout — Pyth feed updates can be slow.
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

const expectNoNetworkError = (warnings: string[]) => {
  const networkErr = warnings.find(
    (w) => w.includes("'network'") || w.includes("reading 'network"),
  );
  expect(networkErr, "FlowxProvider.swap lost `this` binding").to.equal(
    undefined,
  );
};

describe("FlowX + gRPC client (live mainnet, Pyth-priced routes)", () => {
  it("OBRIC-only route: FlowxProvider.swap preserves `this` binding", async () => {
    const metaAg = flowxOnly([Protocol.OBRIC]);
    const result = await runProbe(metaAg, "10000000000"); // 10 SUI
    console.log("[flowx/OBRIC]", {
      quoteCount: result.quoteCount,
      rawAmountOut: result.rawAmountOut,
      simulatedAmountOut: result.simulatedAmountOut,
      warningCount: result.warnings.length,
      warnings: result.warnings.slice(0, 3),
    });
    expectNoNetworkError(result.warnings);
  });

  it("HAEDAL_PMM-only route: FlowxProvider.swap preserves `this` binding", async () => {
    const metaAg = flowxOnly([Protocol.HAEDAL_PMM]);
    const result = await runProbe(metaAg, "10000000000"); // 10 SUI
    console.log("[flowx/HAEDAL_PMM]", {
      quoteCount: result.quoteCount,
      rawAmountOut: result.rawAmountOut,
      simulatedAmountOut: result.simulatedAmountOut,
      warningCount: result.warnings.length,
      warnings: result.warnings.slice(0, 3),
    });
    expectNoNetworkError(result.warnings);
  });

  it("OBRIC + HAEDAL_PMM combined: no `this`-binding regression", async () => {
    const metaAg = flowxOnly([Protocol.OBRIC, Protocol.HAEDAL_PMM]);
    const result = await runProbe(metaAg, "10000000000"); // 10 SUI
    console.log("[flowx/OBRIC+HAEDAL_PMM]", {
      quoteCount: result.quoteCount,
      rawAmountOut: result.rawAmountOut,
      simulatedAmountOut: result.simulatedAmountOut,
      warningCount: result.warnings.length,
      warnings: result.warnings.slice(0, 3),
    });
    expectNoNetworkError(result.warnings);
  });
});
