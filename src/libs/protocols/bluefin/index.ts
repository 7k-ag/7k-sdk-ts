import { Transaction } from "@mysten/sui/transactions";
import { BaseContract } from "../base";
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";
import { getDefaultSqrtPriceLimit } from "../utils";
import BN from "bn.js";
import { SuiUtils } from "../../../utils/sui";

const PACKAGE_ID =
  "0xbe89d6ecf91fea245164e5e8ed5a6cc8af4e9361b8a9e33dbaf7316af0dc7732";
const CONFIG_ID =
  "0x03db251ba509a8d5d8777b6338836082335d93eecbdd09a11e190a1cff51c352";

export class BluefinContract extends BaseContract {
  async swap(tx: Transaction) {
    const [coinX, coinY] = this.swapInfo.pool.allTokens;
    const swapXtoY = this.swapInfo.swapXtoY;

    const amountIn = this.getInputCoinValue(tx);
    const coinInBalance = SuiUtils.coinIntoBalance(
      tx,
      this.swapInfo.assetIn,
      this.inputCoinObject,
    );
    const coinOutBalance = SuiUtils.zeroBalance(tx, this.swapInfo.assetOut);

    const [balanceOutX, balanceOutY] = tx.moveCall({
      target: `${PACKAGE_ID}::pool::swap`,
      typeArguments: [coinX.address, coinY.address],
      arguments: [
        tx.object(SUI_CLOCK_OBJECT_ID),
        tx.object(CONFIG_ID),
        tx.object(this.swapInfo.poolId),
        swapXtoY ? coinInBalance : coinOutBalance,
        swapXtoY ? coinOutBalance : coinInBalance,
        tx.pure.bool(swapXtoY),
        tx.pure.bool(true),
        amountIn,
        tx.pure.u64(0),
        tx.pure.u128(
          getDefaultSqrtPriceLimit(swapXtoY)
            .add(swapXtoY ? new BN(1) : new BN(-1))
            .toString(10),
        ),
      ],
    });

    const coinOutX = SuiUtils.coinFromBalance(tx, coinX.address, balanceOutX);
    const coinOutY = SuiUtils.coinFromBalance(tx, coinY.address, balanceOutY);
    SuiUtils.transferOrDestroyZeroCoin(
      tx,
      this.swapInfo.assetIn,
      swapXtoY ? coinOutX : coinOutY,
      this.currentAccount,
    );
    return swapXtoY ? coinOutY : coinOutX;
  }
}
