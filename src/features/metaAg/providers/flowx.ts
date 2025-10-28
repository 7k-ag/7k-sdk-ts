import {
  AggregatorQuoter,
  Commission,
  CommissionType,
  TradeBuilder,
} from "@flowx-finance/sdk";
import { SuiClient } from "@mysten/sui/client";
import { TransactionObjectArgument } from "@mysten/sui/transactions";
import { v4 } from "uuid";
import {
  AgProvider,
  EProvider,
  FlowxProviderOptions,
  MetaAgOptions,
  MetaQuote,
  MetaQuoteOptions,
  MetaSwapOptions,
} from "../../../types/metaAg";
import { assert } from "../../../utils/condition";
import { getExpectedReturn } from "../../swap/buildTx";

export class FlowxProvider implements AgProvider {
  kind = EProvider.FLOWX;
  private quoter: AggregatorQuoter;
  constructor(
    private readonly options: FlowxProviderOptions,
    private readonly metaOptions: MetaAgOptions,
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
    const { expectedAmount } = getExpectedReturn(
      quote.amountOut?.toString() ?? "0",
      0,
      this.metaOptions.partnerCommissionBps ?? 0,
      this.metaOptions.tipBps ?? 0,
    );
    return {
      id: v4(),
      provider: EProvider.FLOWX,
      quote: quote,
      amountIn: quote.amountIn?.toString() ?? "0",
      rawAmountOut: quote.amountOut?.toString() ?? "0",
      amountOut: expectedAmount,
      coinTypeIn: quoteOptions.coinInType,
      coinTypeOut: quoteOptions.coinOutType,
    };
  }

  async swap(options: MetaSwapOptions): Promise<TransactionObjectArgument> {
    assert(options.quote.provider === EProvider.FLOWX, "Invalid quote");
    const builder = new TradeBuilder("mainnet", options.quote.quote.routes);
    if (this.metaOptions.partner) {
      builder.commission(
        new Commission(
          this.metaOptions.partner,
          options.quote.quote.coinOut,
          CommissionType.PERCENTAGE,
          (this.metaOptions.partnerCommissionBps ?? 0) * 100,
          true,
        ),
      );
    }
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
