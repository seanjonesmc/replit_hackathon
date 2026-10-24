import { and, asc, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { cardIssuerAddress } from "@workspace/chain";
import {
  authorizationsTable,
  bucketsTable,
  db,
  settlementsTable,
  type Authorization,
  type DbExecutor,
  type Settlement,
} from "@workspace/db";
import { chainAddressUrl } from "../blockchain";
import { FamilyServiceError, getDemoFamily } from "../family";
import { captureOnChain } from "./chain-handoff";

/**
 * Settlement: the second half of hold-then-settle. An approved swipe only
 * holds its amount; a settlement run (the presenter's demo control) moves
 * every held purchase held → spent, records that the card issuer was repaid
 * and the issuer's (simulated) redemption with the partner bank, and then
 * sends each purchase's `capture` to the chain in the background.
 */

export interface SettlementDetail {
  settlement: Settlement;
  purchases: { authorization: Authorization; bucketName: string | null }[];
  issuerAddress: string;
  issuerExplorerUrl: string;
}

/** Approved purchases still holding money, for a family. */
const heldWhere = (familyId: number) =>
  and(
    eq(authorizationsTable.familyId, familyId),
    eq(authorizationsTable.decision, "APPROVED"),
    isNotNull(authorizationsTable.bucketId),
    isNull(authorizationsTable.settledAt),
  );

/**
 * Settles locked, held purchases inside the caller's transaction: each goes
 * held → spent in its bucket, with its settled and issuer-redeemed times.
 */
async function applySettlement(
  tx: DbExecutor,
  held: Authorization[],
  at: Date,
  settlementId: number | null,
): Promise<void> {
  if (held.length === 0) return;
  await tx
    .update(authorizationsTable)
    .set({ settledAt: at, settlementId, issuerRedeemedAt: at })
    .where(inArray(authorizationsTable.id, held.map((a) => a.id)));

  const byBucket = new Map<number, number>();
  for (const a of held) byBucket.set(a.bucketId!, (byBucket.get(a.bucketId!) ?? 0) + a.amountCents);
  // Lock and update buckets in id order, so concurrent runs never deadlock.
  for (const [bucketId, cents] of [...byBucket].sort(([x], [y]) => x - y)) {
    await tx
      .update(bucketsTable)
      .set({
        heldCents: sql`${bucketsTable.heldCents} - ${cents}`,
        spentCents: sql`${bucketsTable.spentCents} + ${cents}`,
      })
      .where(eq(bucketsTable.id, bucketId));
  }
}

/**
 * Settles one held purchase without a settlement run, for the spending
 * seed's history. Does nothing if it isn't held.
 */
export async function settleSeededPurchase(
  tx: DbExecutor,
  authorizationId: number,
  at: Date,
): Promise<void> {
  const held = await tx
    .select()
    .from(authorizationsTable)
    .where(
      and(
        eq(authorizationsTable.id, authorizationId),
        eq(authorizationsTable.decision, "APPROVED"),
        isNotNull(authorizationsTable.bucketId),
        isNull(authorizationsTable.settledAt),
      ),
    )
    .for("update");
  await applySettlement(tx, held, at, null);
}

/**
 * The demo control: settles every held purchase in one transaction and
 * returns the run. The held rows are locked first, so two runs (or a run
 * racing a new swipe's hold) never settle a purchase twice. Each capture is
 * sent to the chain after the commit, without waiting. Throws a `rule`
 * error when nothing is held.
 */
export async function runSettlement(
  options: { now?: Date; capture?: (authorizationId: number) => unknown } = {},
  executor: DbExecutor = db,
): Promise<SettlementDetail> {
  const at = options.now ?? new Date();
  const capture = options.capture ?? captureOnChain;

  const { settlementId, authorizationIds } = await executor.transaction(async (tx) => {
    const family = await getDemoFamily(tx);
    const held = await tx
      .select()
      .from(authorizationsTable)
      .where(heldWhere(family.id))
      .orderBy(asc(authorizationsTable.id))
      .for("update");
    if (held.length === 0) {
      throw new FamilyServiceError("rule", "Nothing is held right now, so there is nothing to settle.");
    }
    const [settlement] = await tx
      .insert(settlementsTable)
      .values({
        familyId: family.id,
        purchaseCount: held.length,
        totalCents: held.reduce((sum, a) => sum + a.amountCents, 0),
        settledAt: at,
        createdAt: at,
      })
      .returning();
    await applySettlement(tx, held, at, settlement!.id);
    return { settlementId: settlement!.id, authorizationIds: held.map((a) => a.id) };
  });

  for (const id of authorizationIds) void capture(id);
  return getSettlement(settlementId, executor);
}

/** One settlement run of the demo family, with its purchases' current chain status. */
export async function getSettlement(
  settlementId: number,
  executor: DbExecutor = db,
): Promise<SettlementDetail> {
  const family = await getDemoFamily(executor);
  const [settlement] = await executor
    .select()
    .from(settlementsTable)
    .where(and(eq(settlementsTable.id, settlementId), eq(settlementsTable.familyId, family.id)));
  if (!settlement) throw new FamilyServiceError("not_found", "That settlement doesn't exist.");
  const purchases = await executor
    .select({ authorization: authorizationsTable, bucketName: bucketsTable.name })
    .from(authorizationsTable)
    .leftJoin(bucketsTable, eq(bucketsTable.id, authorizationsTable.bucketId))
    .where(eq(authorizationsTable.settlementId, settlementId))
    .orderBy(asc(authorizationsTable.id));
  const issuerAddress = cardIssuerAddress();
  return {
    settlement,
    purchases: purchases.map((p) => ({ authorization: p.authorization, bucketName: p.bucketName ?? null })),
    issuerAddress,
    issuerExplorerUrl: chainAddressUrl(issuerAddress),
  };
}
