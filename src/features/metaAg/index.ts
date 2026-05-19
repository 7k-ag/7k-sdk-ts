import { ClientWithCoreApi, CoreClient } from "@mysten/sui/client";
import { SuiGrpcClient } from "@mysten/sui/grpc";
// The Sui fullnode URL is the same endpoint for JSON-RPC and gRPC — the v2
// gRPC transport hits the same host as the legacy JSON-RPC. We reuse the
// upstream helper for the value, not to construct a JSON-RPC client.
import { getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import {
  coinWithBalance,
  Transaction,
  TransactionObjectArgument,
} from "@mysten/sui/transactions";
import { fromBase64, normalizeStructTag, toBase64 } from "@mysten/sui/utils";
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

const DEFAULT_CLIENT = (): ClientWithCoreApi =>
  new SuiGrpcClient({
    baseUrl: getJsonRpcFullnodeUrl("mainnet"),
    network: "mainnet",
  });

const HERMES_API = "https://hermes.pyth.network";

/** Result type returned by `MetaAg.fastSwap` (transport-agnostic v2 shape). */
export type MetaTransactionResult = Awaited<
  ReturnType<CoreClient["executeTransaction"]>
>;

/** Subset of v2 `TransactionInclude` flags exposed by `MetaAg.fastSwap`. */
export interface MetaExecuteInclude {
  balanceChanges?: boolean;
  effects?: boolean;
  events?: boolean;
  objectTypes?: boolean;
}

export interface ExecuteTransactionExtraOptions {
  signal?: AbortSignal;
  /**
   * Flags forwarded to the gRPC `executeTransaction`/`waitForTransaction`
   * call. When omitted, the result contains `digest`/`signatures` only; pass
   * `{ effects: true, events: true }` to populate the corresponding fields.
   */
  include?: MetaExecuteInclude;
}

const DEFAULT_PROVIDERS: Required<MetaAgOptions>["providers"] = {
  [EProvider.BLUEFIN7K]: {},
  [EProvider.FLOWX]: {},
  [EProvider.CETUS]: {},
};

export class MetaAg {
  client: ClientWithCoreApi;
  private providers: Partial<Record<EProvider, QuoteProvider>> = {};
  private inspector: SuiClientUtils;
  private options: Required<MetaAgOptions>;
  constructor(options?: MetaAgOptions) {
    this.client = options?.client ?? DEFAULT_CLIENT();
    this.options = {
      providers: { ...DEFAULT_PROVIDERS, ...options?.providers },
      slippageBps: options?.slippageBps ?? 100,
      client: this.client,
      hermesApi: options?.hermesApi ?? HERMES_API,
      partner: options?.partner ?? SUI_ADDRESS_ZERO,
      partnerCommissionBps: options?.partnerCommissionBps ?? 0,
      tipBps: options?.tipBps ?? 0,
    };
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
        return await simulateAggregator(
          provider,
          quote,
          simulation,
          this.inspector,
          this.options,
        );
      }

      switch (quote.provider) {
        case EProvider.OKX:
          return await simulateOKXSwap(
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
      return undefined;
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
    extraOptions?: ExecuteTransactionExtraOptions,
  ): Promise<MetaTransactionResult> {
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
    return this.client.core.executeTransaction({
      transaction: fromBase64(bytes),
      signatures: [signature],
      signal: extraOptions?.signal,
      include: extraOptions?.include,
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
          : (console.warn(quote.reason), null),
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
    extraOptions?: ExecuteTransactionExtraOptions,
  ): Promise<MetaTransactionResult> {
    MetaAgError.assert(
      options.signer && !isSystemAddress(options.signer),
      "Invalid signer address",
      MetaAgErrorCode.INVALID_SIGNER_ADDRESS,
      { signer: options.signer },
    );
    const provider = await this._getProvider(options.quote.provider);
    if (isAggregatorProvider(provider)) {
      return this._fastSwap(options, extraOptions);
    } else if (isSwapAPIProvider(provider)) {
      return this.client.core.waitForTransaction({
        digest: await provider.fastSwap(options),
        signal: extraOptions?.signal,
        include: extraOptions?.include,
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
    const clientChanged = Boolean(
      options.client && options.client !== this.client,
    );
    const hermesChanged = Boolean(
      options.hermesApi && options.hermesApi !== this.options.hermesApi,
    );
    if (clientChanged) {
      this.client = options.client!;
      this.options.client = this.client;
      this.inspector = new SuiClientUtils(this.client);
    }
    if (hermesChanged) {
      this.options.hermesApi = options.hermesApi!;
    }
    // Providers capture the previous client / Hermes URL — drop them so they
    // re-initialize with the latest options on next use.
    if (clientChanged || hermesChanged) {
      this.providers = {};
    }
    // if update provider's options, we need to re-initialize the provider
    for (const [provider, opt] of Object.entries(options.providers || {})) {
      this.options.providers[provider as EProvider] = {
        ...opt,
        ...this.options.providers[provider as EProvider],
      } as Bluefin7kProviderOptions &
        CetusProviderOptions &
        FlowxProviderOptions &
        OkxProviderOptions;
      delete this.providers[provider as EProvider];
    }
  }
}

const catchImportError = (provider: EProvider) => {
  return (e: unknown): never => {
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
