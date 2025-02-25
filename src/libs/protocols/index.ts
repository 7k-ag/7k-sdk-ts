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
import { StSuiContract } from "./stsui";
import { FlowxV3Contract } from "./flowxV3";
import { SteammContract } from "./steamm";
import { MagmaContract } from "./magma";

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
  flowx_v3: FlowxV3Contract,
  kriya_v3: KriyaV3Contract,
  bluefin: BluefinContract,
  springsui: SpringSuiContract,
  obric: ObricContract,
  stsui: StSuiContract,
  steamm: SteammContract,
  magma: MagmaContract,
};
