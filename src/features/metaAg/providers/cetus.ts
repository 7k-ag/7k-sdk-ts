import { AggregatorClient, Env } from "@cetusprotocol/aggregator-sdk";
import { SuiClient } from "@mysten/sui/client";
import { TransactionObjectArgument } from "@mysten/sui/transactions";
import { v4 } from "uuid";
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
import { getExpectedReturn } from "../../swap/buildTx";

export class CetusProvider implements AgProvider {
  kind = EProvider.CETUS;
  private readonly cetusClient: AggregatorClient;
  constructor(
    private readonly options: CetusProviderOptions,
    private readonly metaOptions: MetaAgOptions,
    client: SuiClient,
  ) {
    this.cetusClient = new AggregatorClient({
      apiKey: options.apiKey,
      overlayFeeReceiver: metaOptions.partner,
      overlayFeeRate: metaOptions.partnerCommissionBps
        ? metaOptions.partnerCommissionBps / 10000
        : undefined,
      client,
      endpoint: options.api,
      env: Env.Mainnet,
      pythUrls: metaOptions.hermesApi ? [metaOptions.hermesApi] : [],
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
    const bps = BigInt(this.metaOptions.partnerCommissionBps ?? 0);
    // calc amount out before any commission fees
    const amountOut = (
      (BigInt(quote.amountOut.toString()) * 10000n) /
      (10000n - bps)
    ).toString();
    const { expectedAmount } = getExpectedReturn(
      amountOut,
      0,
      this.metaOptions.partnerCommissionBps ?? 0,
      this.metaOptions.tipBps ?? 0,
    );
    return {
      id: v4(),
      provider: EProvider.CETUS,
      quote,
      amountIn: quote.amountIn.toString(),
      rawAmountOut: amountOut,
      amountOut: expectedAmount,
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
