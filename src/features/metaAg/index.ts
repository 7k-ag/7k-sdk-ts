import {
  getFullnodeUrl,
  GetTransactionBlockParams,
  SuiClient,
  SuiTransactionBlockResponse,
} from "@mysten/sui/client";
import {
  coinWithBalance,
  Transaction,
  TransactionObjectArgument,
} from "@mysten/sui/transactions";
import { normalizeStructTag, toBase64 } from "@mysten/sui/utils";
import { SUI_ADDRESS_ZERO } from "../../constants/sui";
import {
  Bluefin7kProviderOptions,
  CetusProviderOptions,
  EProvider,
  FlowxProviderOptions,
  isAggregatorProvider,
  isSwapAPIProvider,
  MetaAgOptions,
  MetaFastSwapOptions,
  MetaQuote,
  MetaQuoteOptions,
  MetaSimulationOptions,
  MetaSwapOptions,
  OkxProviderOptions,
  QuoteProvider,
} from "../../types/metaAg";
import { isSystemAddress } from "../../utils/sui";
import { SuiClientUtils } from "../../utils/SuiClientUtils";
import { getExpectedReturn } from "../../utils/swap";
import { metaSettle, simulateAggregator, timeout } from "./common";
import { MetaAgError, MetaAgErrorCode } from "./error";
import { OkxProvider, simulateOKXSwap } from "./providers/okx";

const HERMES_API = "https://hermes.pyth.network";

const DEFAULT_PROVIDERS: Required<MetaAgOptions>["providers"] = {
  [EProvider.BLUEFIN7K]: {},
  [EProvider.FLOWX]: {},
  [EProvider.CETUS]: {},
};

export class MetaAg {
  client: SuiClient;
  private providers: Partial<Record<EProvider, QuoteProvider>> = {};
  private inspector: SuiClientUtils;
  private options: Required<MetaAgOptions>;
  constructor(options?: MetaAgOptions) {
    this.options = {
      providers: { ...DEFAULT_PROVIDERS, ...options?.providers },
      slippageBps: options?.slippageBps ?? 100,
      fullnodeUrl: options?.fullnodeUrl ?? getFullnodeUrl("mainnet"),
      hermesApi: options?.hermesApi ?? HERMES_API,
      partner: options?.partner ?? SUI_ADDRESS_ZERO,
      partnerCommissionBps: options?.partnerCommissionBps ?? 0,
      tipBps: options?.tipBps ?? 0,
    };

    this.client = new SuiClient({
      url: this.options.fullnodeUrl,
    });

    this.inspector = new SuiClientUtils(this.client);
  }

  private async _getProvider(provider: EProvider) {
    const p = this.providers[provider];
    if (p) return p;

    const providerOptions = this.options.providers[provider];
    MetaAgError.assert(
      !!providerOptions,
      `Provider not found: ${provider}`,
      MetaAgErrorCode.PROVIDER_NOT_FOUND,
      { provider },
    );
    switch (provider) {
      case EProvider.BLUEFIN7K:
        const { Bluefin7kProvider } =
          await import("./providers/bluefin7k").catch(
            catchImportError(EProvider.BLUEFIN7K),
          );
        this.providers[EProvider.BLUEFIN7K] = new Bluefin7kProvider(
          providerOptions as Bluefin7kProviderOptions,
          this.options,
          this.client,
        );
        break;
      case EProvider.FLOWX:
        const { FlowxProvider } = await import("./providers/flowx").catch(
          catchImportError(EProvider.FLOWX),
        );
        this.providers[EProvider.FLOWX] = new FlowxProvider(
          providerOptions as FlowxProviderOptions,
          this.client,
        );
        break;
      case EProvider.CETUS:
        const { CetusProvider } = await import("./providers/cetus").catch(
          catchImportError(EProvider.CETUS),
        );
        this.providers[EProvider.CETUS] = new CetusProvider(
          providerOptions as CetusProviderOptions,
          this.options,
          this.client,
        );
        break;
      case EProvider.OKX:
        this.providers[EProvider.OKX] = new OkxProvider(
          providerOptions as OkxProviderOptions,
          this.options,
          this.client,
        );
        break;
      default:
        throw new MetaAgError(
          `Provider not supported: ${provider}`,
          MetaAgErrorCode.PROVIDER_NOT_SUPPORTED,
          { provider },
        );
    }
    return this.providers[provider]!;
  }

  private async _simulate(
    provider: QuoteProvider,
    quote: MetaQuote,
    simulation: MetaSimulationOptions,
  ) {
    try {
      if (isAggregatorProvider(provider)) {
        return simulateAggregator(
          provider,
          quote,
          simulation,
          this.inspector,
          this.options,
        );
      }

      switch (quote.provider) {
        case EProvider.OKX:
          return simulateOKXSwap(
            quote,
            this.inspector,
            simulation,
            this.options,
          );
        default:
          throw new MetaAgError(
            `Provider not supported: ${provider.kind}`,
            MetaAgErrorCode.PROVIDER_NOT_SUPPORTED,
            { provider: provider.kind },
          );
      }
    } catch (error) {
      console.warn(error, { provider: provider.kind, quote: quote.id });
    }
  }

  private async _quote(provider: QuoteProvider, options: MetaQuoteOptions) {
    const quote = await timeout(
      async () => {
        const quote = await provider.quote(options);
        if (!quote) return null;
        const { expectedAmount } = getExpectedReturn(
          quote.rawAmountOut,
          0,
          this.options.partnerCommissionBps,
          this.options.tipBps,
        );
        quote.amountOut = expectedAmount;
        return quote;
      },
      options.timeout ?? 2000,
      `quote for ${provider.kind} provider from ${options.coinTypeIn} to ${options.coinTypeOut}`,
    );

    return quote;
  }

  private async _fastSwap(
    { quote, signer, useGasCoin, signTransaction }: MetaFastSwapOptions,
    getTransactionBlockParams?: Omit<GetTransactionBlockParams, "digest">,
  ) {
    const tx = new Transaction();
    const coin = await this.swap({
      quote,
      signer,
      tx,
      coinIn: coinWithBalance({
        type: quote.coinTypeIn,
        balance: BigInt(quote.amountIn),
        useGasCoin,
      }),
    });
    tx.transferObjects([coin], signer);
    tx.setSenderIfNotSet(signer);
    const txBytes = await tx.build({ client: this.client });
    const { signature, bytes } = await signTransaction(toBase64(txBytes));
    return this.client.executeTransactionBlock({
      transactionBlock: bytes,
      signature,
      options: getTransactionBlockParams?.options,
      signal: getTransactionBlockParams?.signal,
    });
  }

  /**
   * Get quotes from all providers
   * @param options - quote options
   * @param simulation - if present, the quote will be simulated
   * @returns quotes from all providers
   */
  async quote(
    options: MetaQuoteOptions,
    simulation?: MetaSimulationOptions,
  ): Promise<MetaQuote[]> {
    const opts: MetaQuoteOptions = {
      ...options,
      coinTypeIn: normalizeStructTag(options.coinTypeIn),
      coinTypeOut: normalizeStructTag(options.coinTypeOut),
    };
    const quotes = await Promise.allSettled(
      Object.entries(this.options.providers)
        .filter(([_k, v]) => !v.disabled)
        .map(async ([provider]) => {
          const p = await this._getProvider(provider as EProvider);
          return this._quote(p, opts);
        }),
    );
    const result = quotes
      .map((quote) =>
        quote.status === "fulfilled"
          ? quote.value
          : (console.log(quote.reason), null),
      )
      .filter((quote) => quote !== null);

    if (simulation) {
      const requests = result.map(async (quote) => {
        const provider = await this._getProvider(quote.provider);
        const updated = await this._simulate(provider, quote, simulation);
        quote.simulatedAmountOut = updated?.simulatedAmountOut;
        quote.gasUsed = updated?.gasUsed;
        simulation?.onSimulated?.({ ...quote });
      });
      if (!simulation.onSimulated) {
        await Promise.all(requests);
      }
    }

    return result;
  }

  /**
   * Build transaction from quote
   * @info Use this function to build composable transaction (ie: add more commands after the swap, consume the coin out object)
   * @warning Providers that build transaction on the fly (typically RFQ, Swap-API providers ie: Okx, ...) are not supported, please use `fastSwap` instead
   * @param options - build tx options
   * @param slippageBps - slippage bps if not specified, fallback to global slippage bps, if none of them specified, default to 100
   * @returns coin out object, you must consume it by transferObjects, or other sub sequence commands
   */
  async swap(
    options: MetaSwapOptions,
    slippageBps?: number,
  ): Promise<TransactionObjectArgument> {
    const provider = await this._getProvider(options.quote.provider);
    MetaAgError.assert(
      !!provider,
      `Provider not found: ${options.quote.provider}`,
      MetaAgErrorCode.PROVIDER_NOT_FOUND,
      { provider: options.quote.provider },
    );
    MetaAgError.assert(
      isAggregatorProvider(provider),
      `Provider does not support swap: ${provider.kind}, use fastSwap instead`,
      MetaAgErrorCode.PROVIDER_NOT_SUPPORT_SWAP,
      { provider: provider.kind },
    );
    MetaAgError.assert(
      options.signer && !isSystemAddress(options.signer),
      "Invalid signer address",
      MetaAgErrorCode.INVALID_SIGNER_ADDRESS,
      { signer: options.signer },
    );
    const coinOut = await provider.swap(options);
    options.tx.add(
      metaSettle(
        options.quote,
        coinOut,
        slippageBps ?? this.options.slippageBps ?? 100,
        this.options.tipBps,
        this.options.partner,
        this.options.partnerCommissionBps,
      ),
    );
    options.tx.setSenderIfNotSet(options.signer);
    return coinOut;
  }

  /**
   * Build, Sign, and Execute transaction in one step
   * @param options - fast swap options
   * @returns - txDigest of the transaction
   */
  async fastSwap(
    options: MetaFastSwapOptions,
    getTransactionBlockParams?: Omit<GetTransactionBlockParams, "digest">,
  ): Promise<SuiTransactionBlockResponse> {
    MetaAgError.assert(
      options.signer && !isSystemAddress(options.signer),
      "Invalid signer address",
      MetaAgErrorCode.INVALID_SIGNER_ADDRESS,
      { signer: options.signer },
    );
    const provider = await this._getProvider(options.quote.provider);
    if (isAggregatorProvider(provider)) {
      return this._fastSwap(options, getTransactionBlockParams);
    } else if (isSwapAPIProvider(provider)) {
      return this.client.waitForTransaction({
        ...getTransactionBlockParams,
        digest: await provider.fastSwap(options),
      });
    } else {
      throw new MetaAgError(
        `Provider not supported: ${provider.kind}`,
        MetaAgErrorCode.PROVIDER_NOT_SUPPORTED,
        { provider: provider.kind },
      );
    }
  }

  /**
   * Update meta aggregator options
   * @param options - update options payload
   */
  updateMetaAgOptions(options: MetaAgOptions) {
    if (Object.keys(options).length === 0) return;
    this.options.slippageBps = options.slippageBps ?? this.options.slippageBps;
    this.options.partner = options.partner ?? this.options.partner;
    this.options.partnerCommissionBps =
      options.partnerCommissionBps ?? this.options.partnerCommissionBps;
    this.options.tipBps = options.tipBps ?? this.options.tipBps;
    if (
      options.fullnodeUrl &&
      options.fullnodeUrl !== this.options.fullnodeUrl
    ) {
      this.client = new SuiClient({ url: options.fullnodeUrl });
      this.inspector = new SuiClientUtils(this.client);
      this.options.fullnodeUrl = options.fullnodeUrl;
    }
    if (options.hermesApi && options.hermesApi !== this.options.hermesApi) {
      this.providers = {};
      this.options.hermesApi = options.hermesApi;
    }
    // if update provider's options, we need to re-initialize the provider
    for (const [provider, opt] of Object.entries(options.providers || {})) {
      this.options.providers[provider as EProvider] = {
        ...opt,
        ...this.options.providers[provider as EProvider],
      } as any;
      delete this.providers[provider as EProvider];
    }
  }
}

const catchImportError = (provider: EProvider) => {
  return (e: any) => {
    const map = {
      [EProvider.CETUS]: "@cetusprotocol/aggregator-sdk",
      [EProvider.FLOWX]: "@flowx-finance/sdk",
      [EProvider.BLUEFIN7K]: "@bluefin-exchange/bluefin7k-aggregator-sdk",
      [EProvider.OKX]: "",
    };
    console.warn(`Please install ${map[provider]} to use ${provider} provider`);
    throw e;
  };
};
