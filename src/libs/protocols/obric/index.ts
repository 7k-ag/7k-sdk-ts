import { Transaction } from "@mysten/sui/transactions";
import { SUI_CLOCK_OBJECT_ID, toHex } from "@mysten/sui/utils";
import { ExtraOracle } from "../../../types/aggregator";
import { BaseContract } from "../base";

type ObricExtra = {
  oracles: ExtraOracle[];
};
export class ObricContract extends BaseContract<ObricExtra> {
  async swap(tx: Transaction) {
    const [coinX, coinY] = this.swapInfo.pool.allTokens;
    const xToY = this.swapInfo.swapXtoY;

    const oracleX = this.extra.oracles[0].Pyth?.bytes;
    const oracleY = this.extra.oracles[1].Pyth?.bytes;
    if (!oracleX || !oracleY) {
      throw new Error(`Invalid oracle info for swap`);
    }

    const { package: PACKAGE_ID, pythState: PYTH_STATE } = this.config.obric;
    const [coinOut] = tx.moveCall({
      target: `${PACKAGE_ID}::v2::${xToY ? "swap_x_to_y" : "swap_y_to_x"}`,
      typeArguments: [coinX.address, coinY.address],
      arguments: [
        tx.object(this.swapInfo.poolId),
        tx.object(SUI_CLOCK_OBJECT_ID),
        tx.object(PYTH_STATE),
        tx.object(this.pythMap["0x" + toHex(Uint8Array.from(oracleX))]), // pyth pricefeed for x
        tx.object(this.pythMap["0x" + toHex(Uint8Array.from(oracleY))]), // pyth pricefeed for y
        this.inputCoinObject,
      ],
    });

    return coinOut;
  }
}
