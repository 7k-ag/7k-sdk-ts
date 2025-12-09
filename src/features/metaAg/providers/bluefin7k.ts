import {
  buildTx,
  Config,
  getQuote,
} from "@bluefin-exchange/bluefin7k-aggregator-sdk";
import { SuiClient } from "@mysten/sui/client";
import { v4 } from "uuid";
import { _7K_PARTNER_ADDRESS } from "../../../constants/_7k";
import {
  AggregatorProvider,
  Bluefin7kProviderOptions,
  EProvider,
  MetaAgOptions,
  MetaQuote,
  MetaQuoteOptions,
  MetaSwapOptions,
  QuoteProvider,
} from "../../../types/metaAg";
import { MetaAgError, MetaAgErrorCode } from "../error";

export class Bluefin7kProvider implements QuoteProvider, AggregatorProvider {
  readonly kind = EProvider.BLUEFIN7K;
  constructor(
    private readonly options: Bluefin7kProviderOptions,
    private readonly metaOptions: Required<MetaAgOptions>,
    client: SuiClient,
  ) {
    if (options.apiKey) Config.setApiKey(options.apiKey);
    Config.setSuiClient(client);
  }

  async quote(quoteOptions: MetaQuoteOptions): Promise<MetaQuote> {
    const quote = await getQuote({
      tokenIn: quoteOptions.coinTypeIn,
      tokenOut: quoteOptions.coinTypeOut,
      amountIn: quoteOptions.amountIn,
      sources: this.options.sources,
      excludedPools: this.options.excludedPools,
      targetPools: this.options.targetPools,
    });
    MetaAgError.assert(
      !!quote,
      "No quote found",
      MetaAgErrorCode.QUOTE_NOT_FOUND,
      { provider: this.kind },
    );
    return {
      id: v4(),
      provider: EProvider.BLUEFIN7K,
      quote,
      amountIn: quote.swapAmountWithDecimal,
      rawAmountOut: quote.returnAmountWithDecimal,
      amountOut: quote.returnAmountWithDecimal,
      coinTypeIn: quoteOptions.coinTypeIn,
      coinTypeOut: quoteOptions.coinTypeOut,
    };
  }

  async swap({ quote, signer, tx, coinIn }: MetaSwapOptions) {
    MetaAgError.assert(
      quote.provider === EProvider.BLUEFIN7K,
      "Invalid quote",
      MetaAgErrorCode.INVALID_QUOTE,
      { quote, expectedProvider: EProvider.BLUEFIN7K },
    );
    const { coinOut } = await buildTx({
      quoteResponse: quote.quote,
      accountAddress: signer,
      commission: {
        commissionBps: 0,
        partner: _7K_PARTNER_ADDRESS,
      },
      slippage: 1,
      extendTx: {
        tx,
        coinIn,
      },
    });
    return coinOut!;
  }
}
