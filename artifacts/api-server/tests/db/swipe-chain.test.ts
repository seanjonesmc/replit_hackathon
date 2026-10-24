import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { AuthorizeConfirmation, ChainClient, WriteConfirmation } from "@workspace/chain";
import { memberChainId } from "@workspace/chain";
import {
  authorizationsTable,
  bucketsTable,
  cardsTable,
  db,
  membersTable,
  merchantsTable,
  pool,
  type Authorization,
} from "@workspace/db";
import { seedSpendingDemo, type SwipeInput } from "../../src/services/decisions";
import { captureOnChain, handOffToChain } from "../../src/services/decisions/chain-handoff";
import { decideSwipe, loadSwipeContext, recordDecision } from "../../src/services/decisions/swipes";
import type { BackgroundSubmitDeps } from "../../src/services/events";
import { seedDemoFamily } from "../../src/services/family";
import { resetTestDatabase } from "./test-database";

/**
 * The chain hand-off against the test database, with a fake chain client
 * standing in for Monad: `authorize` after a stored swipe, `capture` at
 * settlement (waiting for an authorize still in flight), and chain failures
 * that never change a decision or a balance.
 */

const ADDRESS = "0x0b7d36cdb2af14db03ae947bb845d8bdf4aa9e17";
let txCounter = 0;
const nextHash = () => `0x${(++txCounter).toString(16).padStart(64, "0")}`;

function confirmed<T extends object>(method: string, txHash: string, ids: T): WriteConfirmation<T> {
  return {
    method,
    txHash,
    explorerUrl: `https://explorer.example/tx/${txHash}`,
    blockNumber: 100 + txCounter,
    confirmedAt: new Date("2026-10-24T18:00:00Z"),
    confirmationMs: 900,
    gasUsed: 1n,
    ids,
    events: [],
  };
}

interface AuthorizeCall {
  cardId: bigint;
  merchantId: string;
  bucketId: bigint;
  amount: number;
  engineDecision: string;
  reasonCode: string;
}

function fakeChain(options: { failAuthorize?: boolean; chainStatus?: string } = {}) {
  const authorizes: AuthorizeCall[] = [];
  const captures: bigint[] = [];
  let release: () => void = () => undefined;
  /** Holds every authorize's confirmation until `mine()` is called. */
  let mined: Promise<void> = Promise.resolve();
  const client = {
    getCounts: async () => ({ buckets: 4n, contributions: 4n, cards: 1n, authorizations: 0n }),
    getBucket: async (id: bigint) => ({ name: ["Food", "School", "Social", "Transit"][Number(id) - 1]! }),
    getCard: async () => ({ dependentId: memberChainId("dependent"), last4: dependentLast4 }),
    getAuthorization: async () => ({ status: options.chainStatus ?? "approved" }),
    authorize: async (p: AuthorizeCall) => {
      authorizes.push(p);
      const txHash = nextHash();
      const confirmation = mined.then((): AuthorizeConfirmation => {
        if (options.failAuthorize) throw new Error("execution reverted");
        return {
          ...confirmed("authorize", txHash, { authorizationId: BigInt(authorizes.length) }),
          authorization: { status: "approved", reasonCode: "approved", reason: "ok" },
        };
      });
      confirmation.catch(() => undefined);
      return { txHash, confirmation };
    },
    capture: async (p: { authorizationId: bigint }) => {
      captures.push(p.authorizationId);
      const txHash = nextHash();
      return { txHash, confirmation: Promise.resolve(confirmed("capture", txHash, {})) };
    },
  };
  const deps: BackgroundSubmitDeps = {
    isConfigured: () => true,
    getClient: () => client as unknown as ChainClient,
    executor: db,
    log: { info: () => undefined, warn: () => undefined, error: () => undefined },
  };
  return {
    authorizes,
    captures,
    deps,
    /** Delays confirmations until `mine()`. */
    holdBlocks() {
      mined = new Promise((resolve) => (release = resolve));
    },
    mine: () => release(),
  };
}

let dependentLast4 = "";
let swipe: (merchant: string | null, amount: number, time?: string) => SwipeInput;

beforeEach(async () => {
  await resetTestDatabase();
  await seedDemoFamily();
  await seedSpendingDemo();
  const [dependent] = await db.select().from(membersTable).where(eq(membersTable.role, "dependent"));
  const [card] = await db.select().from(cardsTable).where(eq(cardsTable.dependentMemberId, dependent!.id));
  dependentLast4 = card!.last4;
  const merchants = new Map((await db.select().from(merchantsTable)).map((m) => [m.slug, m]));
  swipe = (slug, amount, time = "14:30") => {
    const merchant = slug ? merchants.get(slug)! : null;
    return {
      cardId: card!.id,
      dependentId: dependent!.id,
      merchantId: merchant?.id ?? null,
      merchantName: merchant?.name ?? "Corner Pet Shop",
      mcc: merchant?.mcc ?? "5995",
      merchantCategory: merchant?.category ?? "pet supplies",
      items: ["test purchase"],
      amount,
      location: "Test location",
      timestamp: `2026-10-23T${time}:00`,
    };
  };
});

afterAll(() => pool.end());

/** Stores a swipe the way the engine does, without its own (real) hand-off. */
async function store(input: SwipeInput): Promise<Authorization> {
  const ctx = await loadSwipeContext(input);
  return recordDecision(ctx, await decideSwipe(ctx, null));
}

async function row(id: number) {
  const [a] = await db.select().from(authorizationsTable).where(eq(authorizationsTable.id, id));
  return a!;
}

async function foodBalances() {
  const [food] = await db.select().from(bucketsTable).where(eq(bucketsTable.name, "Food"));
  return { available: food!.availableCents, held: food!.heldCents, spent: food!.spentCents };
}

describe("authorize after a swipe", () => {
  it("sends an approval with the chain's card, bucket and merchant IDs and stores the contract's id", async () => {
    const chain = fakeChain();
    const stored = await store(swipe("trader-joes", 18_40));
    const [merchant] = await db.select().from(merchantsTable).where(eq(merchantsTable.slug, "trader-joes"));

    const outcome = await handOffToChain(stored, chain.deps);

    expect(outcome.status).toBe("confirmed");
    expect(chain.authorizes).toEqual([
      expect.objectContaining({
        cardId: 1n,
        merchantId: merchant!.onchainId,
        bucketId: 1n,
        amount: 18_40,
        engineDecision: "approve",
        reasonCode: "approved",
      }),
    ]);
    expect(await row(stored.id)).toMatchObject({ chainStatus: "confirmed", onchainAuthorizationId: 1 });
  });

  it("mirrors a decline too, with the engine's reason code", async () => {
    const chain = fakeChain();
    const stored = await store(swipe("liquor-barn", 15_00));
    await handOffToChain(stored, chain.deps);
    expect(chain.authorizes[0]).toMatchObject({ engineDecision: "reject", reasonCode: "blocked_category" });
  });

  it("leaves a custom merchant's swipe off chain, since the chain doesn't know it", async () => {
    const chain = fakeChain();
    const stored = await store(swipe(null, 18_00));
    const outcome = await handOffToChain(stored, chain.deps);
    expect(outcome.status).toBe("skipped");
    expect(chain.authorizes).toHaveLength(0);
    expect((await row(stored.id)).chainStatus).toBe("not_submitted");
  });

  it("marks a failed authorize without changing the decision or the hold", async () => {
    const chain = fakeChain({ failAuthorize: true });
    const stored = await store(swipe("trader-joes", 18_40));
    const balances = await foodBalances();

    await handOffToChain(stored, chain.deps);

    expect(await row(stored.id)).toMatchObject({ decision: "APPROVED", status: "approved", chainStatus: "failed" });
    expect(await foodBalances()).toEqual(balances);
  });
});

describe("capture at settlement", () => {
  it("waits for an authorize still being mined, then captures the contract's authorization", async () => {
    const chain = fakeChain();
    chain.holdBlocks();
    const stored = await store(swipe("trader-joes", 18_40));

    const authorizing = handOffToChain(stored, chain.deps);
    const capturing = captureOnChain(stored.id, chain.deps);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(chain.captures).toHaveLength(0);

    chain.mine();
    await authorizing;
    expect((await capturing).status).toBe("confirmed");
    expect(chain.captures).toEqual([1n]);
    expect(await row(stored.id)).toMatchObject({ captureChainStatus: "confirmed" });
    expect((await row(stored.id)).captureChainTxHash).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it("marks the capture failed, sending nothing, when the authorize failed", async () => {
    const chain = fakeChain({ failAuthorize: true });
    const stored = await store(swipe("trader-joes", 18_40));
    await handOffToChain(stored, chain.deps);

    const outcome = await captureOnChain(stored.id, chain.deps);

    expect(outcome.status).toBe("failed");
    expect(chain.captures).toHaveLength(0);
    expect((await row(stored.id)).captureChainStatus).toBe("failed");
  });

  it("refuses to capture when the chain didn't approve the authorization", async () => {
    const chain = fakeChain({ chainStatus: "pending" });
    const stored = await store(swipe("trader-joes", 18_40));
    await handOffToChain(stored, chain.deps);

    expect((await captureOnChain(stored.id, chain.deps)).status).toBe("failed");
    expect(chain.captures).toHaveLength(0);
  });

  it("sends nothing when the authorize was never sent", async () => {
    const chain = fakeChain();
    const stored = await store(swipe(null, 18_00));
    expect((await captureOnChain(stored.id, chain.deps)).status).toBe("skipped");
    expect((await row(stored.id)).captureChainStatus).toBe("not_submitted");
  });
});
