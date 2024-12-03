import { FlowXContract } from "./flowx";
import { AfterMathContract } from "./aftermath";
import { CetusContract } from "./cetus";
import { DeepBookContract } from "./deepbook";
import { KriyaContract } from "./kriya";
import { TurbosContract } from "./turbos";
import { SuiswapContract } from "./suiswap";
import { BluemoveContract } from "./bluemove";
import { KriyaV3Contract } from "./kriyaV3";
import { SponsoredDeepBookV3Contract } from "./deepbookV3/sponsored";
import { BluefinContract } from "./bluefin";
import { SpringSuiContract } from "./springsui";
import { ObricContract } from "./obric";

export const ProtocolContract = {
  cetus: CetusContract,
  turbos: TurbosContract,
  bluemove: BluemoveContract,
  kriya: KriyaContract,
  suiswap: SuiswapContract,
  aftermath: AfterMathContract,
  deepbook: DeepBookContract,
  deepbook_v3: SponsoredDeepBookV3Contract,
  flowx: FlowXContract,
  kriya_v3: KriyaV3Contract,
  bluefin: BluefinContract,
  springsui: SpringSuiContract,
  obric: ObricContract,
};
