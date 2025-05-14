export class BluefinXTx {
  quoteId: string;
  txBytes: string;
  constructor(quoteId: string, txBytes: string) {
    this.quoteId = quoteId;
    this.txBytes = txBytes;
  }
}

/**
 * Response from BluefinX swap
 */
export type SwapResponse = {
  /** Whether the swap is approved */
  approved: boolean;
  /** Whether the swap is executed */
  executed: boolean;
  /** Transaction digest */
  txDigest: string;
  /** Quote ID */
  quoteId: string;
};

export type SponsorRequest = {
  quoteId: string;
  txBytes: string;
  sender: string;
};

type SponsoredTxData = {
  txBytes: string;
  txDigest: string;
};

export type SponsorResponse = {
  success: boolean;
  quoteId: string;
  data: SponsoredTxData;
};
