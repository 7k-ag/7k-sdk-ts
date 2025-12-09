import { SuiClient } from "@mysten/sui/client";
import {
  Commands,
  Transaction,
  TransactionDataBuilder,
  TransactionObjectArgument,
} from "@mysten/sui/transactions";
import {
  normalizeStructTag,
  normalizeSuiAddress,
  toBase64,
} from "@mysten/sui/utils";
import { v4 } from "uuid";
import { SUI_TYPE } from "../../../constants/tokens";
import {
  EProvider,
  MetaAgOptions,
  MetaFastSwapOptions,
  MetaQuote,
  MetaQuoteOptions,
  MetaSimulationOptions,
  MetaSwapOptions,
  OkxProviderOptions,
  QuoteProvider,
  SwapAPIProvider,
} from "../../../types/metaAg";
import { OkxSwapRequest, OkxSwapResponse } from "../../../types/okx";
import { isSystemAddress } from "../../../utils/sui";
import { SuiClientUtils } from "../../../utils/SuiClientUtils";
import { metaSettle, simulateSwapTx } from "../common";
import { MetaAgError, MetaAgErrorCode } from "../error";

const API = "https://web3.okx.com";
const SWAP_PATH = "/api/v6/dex/aggregator/swap";
const CHAIN_ID = "784";
const NORMALIZED_SUI_TYPE = normalizeStructTag(SUI_TYPE);
export class OkxProvider implements QuoteProvider, SwapAPIProvider {
  readonly kind = EProvider.OKX;
  constructor(
    private readonly options: OkxProviderOptions,
    private readonly metaOptions: Required<MetaAgOptions>,
    private readonly client: SuiClient,
  ) {}

  async quote({
    amountIn,
    coinTypeIn,
    coinTypeOut,
    signer,
  }: MetaQuoteOptions): Promise<MetaQuote | null> {
    if (!signer || isSystemAddress(signer)) return null;
    const request: OkxSwapRequest = {
      chainIndex: CHAIN_ID,
      amount: amountIn,
      fromTokenAddress:
        coinTypeIn === NORMALIZED_SUI_TYPE ? SUI_TYPE : coinTypeIn,
      toTokenAddress:
        coinTypeOut === NORMALIZED_SUI_TYPE ? SUI_TYPE : coinTypeOut,
      slippagePercent: (this.metaOptions.slippageBps / 100).toString(),
      userWalletAddress: signer,
    };
    const queryString = "?" + new URLSearchParams(request as any).toString();
    const url = `${this.options.api ?? API}${SWAP_PATH}${queryString}`;
    const response = await fetch(url, {
      headers: await getHeaders(this.options, "GET", SWAP_PATH, queryString),
    });
    const quote = (await response.json()) as OkxSwapResponse;
    MetaAgError.assert(
      quote.code === "0" && quote.data.length > 0,
      "No quote found",
      MetaAgErrorCode.QUOTE_NOT_FOUND,
      { provider: this.kind },
    );
    return {
      id: v4(),
      provider: this.kind,
      coinTypeIn,
      coinTypeOut,
      amountIn,
      amountOut: quote.data[0].routerResult.toTokenAmount,
      rawAmountOut: quote.data[0].routerResult.toTokenAmount,
      quote: quote.data[0],
    };
  }

  async fastSwap(options: MetaFastSwapOptions): Promise<string> {
    const { quote, signer, signTransaction } = options;
    MetaAgError.assert(
      quote.provider === EProvider.OKX,
      "Invalid quote",
      MetaAgErrorCode.INVALID_QUOTE,
      { quote, expectedProvider: EProvider.OKX },
    );
    const { tx, coin } = buildTx({ quote, signer });
    tx.add(
      metaSettle(
        quote,
        coin,
        this.metaOptions.slippageBps,
        this.metaOptions.tipBps,
        this.metaOptions.partner,
        this.metaOptions.partnerCommissionBps,
      ),
    );
    tx.transferObjects([coin], signer);
    const txBytes = await tx.build({ client: this.client });
    const { bytes, signature } = await signTransaction(toBase64(txBytes));
    const res = await this.client.executeTransactionBlock({
      signature,
      transactionBlock: bytes,
    });
    return res.digest;
  }
}

async function generateHmacSha256(message: string, secretKey: string) {
  const encoder = new TextEncoder();
  const encodeBase64 = (bytes: Uint8Array) => {
    if (typeof Buffer !== "undefined") {
      return Buffer.from(bytes).toString("base64");
    }
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    if (typeof btoa !== "undefined") {
      return btoa(binary);
    }
    throw new MetaAgError("Base64 encoder not available in this environment");
  };

  if (typeof globalThis !== "undefined" && globalThis.crypto?.subtle) {
    const key = await globalThis.crypto.subtle.importKey(
      "raw",
      encoder.encode(secretKey),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signature = await globalThis.crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(message),
    );
    return encodeBase64(new Uint8Array(signature));
  }

  const { createHmac } = await import("node:crypto");
  return createHmac("sha256", secretKey).update(message).digest("base64");
}

async function getHeaders(
  options: OkxProviderOptions,
  method: string,
  requestPath: string,
  queryString = "",
) {
  const { apiKey, secretKey, apiPassphrase, projectId } = options;
  if (!apiKey || !secretKey || !apiPassphrase || !projectId) {
    throw new MetaAgError("Missing required environment variables");
  }

  const timestamp = new Date().toISOString();
  const stringToSign = timestamp + method + requestPath + queryString;
  return {
    "Content-Type": "application/json",
    "OK-ACCESS-KEY": apiKey,
    "OK-ACCESS-SIGN": await generateHmacSha256(stringToSign, secretKey),
    "OK-ACCESS-TIMESTAMP": timestamp,
    "OK-ACCESS-PASSPHRASE": apiPassphrase,
    "OK-ACCESS-PROJECT": projectId,
  };
}

const replaceFinalizeCommand = (
  tx: Transaction,
  packageId: string,
): { tx: Transaction; coin: TransactionObjectArgument } => {
  const builder = TransactionDataBuilder.restore(tx.getData());
  const i = builder.commands.findIndex(
    (cmd) =>
      cmd.$kind === "MoveCall" &&
      normalizeSuiAddress(cmd.MoveCall.package) ===
        normalizeSuiAddress(packageId) &&
      cmd.MoveCall.module === "router" &&
      cmd.MoveCall.function === "finalize",
  );

  const cmd = builder.commands[i];
  MetaAgError.assert(
    cmd.MoveCall,
    "OKX: Finalize command not found",
    MetaAgErrorCode.OKX_FINALIZE_COMMAND_NOT_FOUND,
    { packageId },
  );
  builder.replaceCommand(
    i,
    Commands.MoveCall({
      package: packageId,
      module: "router",
      function: "finalize_without_transfer",
      typeArguments: cmd.MoveCall.typeArguments,
      arguments: [
        cmd.MoveCall.arguments[0],
        cmd.MoveCall.arguments[5],
        cmd.MoveCall.arguments[6],
      ],
    }),
  );
  const tx2 = Transaction.from(builder.build());
  return { tx: tx2, coin: { NestedResult: [i, 0] } };
};

const buildTx = (options: Omit<MetaSwapOptions, "coinIn" | "tx">) => {
  const { quote, signer } = options;
  MetaAgError.assert(
    quote.provider === EProvider.OKX,
    "Invalid quote",
    MetaAgErrorCode.INVALID_QUOTE,
    { quote, expectedProvider: EProvider.OKX },
  );
  const tx = Transaction.from(quote.quote.tx.data);
  tx.setSenderIfNotSet(signer);
  const { tx: tx2, coin } = replaceFinalizeCommand(tx, quote.quote.tx.to);

  return { tx: tx2, coin };
};

export const simulateOKXSwap = async <
  T extends MetaQuote & { provider: EProvider.OKX },
>(
  quote: T,
  inspector: SuiClientUtils,
  simulation: MetaSimulationOptions,
  metaOptions: Required<MetaAgOptions>,
) => {
  const { tx, coin } = buildTx({ quote, signer: quote.quote.tx.from });
  tx.add(
    metaSettle(
      quote,
      coin,
      10000,
      metaOptions.tipBps,
      metaOptions.partner,
      metaOptions.partnerCommissionBps,
    ),
  );
  tx.transferObjects([coin], quote.quote.tx.from);
  const res = await simulateSwapTx(tx, inspector, simulation);
  return {
    id: quote.id,
    provider: quote.provider,
    ...res,
  };
};
