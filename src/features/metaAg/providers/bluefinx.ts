import { coinWithBalance, Transaction } from "@mysten/sui/transactions";
import { isValidSuiAddress } from "@mysten/sui/utils";
import { v4 } from "uuid";
import { Config } from "../../../config";
import { _7K_PARTNER_ADDRESS } from "../../../constants/_7k";
import { executeBluefinTx } from "../../../libs/protocols/bluefinx/client";
import { BluefinXTx } from "../../../types/aggregator";
import {
  BluefinXProviderOptions,
  EProvider,
  MetaFastSwapOptions,
  MetaQuote,
  MetaQuoteOptions,
  QuoteProvider,
  SwapAPIProvider,
} from "../../../types/metaAg";
import { assert } from "../../../utils/condition";
import { buildTxV2Int } from "../../swap/buildTxV2";
import { getQuote } from "../../swap/getQuote";
import { metaSettle } from "../common";

const SUPPORT_COINS = [
  "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI",
  "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
];
export class BluefinXProvider implements QuoteProvider, SwapAPIProvider {
  readonly kind = EProvider.BLUEFINX;
  constructor(private readonly options: BluefinXProviderOptions) {
    if (options.apiKey) Config.setApiKey(options.apiKey);
    if (options.api) Config.setApi(options.api);
  }

  async quote(options: MetaQuoteOptions): Promise<MetaQuote | null> {
    if (!this.canQuote(options)) return null;
    const quote = await getQuote({
      amountIn: options.amountIn,
      tokenIn: options.coinTypeIn,
      tokenOut: options.coinTypeOut,
      sources: ["bluefinx"],
      taker: options.signer,
    });
    return {
      id: v4(),
      provider: this.kind,
      quote,
      amountIn: quote.swapAmountWithDecimal,
      rawAmountOut: quote.returnAmountWithDecimal,
      amountOut: quote.returnAmountWithDecimal,
      coinTypeIn: options.coinTypeIn,
      coinTypeOut: options.coinTypeOut,
    };
  }

  canQuote(options: MetaQuoteOptions): boolean {
    return (
      !!options.signer &&
      isValidSuiAddress(options.signer) &&
      SUPPORT_COINS.includes(options.coinTypeIn) &&
      SUPPORT_COINS.includes(options.coinTypeOut)
    );
  }

  async fastSwap(options: MetaFastSwapOptions): Promise<string> {
    assert(options.quote.provider === this.kind, "Invalid BluefinX quote");
    const quote = options.quote.quote;
    const tx = new Transaction();
    const { tx: bluefinTx } = await buildTxV2Int(
      {
        quoteResponse: quote,
        accountAddress: options.signer,
        commission: { commissionBps: 0, partner: _7K_PARTNER_ADDRESS },
        slippage: 0,
        extendTx: {
          tx,
          coinIn: coinWithBalance({
            type: options.quote.coinTypeIn,
            balance: BigInt(options.quote.amountIn),
            useGasCoin: false,
          }),
        },
      },
      (tx, coinOut) => {
        if (coinOut) {
          tx.add(metaSettle(options.quote, coinOut, 0, 0));
          tx.transferObjects([coinOut], options.signer);
        }
      },
    );
    assert(bluefinTx instanceof BluefinXTx, "BluefinX transaction not found");
    const { signature } = await options.signTransaction(bluefinTx.txBytes);
    const res = await executeBluefinTx(bluefinTx, signature);
    assert(res.approved, "BluefinX transaction not approved");
    assert(res.txDigest, "BluefinX transaction digest not found");
    return res.txDigest;
  }
}
