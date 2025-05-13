export class BluefinXTx {
  quoteId: string;
  txBytes: string;
  constructor(quoteId: string, txBytes: string) {
    this.quoteId = quoteId;
    this.txBytes = txBytes;
  }
}

export type SwapResponse = {
  approved: boolean;
  executed: boolean;
  txDigest: string;
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
