import { SuiClient } from "@mysten/sui/client";
import {
  SuiPriceServiceConnection,
  SuiPythClient,
} from "@pythnetwork/pyth-sui-js";
import { v4 } from "uuid";
import { Config } from "../../../config";
import { _7K_PARTNER_ADDRESS } from "../../../constants/_7k";
import { SourceDex } from "../../../types/aggregator";
import {
  AggregatorProvider,
  BluefinProviderOptions,
  EProvider,
  MetaAgOptions,
  MetaQuote,
  MetaQuoteOptions,
  MetaSwapOptions,
  QuoteProvider,
} from "../../../types/metaAg";
import { assert } from "../../../utils/condition";
import { buildTxV2 } from "../../swap/buildTxV2";
import { getQuote } from "../../swap/getQuote";
const WORMHOLE_STATE_ID =
  "0xaeab97f96cf9877fee2883315d459552b2b921edc16d7ceac6eab944dd88919c";
const PYTH_STATE_ID =
  "0x1f9310238ee9298fb703c3419030b35b22bb1cc37113e3bb5007c99aec79e5b8";
export class BluefinProvider implements QuoteProvider, AggregatorProvider {
  readonly kind = EProvider.BLUEFIN7K;
  constructor(
    private readonly options: BluefinProviderOptions,
    private readonly metaOptions: Required<MetaAgOptions>,
    client: SuiClient,
  ) {
    const pythClient = new SuiPythClient(
      client as any,
      PYTH_STATE_ID,
      WORMHOLE_STATE_ID,
    );
    const pythConnection = new SuiPriceServiceConnection(
      this.metaOptions.hermesApi,
    );
    if (options.apiKey) Config.setApiKey(options.apiKey);
    if (options.api) Config.setApi(options.api);
    Config.setSuiClient(client);
    Config.setPythClient(pythClient);
    Config.setPythConnection(pythConnection);
  }
  async quote(options: MetaQuoteOptions): Promise<MetaQuote> {
    const quote = await getQuote({
      amountIn: options.amountIn,
      tokenIn: options.coinTypeIn,
      tokenOut: options.coinTypeOut,
      sources: this.options.sources as SourceDex[],
      maxPaths: this.options.maxPaths,
      excludedPools: this.options.excludedPools,
      targetPools: this.options.targetPools,
    });
    return {
      id: v4(),
      provider: EProvider.BLUEFIN7K,
      quote,
      amountIn: quote.swapAmountWithDecimal,
      rawAmountOut: quote.returnAmountWithDecimal,
      amountOut: quote.returnAmountWithDecimal,
      coinTypeIn: options.coinTypeIn,
      coinTypeOut: options.coinTypeOut,
    };
  }
  async swap({ quote, signer, tx, coinIn }: MetaSwapOptions) {
    assert(quote.provider === EProvider.BLUEFIN7K, "Invalid quote");
    const { coinOut } = await buildTxV2({
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
