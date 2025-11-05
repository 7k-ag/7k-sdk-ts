import { AggregatorClient, Env } from "@cetusprotocol/aggregator-sdk";
import { SuiClient } from "@mysten/sui/client";
import { TransactionObjectArgument } from "@mysten/sui/transactions";
import { v4 } from "uuid";
import { _7K_PARTNER_ADDRESS } from "../../../constants/_7k";
import {
  AgProvider,
  CetusProviderOptions,
  EProvider,
  MetaAgOptions,
  MetaQuote,
  MetaQuoteOptions,
  MetaSwapOptions,
} from "../../../types/metaAg";
import { assert } from "../../../utils/condition";

export class CetusProvider implements AgProvider {
  kind = EProvider.CETUS;
  private readonly cetusClient: AggregatorClient;
  constructor(
    private readonly options: CetusProviderOptions,
    metaOptions: MetaAgOptions,
    client: SuiClient,
  ) {
    this.cetusClient = new AggregatorClient({
      apiKey: options.apiKey,
      client,
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
      from: quoteOptions.coinInType,
      target: quoteOptions.coinOutType,
      providers: this.options.sources,
      splitCount: this.options.splitCount,
      splitAlgorithm: this.options.splitAlgorithm,
      splitFactor: this.options.splitFactor,
      depth: this.options.depth,
      liquidityChanges: this.options.liquidityChanges,
    });
    assert(!!quote, "No quote found");
    return {
      id: v4(),
      provider: EProvider.CETUS,
      quote,
      amountIn: quote.amountIn.toString() || "0",
      rawAmountOut: quote.amountOut.toString() || "0",
      amountOut: quote.amountOut.toString() || "0",
      coinTypeIn: quoteOptions.coinInType,
      coinTypeOut: quoteOptions.coinOutType,
    };
  }

  async swap(options: MetaSwapOptions): Promise<TransactionObjectArgument> {
    assert(options.quote.provider === EProvider.CETUS, "Expect Cetus quote");
    const coinOut = await this.cetusClient.routerSwap({
      inputCoin: options.coinIn,
      router: options.quote.quote,
      slippage: 1,
      txb: options.tx,
    });
    return coinOut;
  }
}
