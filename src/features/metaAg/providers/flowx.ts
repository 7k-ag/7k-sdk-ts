import { AggregatorQuoter, TradeBuilder } from "@flowx-finance/sdk";
import { SuiClient } from "@mysten/sui/client";
import { TransactionObjectArgument } from "@mysten/sui/transactions";
import { v4 } from "uuid";
import {
  AgProvider,
  EProvider,
  FlowxProviderOptions,
  MetaQuote,
  MetaQuoteOptions,
  MetaSwapOptions,
} from "../../../types/metaAg";
import { assert } from "../../../utils/condition";

export class FlowxProvider implements AgProvider {
  kind = EProvider.FLOWX;
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
      tokenIn: quoteOptions.coinInType,
      tokenOut: quoteOptions.coinOutType,
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
      coinTypeIn: quoteOptions.coinInType,
      coinTypeOut: quoteOptions.coinOutType,
    };
  }

  async swap(options: MetaSwapOptions): Promise<TransactionObjectArgument> {
    assert(options.quote.provider === EProvider.FLOWX, "Invalid quote");
    const builder = new TradeBuilder("mainnet", options.quote.quote.routes);
    builder.sender(options.signer);
    builder.slippage(10000 * 100);
    const res = await builder.build().swap({
      tx: options.tx as any,
      client: this.client as any,
      coinIn: options.coinIn as any,
    });
    return res! as TransactionObjectArgument;
  }
}
