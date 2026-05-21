import {
  AggregatorQuoter,
  Commission,
  CommissionType,
  TradeBuilder,
} from "@flowx-finance/sdk";
import { ClientWithCoreApi } from "@mysten/sui/client";
import { SuiGrpcClient } from "@mysten/sui/grpc";
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
  // FlowX 2.0.3 calls native methods on `SuiGrpcClient` (`getBalance`,
  // `getDynamicField`, `getObject`, etc.) and does not yet accept
  // `ClientWithCoreApi`. We accept the global `ClientWithCoreApi` for
  // forward compatibility and let callers override per-provider via
  // `FlowxProviderOptions.client` when the global isn't a gRPC client.
  // The cast is the single vendor seam — drop it when FlowX widens.
  private readonly client: SuiGrpcClient;
  constructor(
    private readonly options: FlowxProviderOptions,
    client: ClientWithCoreApi,
  ) {
    this.client = options.client ?? (client as unknown as SuiGrpcClient);
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
    const res = await builder.build().swap({
      tx: options.tx,
      client: this.client,
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
