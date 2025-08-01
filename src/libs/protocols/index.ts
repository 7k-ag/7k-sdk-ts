import { AfterMathContract } from "./aftermath";
import { BluefinContract } from "./bluefin";
import { BluefinXContract } from "./bluefinx";
import { BluemoveContract } from "./bluemove";
import { CetusContract } from "./cetus";
import { SponsoredDeepBookV3Contract } from "./deepbookV3/sponsored";
import { FlowXContract } from "./flowx";
import { FlowxV3Contract } from "./flowxV3";
import { FullsailContract } from "./fullsail";
import { HaedalPMMContract } from "./haedal_pmm";
import { KriyaContract } from "./kriya";
import { KriyaV3Contract } from "./kriyaV3";
import { MagmaContract } from "./magma";
import { MomentumContract } from "./momentum";
import { ObricContract } from "./obric";
import { SevenKV1 } from "./sevenk";
import { SpringSuiContract } from "./springsui";
import { SteammContract } from "./steamm";
import { StSuiContract } from "./stsui";
import { SuiswapContract } from "./suiswap";
import { TurbosContract } from "./turbos";

export const ProtocolContract = {
  cetus: CetusContract,
  turbos: TurbosContract,
  bluemove: BluemoveContract,
  kriya: KriyaContract,
  suiswap: SuiswapContract,
  aftermath: AfterMathContract,
  deepbook_v3: SponsoredDeepBookV3Contract,
  flowx: FlowXContract,
  flowx_v3: FlowxV3Contract,
  kriya_v3: KriyaV3Contract,
  bluefin: BluefinContract,
  springsui: SpringSuiContract,
  obric: ObricContract,
  stsui: StSuiContract,
  steamm: SteammContract,
  steamm_oracle_quoter: SteammContract,
  steamm_oracle_quoter_v2: SteammContract,
  magma: MagmaContract,
  haedal_pmm: HaedalPMMContract,
  momentum: MomentumContract,
  bluefinx: BluefinXContract,
  sevenk_v1: SevenKV1,
  fullsail: FullsailContract,
};
