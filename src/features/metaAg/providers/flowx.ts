import {
  AggregatorQuoter,
  Commission,
  CommissionType,
  TradeBuilder,
} from "@flowx-finance/sdk";
import { SuiClient } from "@mysten/sui/client";
import { TransactionObjectArgument } from "@mysten/sui/transactions";
import { v4 } from "uuid";
import { _7K_PARTNER_ADDRESS } from "../../../constants/_7k";
import {
  AggregatorProvider,
  EProvider,
  FlowxProviderOptions,
  MetaQuote,
  MetaQuoteOptions,
  MetaSwapOptions,
  QuoteProvider,
} from "../../../types/metaAg";
import { assert } from "../../../utils/condition";

export class FlowxProvider implements QuoteProvider, AggregatorProvider {
  readonly kind = EProvider.FLOWX;
  private quoter: AggregatorQuoter;
  constructor(
    private readonly options: FlowxProviderOptions,
    private readonly client: SuiClient,
  ) {
    this.quoter = new AggregatorQuoter("mainnet", options.apiKey);
  }

  async quote(quoteOptions: MetaQuoteOptions): Promise<MetaQuote> {
    const quote = await this.quoter.getRoutes({
      amountIn: quoteOptions.amountIn,
      tokenIn: quoteOptions.coinTypeIn,
      tokenOut: quoteOptions.coinTypeOut,
      includeSources: this.options.sources,
      excludePools: this.options.excludePools,
      excludeSources: this.options.excludeSources,
      maxHops: this.options.maxHops,
      splitDistributionPercent: this.options.splitDistributionPercent,
    });
    return {
      id: v4(),
      provider: EProvider.FLOWX,
      quote: quote,
      amountIn: quote.amountIn?.toString() ?? "0",
      rawAmountOut: quote.amountOut?.toString() ?? "0",
      amountOut: quote.amountOut?.toString() ?? "0",
      coinTypeIn: quoteOptions.coinTypeIn,
      coinTypeOut: quoteOptions.coinTypeOut,
    };
  }

  async swap(options: MetaSwapOptions): Promise<TransactionObjectArgument> {
    assert(options.quote.provider === EProvider.FLOWX, "Invalid quote");
    const builder = new TradeBuilder("mainnet", options.quote.quote.routes);
    builder.sender(options.signer);
    builder.slippage(10000 * 100);
    builder.commission(
      new Commission(
        _7K_PARTNER_ADDRESS,
        options.quote.quote.coinOut,
        CommissionType.PERCENTAGE,
        0,
        true,
      ),
    );
    const res = await builder.build().swap({
      tx: options.tx as any,
      client: this.client as any,
      coinIn: options.coinIn as any,
    });
    return res!;
  }
}
