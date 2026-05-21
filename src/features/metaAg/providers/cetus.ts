import { AggregatorClient, Env } from "@cetusprotocol/aggregator-sdk";
import { ClientWithCoreApi } from "@mysten/sui/client";
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
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

/**
 * Cetus 1.5.4 types its internal client as `SuiJsonRpcClient` and exercises
 * legacy JSON-RPC methods (`getDynamicFieldObject`, `getCoins`,
 * `getOwnedObjects`, `devInspectTransactionBlock`) on Pyth-priced and
 * DeepBookV3 routes. Caller must supply a `SuiJsonRpcClient` (via
 * `CetusProviderOptions.client` or the global `MetaAgOptions.client`) for
 * full coverage. When a future Cetus release widens to `ClientWithCoreApi`,
 * we can narrow this constructor to that type.
 */
export class CetusProvider implements QuoteProvider, AggregatorProvider {
  readonly kind = EProvider.CETUS;
  private readonly cetusClient: AggregatorClient;
  constructor(
    private readonly options: CetusProviderOptions,
    metaOptions: MetaAgOptions,
    client: ClientWithCoreApi,
  ) {
    // Resolve to a `SuiJsonRpcClient`-shaped client: per-provider override
    // wins, otherwise cast the global `ClientWithCoreApi` at this single
    // vendor seam. Cetus 1.5.4 doesn't yet accept `ClientWithCoreApi`; when
    // it does, this cast (and the option override) can be dropped.
    const cetusClient =
      options.client ?? (client as unknown as SuiJsonRpcClient);
    this.cetusClient = new AggregatorClient({
      apiKey: options.apiKey,
      client: cetusClient,
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
