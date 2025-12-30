import { DevInspectResults } from "@mysten/sui/client";
import { EProvider, MetaQuote, MetaQuoteOptions } from "../../types/metaAg";

export enum MetaAgErrorCode {
  UNKNOWN = 1000,
  TIMEOUT = 1001,
  PROVIDER_NOT_FOUND = 1002,
  PROVIDER_NOT_SUPPORTED = 1003,
  INVALID_QUOTE = 1004,
  QUOTE_NOT_FOUND = 1005,
  INVALID_SIGNER_ADDRESS = 1006,
  PROVIDER_NOT_SUPPORT_SWAP = 1007,
  SIMULATION_FAILED = 1008,
  // OKX error
  OKX_FINALIZE_COMMAND_NOT_FOUND = 1100,
}

export type MetaAgErrorDetailsMap = {
  [MetaAgErrorCode.UNKNOWN]: any;
  [MetaAgErrorCode.TIMEOUT]: { timeout: number };
  [MetaAgErrorCode.PROVIDER_NOT_FOUND]: { provider: EProvider };
  [MetaAgErrorCode.PROVIDER_NOT_SUPPORTED]: { provider: EProvider };
  [MetaAgErrorCode.INVALID_QUOTE]: {
    quote: MetaQuote;
    expectedProvider: EProvider;
  };
  [MetaAgErrorCode.QUOTE_NOT_FOUND]: {
    provider: EProvider;
    quoteOptions?: MetaQuoteOptions;
  };
  [MetaAgErrorCode.INVALID_SIGNER_ADDRESS]: { signer: string };
  [MetaAgErrorCode.PROVIDER_NOT_SUPPORT_SWAP]: { provider: EProvider };
  [MetaAgErrorCode.SIMULATION_FAILED]: { error: DevInspectResults["error"] };
  // OKX error
  [MetaAgErrorCode.OKX_FINALIZE_COMMAND_NOT_FOUND]: { packageId: string };
};

export type MetaAgErrorDetails<T extends MetaAgErrorCode> =
  T extends keyof MetaAgErrorDetailsMap ? MetaAgErrorDetailsMap[T] : never;

export class MetaAgError<T extends MetaAgErrorCode> extends Error {
  code: T;
  details?: MetaAgErrorDetails<T>;
  constructor(message: string, code?: T, details?: MetaAgErrorDetails<T>) {
    super(message);
    this.name = "MetaAgError";
    this.code = code ?? (MetaAgErrorCode.UNKNOWN as T);
    this.details = details;
  }

  static assert<T extends MetaAgErrorCode>(
    condition: any,
    message?: string | null,
    code?: T,
    details?: MetaAgErrorDetails<T>,
  ): asserts condition {
    if (!condition) {
      throw new MetaAgError(message ?? "Assertion failed", code, details);
    }
  }
}
