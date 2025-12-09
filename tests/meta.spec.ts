import "mocha";
import "./setup";

import { SUI_TYPE } from "../src/constants/tokens";
import { MetaAg } from "../src/index";

const testAccount =
  "0x935029ca5219502a47ac9b69f556ccf6e2198b5e7815cf50f68846f723739cbd";
const USDC =
  "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC";
const tokenX = SUI_TYPE;
const tokenY = USDC;
const amountX = "10000000000"; // 10 SUI

const hasOkxCredentials =
  process.env.OKX_API_KEY &&
  process.env.OKX_SECRET_KEY &&
  process.env.OKX_API_PASSPHRASE &&
  process.env.OKX_PROJECT_ID;

const metaAg = new MetaAg({
  tipBps: 100,
  partner: "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf",
  partnerCommissionBps: 100,
  providers: {
    bluefin7k_legacy: { disabled: false },
    bluefin7k: { disabled: false },
    cetus: { disabled: false },
    flowx: { disabled: false },
    ...(hasOkxCredentials
      ? {
          okx: {
            disabled: false,
            apiKey: process.env.OKX_API_KEY!,
            secretKey: process.env.OKX_SECRET_KEY!,
            apiPassphrase: process.env.OKX_API_PASSPHRASE!,
            projectId: process.env.OKX_PROJECT_ID!,
          },
        }
      : {}),
  },
});
describe("Meta aggregator test", () => {
  it("should routing success", async () => {
    const quotes = await metaAg.quote(
      {
        amountIn: amountX,
        coinTypeIn: tokenX,
        coinTypeOut: tokenY,
        signer: testAccount,
      },
      { sender: testAccount },
    );
    const _quote = quotes.sort(
      (a, b) =>
        Number(b.simulatedAmountOut || b.amountOut) -
        Number(a.simulatedAmountOut || a.amountOut),
    )[0];
    console.log(quotes.map((q) => [q.rawAmountOut, q.simulatedAmountOut]));
    // const tx = new Transaction();
    // const coinOut = await metaAg.swap(
    //   {
    //     quote,
    //     signer: testAccount,
    //     coinIn: coinWithBalance({ balance: BigInt(amountX), type: tokenX }),
    //     tx,
    //   },
    //   100
    // );
    // tx.transferObjects([coinOut], testAccount);
    // const res = await client.devInspectTransactionBlock({
    //   transactionBlock: tx,
    //   sender: testAccount,
    // });

    // console.log({
    //   status: res.effects.status.status,
    //   events: res.events
    //     .reverse()
    //     .find((e) => e.type.endsWith("::settle::Swap"))?.parsedJson,
    //   quote,
    // });
  });
});
