import { eq, isNotNull } from "drizzle-orm";
import { familiesTable, membersTable, db, type DbExecutor } from "@workspace/db";
import { requireParent, seedSpendingDemo } from "../decisions";
import { getDemoFamily, lockDemoSeed, seedDemoFamily } from "../family";

/**
 * The presenter's "Reset demo": puts the app back at the starting point of
 * the demo script so it can be rehearsed and recorded again.
 *
 * In one transaction it deletes the demo family, which cascades to every row
 * a run creates (contributions, deposits, held and settled purchases,
 * settlement runs, temporary passes, policy edits, a frozen card), then
 * re-runs both seeds. Merchants are shared seed data and stay. The seeds
 * derive every on-chain id from fixed keys and fix every number shown on
 * screen, so the same script gives the same numbers after each reset.
 * Members linked to a signed-in account stay linked (matched by their stable
 * on-chain id), so the parent-only checks still hold after a reset.
 *
 * Nothing on chain is undone: transactions from earlier runs stay on Monad.
 * The local receipt log (chain_events) is kept on purpose as the record of
 * those transactions. Its owner ids point at deleted rows, and Postgres ids
 * are never reused, so no fresh row picks up an old receipt; the fresh rows
 * carry no chain records, so explorer links from earlier runs stop showing.
 */

export interface DemoResetResult {
  familyId: number;
  historyAdded: number;
  resetAt: Date;
}

export async function resetDemo(
  input: { memberId: number; actingUserId: string },
  executor: DbExecutor = db,
  now: Date = new Date(),
): Promise<DemoResetResult> {
  return executor.transaction(async (tx) => {
    // Serializes with startup seeding and with another reset.
    await lockDemoSeed(tx);

    // Only a parent, and only from their own account once linked (the same
    // rule as answering a purchase).
    const family = await getDemoFamily(tx);
    await requireParent(input.memberId, family.id, input.actingUserId, tx, "reset the demo");
    const links = await tx
      .select({ onchainId: membersTable.onchainId, userId: membersTable.userId })
      .from(membersTable)
      .where(isNotNull(membersTable.userId));

    // There is only ever the one demo family; every family-scoped table
    // cascades from it.
    await tx.delete(familiesTable);

    const seeded = await seedDemoFamily(tx, now);
    if (!seeded.created) {
      throw new Error("Demo reset: the family still existed after it was deleted.");
    }
    for (const link of links) {
      await tx
        .update(membersTable)
        .set({ userId: link.userId })
        .where(eq(membersTable.onchainId, link.onchainId));
    }
    const spending = await seedSpendingDemo(tx, now);
    if (!spending.cardAdded) {
      throw new Error("Demo reset: the card and its history were not re-seeded.");
    }
    return { familyId: seeded.familyId, historyAdded: spending.historyAdded, resetAt: now };
  });
}
