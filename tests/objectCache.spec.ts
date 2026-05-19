import { bcs } from "@mysten/sui/bcs";
import { expect } from "chai";
import "mocha";

import {
  CustomObjectCache,
  InMemoryObjectCache,
  ObjectCacheEntry,
} from "../src/utils/ObjectCache";

/**
 * Targets the v2 migration of `CustomObjectCache`:
 *
 *  1. `applyEffects` must read `effects.V2.changedObjects` and map the new
 *     `outputState.ObjectWrite` / `outputState.NotExist` enum variants onto
 *     the cache (BCS shape, not legacy JSON-RPC).
 *  2. `applyEffects` must throw on a non-V2 effects payload (V1 unsupported).
 *
 * Fixtures are BCS-round-tripped so they exactly match the runtime shape
 * the production code consumes. No network calls.
 */

const ZERO_DIGEST = "11111111111111111111111111111111";
const addr = (c: string) => "0x" + c.repeat(64);

interface RoundTripOptions {
  changedObjects: Array<{
    id: string;
    output:
      | { kind: "NotExist" }
      | {
          kind: "ObjectWrite";
          digest: string;
          owner:
            | { kind: "AddressOwner"; address: string }
            | { kind: "ObjectOwner"; address: string }
            | { kind: "Shared"; initialSharedVersion: string }
            | { kind: "Immutable" };
        };
  }>;
  lamportVersion?: string;
}

const buildEffectsV2 = (opts: RoundTripOptions) => {
  type OwnerSpec = Extract<
    RoundTripOptions["changedObjects"][number]["output"],
    { kind: "ObjectWrite" }
  >["owner"];

  const mapOwner = (o: OwnerSpec) => {
    switch (o.kind) {
      case "AddressOwner":
        return { $kind: "AddressOwner" as const, AddressOwner: o.address };
      case "ObjectOwner":
        return { $kind: "ObjectOwner" as const, ObjectOwner: o.address };
      case "Shared":
        return {
          $kind: "Shared" as const,
          Shared: { initialSharedVersion: o.initialSharedVersion },
        };
      case "Immutable":
        return { $kind: "Immutable" as const, Immutable: true };
    }
  };

  const effects = {
    $kind: "V2" as const,
    V2: {
      status: { $kind: "Success" as const, Success: true },
      executedEpoch: "0",
      gasUsed: {
        computationCost: "100",
        storageCost: "200",
        storageRebate: "50",
        nonRefundableStorageFee: "0",
      },
      transactionDigest: ZERO_DIGEST,
      gasObjectIndex: 0,
      eventsDigest: null,
      dependencies: [],
      lamportVersion: opts.lamportVersion ?? "100",
      changedObjects: opts.changedObjects.map((c) => {
        const outputState =
          c.output.kind === "NotExist"
            ? { $kind: "NotExist" as const, NotExist: true }
            : {
                $kind: "ObjectWrite" as const,
                ObjectWrite: [c.output.digest, mapOwner(c.output.owner)] as [
                  string,
                  ReturnType<typeof mapOwner>,
                ],
              };
        return [
          c.id,
          {
            inputState: { $kind: "NotExist" as const, NotExist: true },
            outputState,
            idOperation: { $kind: "Created" as const, Created: true },
          },
        ] as const;
      }),
      unchangedConsensusObjects: [],
      auxDataDigest: null,
    },
  };

  const bytes = bcs.TransactionEffects.serialize(effects).toBytes();
  return bcs.TransactionEffects.parse(bytes);
};

const makeCache = () => {
  const inner = new InMemoryObjectCache();
  // applyEffects-driven tests never touch the gRPC client; a Proxy that
  // throws on access makes any accidental dependency observable.
  const client = new Proxy(
    {},
    {
      get: () => {
        throw new Error(
          "client was not expected to be touched in this code path",
        );
      },
    },
  ) as unknown as ConstructorParameters<typeof CustomObjectCache>[0]["client"];
  const cache = new CustomObjectCache({ cache: inner, client });
  return { cache, inner };
};

describe("CustomObjectCache.applyEffects (v2 effects mapping)", () => {
  it("adds AddressOwner ObjectWrites to the OwnedObject cache with the correct version/digest/owner", async () => {
    const { cache, inner } = makeCache();
    const objectId = addr("a");
    const ownerAddr = addr("1");
    const effects = buildEffectsV2({
      changedObjects: [
        {
          id: objectId,
          output: {
            kind: "ObjectWrite",
            digest: ZERO_DIGEST,
            owner: { kind: "AddressOwner", address: ownerAddr },
          },
        },
      ],
      lamportVersion: "42",
    });

    await cache.applyEffects(effects);

    const cached = await inner.getObject(objectId);
    expect(cached).to.not.equal(null);
    const entry = cached as ObjectCacheEntry;
    expect(entry.objectId).to.equal(objectId);
    expect(entry.version).to.equal("42");
    expect(entry.digest).to.equal(ZERO_DIGEST);
    expect(entry.owner).to.equal(ownerAddr);
    expect(entry.initialSharedVersion).to.equal(null);
  });

  it("stores Shared ObjectWrites in the SharedOrImmutable cache and surfaces initialSharedVersion", async () => {
    const { cache, inner } = makeCache();
    const objectId = addr("b");
    const effects = buildEffectsV2({
      changedObjects: [
        {
          id: objectId,
          output: {
            kind: "ObjectWrite",
            digest: ZERO_DIGEST,
            owner: { kind: "Shared", initialSharedVersion: "7" },
          },
        },
      ],
      lamportVersion: "100",
    });

    await cache.applyEffects(effects);
    const cached = (await inner.getObject(objectId)) as ObjectCacheEntry;
    expect(cached.owner).to.equal(null);
    expect(cached.initialSharedVersion).to.equal("7");
  });

  it("deletes objects whose outputState is NotExist", async () => {
    const { cache, inner } = makeCache();
    const objectId = addr("c");

    await inner.addObject({
      objectId,
      version: "1",
      digest: ZERO_DIGEST,
      owner: addr("1"),
      initialSharedVersion: null,
    });
    expect(await inner.getObject(objectId)).to.not.equal(null);

    const effects = buildEffectsV2({
      changedObjects: [{ id: objectId, output: { kind: "NotExist" } }],
    });

    await cache.applyEffects(effects);
    expect(await inner.getObject(objectId)).to.equal(null);
  });

  it("throws on non-V2 effects (V1 is intentionally unsupported)", async () => {
    const { cache } = makeCache();
    const v1Like = {
      $kind: "V1",
      V1: { status: { Success: true } },
    } as unknown as Parameters<typeof cache.applyEffects>[0];

    let threw = false;
    try {
      await cache.applyEffects(v1Like);
    } catch (err) {
      threw = true;
      expect(err).to.be.instanceOf(Error);
      expect((err as Error).message).to.match(
        /Unsupported transaction effects/,
      );
    }
    expect(threw, "applyEffects must throw on non-V2 input").to.equal(true);
  });
});
