import { asc, eq } from "drizzle-orm";
import {
  bucketsTable,
  db,
  familiesTable,
  membersTable,
  type Bucket,
  type DbExecutor,
  type Family,
  type Member,
} from "@workspace/db";
import { FamilyServiceError } from "./errors";

/** The single demo family. */
export async function getDemoFamily(
  executor: DbExecutor = db,
): Promise<Family> {
  const [family] = await executor
    .select()
    .from(familiesTable)
    .orderBy(asc(familiesTable.id))
    .limit(1);
  if (!family) {
    throw new FamilyServiceError(
      "not_found",
      "The demo family hasn't been set up yet.",
    );
  }
  return family;
}

export async function getFamilyWithMembers(
  executor: DbExecutor = db,
): Promise<{ family: Family; members: Member[] }> {
  const family = await getDemoFamily(executor);
  const members = await executor
    .select()
    .from(membersTable)
    .where(eq(membersTable.familyId, family.id))
    .orderBy(asc(membersTable.id));
  return { family, members };
}

/** A member of the demo family, or a not-found error naming the id. */
export async function getFamilyMember(
  memberId: number,
  executor: DbExecutor = db,
): Promise<Member> {
  const family = await getDemoFamily(executor);
  const [member] = await executor
    .select()
    .from(membersTable)
    .where(eq(membersTable.id, memberId));
  if (!member || member.familyId !== family.id) {
    throw new FamilyServiceError(
      "not_found",
      `There is no family member with id ${memberId}.`,
    );
  }
  return member;
}

export interface PotTotals {
  /** Money still in the pot: available plus held. */
  potCents: number;
  availableCents: number;
  heldCents: number;
  spentCents: number;
}

export async function getOverview(
  executor: DbExecutor = db,
): Promise<{ family: Family; totals: PotTotals; buckets: Bucket[] }> {
  const family = await getDemoFamily(executor);
  const buckets = await executor
    .select()
    .from(bucketsTable)
    .where(eq(bucketsTable.familyId, family.id))
    .orderBy(asc(bucketsTable.id));

  const totals = buckets.reduce<PotTotals>(
    (sum, b) => ({
      potCents: sum.potCents + b.availableCents + b.heldCents,
      availableCents: sum.availableCents + b.availableCents,
      heldCents: sum.heldCents + b.heldCents,
      spentCents: sum.spentCents + b.spentCents,
    }),
    { potCents: 0, availableCents: 0, heldCents: 0, spentCents: 0 },
  );

  return { family, totals, buckets };
}
