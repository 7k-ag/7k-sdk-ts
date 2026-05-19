import { AggregatorClient, Env } from "@cetusprotocol/aggregator-sdk";
import { ClientWithCoreApi } from "@mysten/sui/client";
import { v4 } from "uuid";
import { _7K_PARTNER_ADDRESS } from "../../../constants/_7k";
import {
  AggregatorProvider,
  CetusProviderOptions,
  EProvider,
  MetaAgOptions,
  MetaQuote,
  MetaQuoteOptions,
  MetaSwapOptions,
  QuoteProvider,
} from "../../../types/metaAg";
import { assertQuoteProvider } from "../common";
import { MetaAgError, MetaAgErrorCode } from "../error";

export class CetusProvider implements QuoteProvider, AggregatorProvider {
  readonly kind = EProvider.CETUS;
  private readonly cetusClient: AggregatorClient;
  constructor(
    private readonly options: CetusProviderOptions,
    metaOptions: MetaAgOptions,
    client: ClientWithCoreApi,
  ) {
    this.cetusClient = new AggregatorClient({
      apiKey: options.apiKey,
      // Cetus 1.5.4 types `client` as `SuiJsonRpcClient` but the methods
      // exercised by the `findRouters` + `routerSwap` path we use here are
      // present on `SuiGrpcClient`. The legacy-only methods it can call
      // (`getDynamicFieldObject`, `getCoins`, `getOwnedObjects`,
      // `devInspectTransactionBlock`) sit behind code paths we don't enter
      // (Pyth-priced routes, DeepBookV3 account caps, in-pool simulation).
      // Cast at this single boundary to keep the SDK gRPC-only.
      client: client as unknown as ConstructorParameters<
        typeof AggregatorClient
      >[0]["client"],
      endpoint: options.api,
      env: Env.Mainnet,
      pythUrls: metaOptions.hermesApi ? [metaOptions.hermesApi] : [],
      overlayFeeRate: 0,
      overlayFeeReceiver: _7K_PARTNER_ADDRESS,
    });
  }

  async quote(quoteOptions: MetaQuoteOptions): Promise<MetaQuote> {
    const quote = await this.cetusClient.findRouters({
      amount: quoteOptions.amountIn,
      byAmountIn: true,
      from: quoteOptions.coinTypeIn,
      target: quoteOptions.coinTypeOut,
      providers: this.options.sources,
      splitCount: this.options.splitCount,
      splitAlgorithm: this.options.splitAlgorithm,
      splitFactor: this.options.splitFactor,
      depth: this.options.depth,
      liquidityChanges: this.options.liquidityChanges,
    });
    MetaAgError.assert(
      !!quote,
      "No quote found",
      MetaAgErrorCode.QUOTE_NOT_FOUND,
      { provider: this.kind },
    );
    return {
      id: v4(),
      provider: EProvider.CETUS,
      quote,
      amountIn: quote.amountIn.toString() || "0",
      rawAmountOut: quote.amountOut.toString() || "0",
      amountOut: quote.amountOut.toString() || "0",
      coinTypeIn: quoteOptions.coinTypeIn,
      coinTypeOut: quoteOptions.coinTypeOut,
    };
  }

  async swap(options: MetaSwapOptions) {
    assertQuoteProvider(options.quote, EProvider.CETUS);
    const coinOut = await this.cetusClient.routerSwap({
      inputCoin: options.coinIn,
      router: options.quote.quote,
      slippage: 1,
      txb: options.tx,
    });
    return coinOut;
  }
}
