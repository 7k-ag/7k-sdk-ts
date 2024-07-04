export interface SuiscanToken {
  type: string;
  objectId: string;
  name: string;
  supply: number | null;
  supplyInUsd: number | null;
  tokenPrice: number | null;
  dominance: number | null;
  circulatingSupply: number | null;
  marketCap: number | null;
  totalVolume: number | null;
  maxSupply: number | null;
  fdv: number | null;
  holders: number | null;
  denom: string;
  packageId: string;
  createTimestamp: number;
  creator: string;
  creatorName: string | null;
  creatorImg: string | null;
  creatorScamMessage: string | null;
  scamMessage: string | null;
  decimals: number;
  symbol: string;
  iconUrl: string | null;
  description: string;
  bridge: boolean;
  verified: boolean;
}
