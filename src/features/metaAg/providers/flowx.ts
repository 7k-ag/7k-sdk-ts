import {
  AggregatorQuoter,
  Commission,
  CommissionType,
  TradeBuilder,
} from "@flowx-finance/sdk";
import { ClientWithCoreApi } from "@mysten/sui/client";
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
import { assertQuoteProvider } from "../common";
import { MetaAgError, MetaAgErrorCode } from "../error";

export class FlowxProvider implements QuoteProvider, AggregatorProvider {
  readonly kind = EProvider.FLOWX;
  private quoter: AggregatorQuoter;
  constructor(
    private readonly options: FlowxProviderOptions,
    private readonly client: ClientWithCoreApi,
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
    assertQuoteProvider(options.quote, EProvider.FLOWX);
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
    const swap = builder.build().swap;
    type SwapClient = Parameters<typeof swap>[0]["client"];
    const res = await swap({
      tx: options.tx,
      // FlowX 2.0.3 types `client` as `SuiGrpcClient`, but at runtime it only
      // calls through `core.*`. Cast at this single boundary so the SDK
      // public API stays transport-agnostic (`ClientWithCoreApi`).
      client: this.client as unknown as SwapClient,
      coinIn: options.coinIn,
    });
    MetaAgError.assert(
      !!res,
      "FlowX swap returned no coin out",
      MetaAgErrorCode.INVALID_QUOTE,
      { quote: options.quote, expectedProvider: EProvider.FLOWX },
    );
    return res;
  }
}
