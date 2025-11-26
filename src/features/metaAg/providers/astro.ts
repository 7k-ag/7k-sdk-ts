import {
  buildSwapPTBFromQuote,
  getQuote,
} from "@naviprotocol/astros-aggregator-sdk";
import { v4 } from "uuid";
import { _7K_PARTNER_ADDRESS } from "../../../constants/_7k";
import {
  AggregatorProvider,
  AstroProviderOptions,
  EProvider,
  MetaQuote,
  MetaQuoteOptions,
  MetaSwapOptions,
  QuoteProvider,
} from "../../../types/metaAg";
import { assert } from "../../../utils/condition";

export class AstroProvider implements QuoteProvider, AggregatorProvider {
  readonly kind = EProvider.ASTRO;
  constructor(private readonly options: AstroProviderOptions) {}

  async quote({
    amountIn,
    coinTypeIn,
    coinTypeOut,
  }: MetaQuoteOptions): Promise<MetaQuote | null> {
    const quote = await getQuote(
      coinTypeIn,
      coinTypeOut,
      amountIn,
      this.options.api,
      {
        baseUrl: this.options.api,
        byAmountIn: true,
        depth: this.options.depth,
        dexList: this.options.dexList,
        ifPrint: false,
        serviceFee: {
          fee: 0,
          receiverAddress: _7K_PARTNER_ADDRESS,
        },
      },
    );
    return {
      id: v4(),
      provider: this.kind,
      quote,
      amountIn,
      rawAmountOut: quote.amount_out.toString(),
      amountOut: quote.amount_out.toString(),
      coinTypeIn,
      coinTypeOut,
    };
  }

  async swap({ signer, quote, coinIn, tx }: MetaSwapOptions) {
    assert(quote.provider === EProvider.ASTRO, "Invalid quote");
    const coin = await buildSwapPTBFromQuote(
      signer,
      tx,
      0,
      coinIn as any,
      quote.quote,
    );
    return coin;
  }
}
