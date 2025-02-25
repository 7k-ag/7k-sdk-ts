import { Transaction } from "@mysten/sui/transactions";

import { BaseContract } from "../base";
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";
import { normalizeTokenType } from "../../../utils/token";

export class KriyaV3Contract extends BaseContract {
  async swap(tx: Transaction) {
    const swapXtoY = this.swapInfo.swapXtoY;
    const coinInType = normalizeTokenType(this.swapInfo.assetIn);
    const coinOutType = normalizeTokenType(this.swapInfo.assetOut);
    const poolId = this.swapInfo.poolId;
    const LowLimitPrice = 4295048017;
    const limitPrice = BigInt("79226673515401279992447579050");

    const { package: PACKAGE_ID, version: VERSION_ID } = this.config.kriya_v3;
    const [receive_a, receive_b, flash_receipt] = tx.moveCall({
      target: `${PACKAGE_ID}::trade::flash_swap`,
      typeArguments: this.getTypeParams(),
      arguments: [
        tx.object(poolId),
        tx.pure.bool(swapXtoY),
        tx.pure.bool(true),
        this.getInputCoinValue(tx),
        tx.pure.u128(swapXtoY ? LowLimitPrice : limitPrice),
        tx.object(SUI_CLOCK_OBJECT_ID),
        tx.object(VERSION_ID),
      ],
    });

    tx.moveCall({
      target: `0x2::balance::destroy_zero`,
      arguments: [swapXtoY ? receive_a : receive_b],
      typeArguments: [coinInType],
    });

    const [zeroOutCoin] = tx.moveCall({
      target: `0x2::balance::zero`,
      arguments: [],
      typeArguments: [coinOutType],
    });

    const inputCoinBalance = tx.moveCall({
      target: `0x2::coin::into_balance`,
      typeArguments: [coinInType],
      arguments: [this.inputCoinObject],
    });

    const pay_coin_a = swapXtoY ? inputCoinBalance : zeroOutCoin;
    const pay_coin_b = swapXtoY ? zeroOutCoin : inputCoinBalance;

    tx.moveCall({
      target: `${PACKAGE_ID}::trade::repay_flash_swap`,
      typeArguments: this.getTypeParams(),
      arguments: [
        tx.object(poolId),
        flash_receipt,
        pay_coin_a,
        pay_coin_b,
        tx.object(VERSION_ID),
      ],
    });

    const [tokenOut] = tx.moveCall({
      target: `0x2::coin::from_balance`,
      typeArguments: [coinOutType],
      arguments: [swapXtoY ? receive_b : receive_a],
    });

    return tokenOut;
  }
}
