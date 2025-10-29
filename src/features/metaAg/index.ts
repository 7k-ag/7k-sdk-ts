import { getFullnodeUrl, SuiClient, SuiEvent } from "@mysten/sui/client";
import {
  coinWithBalance,
  Transaction,
  TransactionObjectArgument,
} from "@mysten/sui/transactions";
import { normalizeStructTag } from "@mysten/sui/utils";
import {
  _7K_META_CONFIG,
  _7K_META_PACKAGE_ID,
  _7K_META_PUBLISHED_AT,
  _7K_META_VAULT,
} from "../../constants/_7k";
import { SUI_ADDRESS_ZERO } from "../../constants/sui";
import {
  AgProvider,
  BluefinProviderOptions,
  CetusProviderOptions,
  EProvider,
  FlowxProviderOptions,
  MetaAgOptions,
  MetaQuote,
  MetaQuoteOptions,
  MetaSimulationOptions,
  MetaSwapOptions,
} from "../../types/metaAg";
import { assert } from "../../utils/condition";
import { SuiClientUtils } from "../../utils/SuiClientUtils";
import { getExpectedReturn } from "../swap/buildTx";
import { BluefinProvider } from "./providers/bluefin";

const HERMES_API = "https://hermes.pyth.network";

const DEFAULT_PROVIDERS: Required<MetaAgOptions>["providers"] = {
  [EProvider.BLUEFIN7K]: {},
  [EProvider.FLOWX]: {},
  [EProvider.CETUS]: {},
};
export class MetaAg {
  client: SuiClient;
  private providers: Partial<Record<EProvider, AgProvider>> = {};
  private inspector: SuiClientUtils;
  private options: Required<MetaAgOptions>;
  constructor(options?: MetaAgOptions) {
    this.options = {
      providers: options?.providers ?? DEFAULT_PROVIDERS,
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
    assert(!!providerOptions, `Provider not found: ${provider}`);
    // eslint-disable-next-line no-case-declarations
    switch (provider) {
      case EProvider.BLUEFIN7K:
        this.providers[EProvider.BLUEFIN7K] = new BluefinProvider(
          providerOptions as BluefinProviderOptions,
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
          this.options,
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
      default:
        throw new Error(`Provider not supported: ${provider}`);
    }
    return this.providers[provider]!;
  }

  private async _simulate(
    provider: AgProvider,
    quote: MetaQuote,
    simulation: MetaSimulationOptions,
  ) {
    try {
      const tx = new Transaction();
      const id = quote.id;
      const coinOut = await provider.swap({
        quote,
        coinIn: coinWithBalance({
          balance: BigInt(quote.amountIn),
          type: quote.coinTypeIn,
          useGasCoin: false,
        }),
        signer: simulation.sender,
        tx,
      });
      tx.add(
        metaSettle(
          quote,
          coinOut,
          10000,
          this.options.tipBps,
          this.options.partner,
          this.options.partnerCommissionBps,
        ),
      );
      tx.transferObjects([coinOut], simulation.sender);
      const res = await timeout(
        () =>
          this.inspector.devInspectTransactionBlock({
            sender: simulation.sender,
            transactionBlock: tx,
          }),
        simulation.timeout ?? 2000,
        `simulation for ${provider.kind} provider with id ${id}`,
      );
      if (res.effects.status.status === "failure") {
        throw new Error(res.error ?? "Simulation failed");
      }
      const amountOut = extractAmountOutWrapper(res.events);
      return {
        id,
        simulatedAmountOut: amountOut as string,
        gasUsed: res.effects.gasUsed,
        provider: provider.kind,
      };
    } catch (error) {
      console.warn(`Failed to simulate ${provider.kind}: `, error);
    }
  }

  private async _quote(
    provider: AgProvider,
    options: MetaQuoteOptions,
    simulation?: MetaSimulationOptions,
  ) {
    const quote = await timeout(
      () => provider.quote(options),
      options.timeout ?? 2000,
      `quote for ${provider.kind} provider from ${options.coinInType} to ${options.coinOutType}`,
    );
    if (simulation) {
      if (simulation.onSimulated) {
        this._simulate(provider, quote, simulation).then((payload) => {
          if (payload) {
            simulation.onSimulated?.(payload);
          }
        });
      } else {
        const updated = await this._simulate(provider, quote, simulation);
        quote.simulatedAmountOut = updated?.simulatedAmountOut;
        quote.gasUsed = updated?.gasUsed;
      }
    }
    return quote;
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
      coinInType: normalizeStructTag(options.coinInType),
      coinOutType: normalizeStructTag(options.coinOutType),
    };
    const quotes = await Promise.allSettled(
      Object.keys(this.options.providers).map(async (provider) => {
        const p = await this._getProvider(provider as EProvider);
        return this._quote(p, opts, simulation);
      }),
    );
    return quotes
      .map((quote) =>
        quote.status === "fulfilled"
          ? quote.value
          : (console.log(quote.reason), null),
      )
      .filter((quote) => quote !== null);
  }

  /**
   * Build transaction from quote
   * @param options - build tx options
   * @param slippageBps - slippage bps if not specified, fallback to global slippage bps, if none of them specified, default to 100
   * @returns coin out object, you must consume it by transferObjects, or other sub sequence commands
   */
  async swap(
    options: MetaSwapOptions,
    slippageBps?: number,
  ): Promise<TransactionObjectArgument> {
    const provider = await this._getProvider(options.quote.provider);
    assert(!!provider, `Provider not found: ${options.quote.provider}`);
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

/**
 * this settlement does not charge commission fee for partner, since all integrated aggregators already charge commission fee for partner
 * @param quote Meta Aggregator Quote
 * @param coinOut Coin Out Object
 * @param slippageBps Slippage Bps
 * @param tipBps Tip Bps default = 0
 * @param partner address of partner for analytic default is zero address
 */
const metaSettle = (
  quote: MetaQuote,
  coinOut: TransactionObjectArgument,
  slippageBps = 100,
  tipBps = 0,
  partner?: string,
  commissionBps = 0,
) => {
  return (tx: Transaction) => {
    const { minAmount, expectedAmount } = getExpectedReturn(
      quote.rawAmountOut,
      slippageBps,
      commissionBps, // use for calculate expected amount out
      tipBps,
    );

    if (tipBps > 0) {
      tx.moveCall({
        target: `${_7K_META_PUBLISHED_AT}::vault::collect_tip`,
        typeArguments: [quote.coinTypeOut],
        arguments: [
          tx.object(_7K_META_VAULT),
          tx.object(_7K_META_CONFIG),
          coinOut,
          tx.pure.u64(tipBps),
        ],
      });
    }

    tx.moveCall({
      target: `${_7K_META_PUBLISHED_AT}::settle::settle`,
      typeArguments: [quote.coinTypeIn, quote.coinTypeOut],
      arguments: [
        tx.object(_7K_META_CONFIG),
        tx.object(_7K_META_VAULT),
        tx.pure.u64(quote.amountIn),
        coinOut,
        tx.pure.u64(minAmount),
        tx.pure.u64(expectedAmount),
        tx.pure.option("address", partner),
        tx.pure.u64(0), // commission must be 0 since all integrated aggregators already charge commission fee for partner
        tx.pure.u64(0), // ps
      ],
    });
  };
};

const extractAmountOutWrapper = (events: SuiEvent[]) => {
  const swapEvent = events
    .filter((event) => event.type === `${_7K_META_PACKAGE_ID}::settle::Swap`)
    ?.pop();
  return (swapEvent?.parsedJson as any)?.amount_out;
};

const catchImportError = (provider: EProvider) => {
  return (e: any) => {
    const map = {
      [EProvider.CETUS]: "@cetusprotocol/aggregator-sdk",
      [EProvider.FLOWX]: "@flowx-finance/sdk",
      [EProvider.BLUEFIN7K]: "@7kprotocol/sdk-ts",
    };
    console.warn(`Please install ${map[provider]} to use ${provider} provider`);
    throw e;
  };
};

const timeout = async <T = any>(
  fn: () => Promise<T>,
  timeout: number,
  msg?: string,
) => {
  if (timeout <= 0) return fn();
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timeout ${msg ?? "operation"}`)),
      timeout,
    );
    fn()
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timer));
  });
};
