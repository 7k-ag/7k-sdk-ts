import { Transaction } from "@mysten/sui/transactions";
import { BaseContract } from "../base";
import { SuiUtils } from "../../../utils/sui";

const PACKAGE_ID =
  "0xb24b6789e088b876afabca733bed2299fbc9e2d6369be4d1acfa17d8145454d9";
const DEX_INFO_ID =
  "0x3f2d9f724f4a1ce5e71676448dc452be9a6243dac9c5b975a588c8c867066e92";

export class BluemoveContract extends BaseContract {
  async swap(tx: Transaction) {
    const [coinOut] = tx.moveCall({
      target: `${PACKAGE_ID}::router::swap_exact_input_`,
      typeArguments: [this.swapInfo.assetIn, this.swapInfo.assetOut],
      arguments: [
        SuiUtils.getCoinValue(
          this.swapInfo.swapXtoY
            ? this.swapInfo.coinX.type
            : this.swapInfo.coinY.type,
          this.inputCoinObject,
          tx,
        ), // input amount
        this.inputCoinObject, // input coin
        tx.pure.u64(0), // min output amount
        tx.object(DEX_INFO_ID),
      ],
    });

    return coinOut;
  }
}
