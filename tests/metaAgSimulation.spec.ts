import { Transaction } from "@mysten/sui/transactions";
import { expect } from "chai";
import "mocha";

import { _7K_META_PACKAGE_ID } from "../src/constants/_7k";
import { simulateSwapTx } from "../src/features/metaAg/common";
import { MetaAgError, MetaAgErrorCode } from "../src/features/metaAg/error";
import type {
  SimulateTransactionInput,
  SimulateTransactionResult,
} from "../src/utils/SuiClientUtils";
import { SuiClientUtils } from "../src/utils/SuiClientUtils";

/**
 * `common.ts::simulateSwapTx` is the central reader of the v2 gRPC
 * simulation response. It must:
 *
 *  - Treat `result.Transaction` as success-path (when effects.status.success).
 *  - Surface `effects.status.success === false` as a `MetaAgError` with code
 *    `SIMULATION_FAILED`.
 *  - Fall back to `result.FailedTransaction` when `Transaction` is absent.
 *  - Read `event.eventType` and `event.json.amount_out` (renamed fields).
 *  - Throw `SIMULATION_FAILED` when neither variant is present.
 *
 * We stub the inspector instead of hitting the network.
 */

type SimulateFn = (
  params: SimulateTransactionInput,
) => Promise<SimulateTransactionResult>;

const stubInspector = (fn: SimulateFn): SuiClientUtils => {
  // Replace just the public method used by `simulateSwapTx`. We don't need
  // the gRPC client field for these unit tests.
  return { simulateTransaction: fn } as unknown as SuiClientUtils;
};

const sender = "0x" + "1".repeat(64);

const successResult = (amountOut: string): SimulateTransactionResult =>
  ({
    $kind: "Transaction",
    Transaction: {
      effects: {
        status: { success: true, error: null },
        gasUsed: {
          computationCost: "1",
          storageCost: "2",
          storageRebate: "3",
          nonRefundableStorageFee: "0",
        },
      },
      events: [
        {
          eventType: `${_7K_META_PACKAGE_ID}::settle::Swap`,
          json: { amount_out: amountOut },
        },
        {
          eventType: "0xdeadbeef::other::Event",
          json: { amount_out: "999" },
        },
      ],
      commandResults: [],
    },
  }) as unknown as SimulateTransactionResult;

const failedStatusResult = (msg: string): SimulateTransactionResult =>
  ({
    $kind: "Transaction",
    Transaction: {
      effects: {
        status: { success: false, error: { message: msg } },
        gasUsed: {
          computationCost: "1",
          storageCost: "2",
          storageRebate: "0",
          nonRefundableStorageFee: "0",
        },
      },
      events: [],
      commandResults: [],
    },
  }) as unknown as SimulateTransactionResult;

const failedTransactionResult = (msg: string): SimulateTransactionResult =>
  // FailedTransaction implies status.success === false on the real gRPC
  // contract; the production code path picks up FailedTransaction via the
  // `??` fallback and then surfaces the failure via `MetaAgError`.
  ({
    $kind: "FailedTransaction",
    FailedTransaction: {
      effects: {
        status: { success: false, error: { message: msg } },
        gasUsed: {
          computationCost: "1",
          storageCost: "2",
          storageRebate: "0",
          nonRefundableStorageFee: "0",
        },
      },
      events: [],
      commandResults: [],
    },
  }) as unknown as SimulateTransactionResult;

const emptyResult = (): SimulateTransactionResult =>
  // Both Transaction and FailedTransaction undefined to exercise the
  // `if (!result)` guard.
  ({ $kind: "Transaction" }) as unknown as SimulateTransactionResult;

describe("simulateSwapTx (v2 simulation result reader)", () => {
  it("returns simulatedAmountOut from the `Transaction` variant on success", async () => {
    const inspector = stubInspector(async () => successResult("12345"));
    const out = await simulateSwapTx(new Transaction(), inspector, { sender });
    expect(out.simulatedAmountOut).to.equal("12345");
    expect(out.gasUsed).to.deep.equal({
      computationCost: "1",
      storageCost: "2",
      storageRebate: "3",
      nonRefundableStorageFee: "0",
    });
  });

  it("throws MetaAgError(SIMULATION_FAILED) when effects.status.success === false", async () => {
    const inspector = stubInspector(async () =>
      failedStatusResult("MoveAbort 42"),
    );

    let caught: unknown;
    try {
      await simulateSwapTx(new Transaction(), inspector, { sender });
    } catch (err) {
      caught = err;
    }
    expect(caught).to.be.instanceOf(MetaAgError);
    const e = caught as MetaAgError<typeof MetaAgErrorCode.SIMULATION_FAILED>;
    expect(e.code).to.equal(MetaAgErrorCode.SIMULATION_FAILED);
    expect(e.message).to.equal("MoveAbort 42");
    expect(e.details?.error).to.equal("MoveAbort 42");
  });

  it("falls back to `FailedTransaction` variant when `Transaction` is absent and surfaces SIMULATION_FAILED", async () => {
    // The real gRPC contract returns FailedTransaction only when
    // status.success === false, so the fallback path must surface the failure.
    const inspector = stubInspector(async () =>
      failedTransactionResult("Insufficient balance"),
    );

    let caught: unknown;
    try {
      await simulateSwapTx(new Transaction(), inspector, { sender });
    } catch (err) {
      caught = err;
    }
    expect(caught).to.be.instanceOf(MetaAgError);
    const e = caught as MetaAgError<typeof MetaAgErrorCode.SIMULATION_FAILED>;
    expect(e.code).to.equal(MetaAgErrorCode.SIMULATION_FAILED);
    expect(e.message).to.equal("Insufficient balance");
  });

  it("throws MetaAgError(SIMULATION_FAILED) when both variants are missing", async () => {
    const inspector = stubInspector(async () => emptyResult());

    let caught: unknown;
    try {
      await simulateSwapTx(new Transaction(), inspector, { sender });
    } catch (err) {
      caught = err;
    }
    expect(caught).to.be.instanceOf(MetaAgError);
    const e = caught as MetaAgError<typeof MetaAgErrorCode.SIMULATION_FAILED>;
    expect(e.code).to.equal(MetaAgErrorCode.SIMULATION_FAILED);
    expect(e.message).to.equal("Simulation failed");
  });

  it("matches Swap events by `eventType` (v2 rename of legacy `type`) and reads json.amount_out", async () => {
    // Only the v2 `eventType` field is set. If production code mistakenly
    // looked at legacy `type`, the match would miss and amountOut would be
    // undefined.
    const result = {
      $kind: "Transaction",
      Transaction: {
        effects: {
          status: { success: true, error: null },
          gasUsed: {
            computationCost: "0",
            storageCost: "0",
            storageRebate: "0",
            nonRefundableStorageFee: "0",
          },
        },
        events: [
          {
            eventType: `${_7K_META_PACKAGE_ID}::settle::Swap`,
            json: { amount_out: "424242" },
          },
        ],
        commandResults: [],
      },
    } as unknown as SimulateTransactionResult;

    const inspector = stubInspector(async () => result);
    const out = await simulateSwapTx(new Transaction(), inspector, { sender });
    expect(out.simulatedAmountOut).to.equal("424242");
  });
});
