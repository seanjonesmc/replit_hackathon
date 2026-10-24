import { asc, eq } from "drizzle-orm";
import {
  cardsTable,
  db,
  membersTable,
  type Card,
  type DbExecutor,
} from "@workspace/db";
import { FamilyServiceError, getDemoFamily } from "../family";

export interface CardDetail {
  card: Card;
  dependentName: string;
}

/** The demo family's card (one dependent, one card). */
export async function getDependentCard(
  executor: DbExecutor = db,
): Promise<CardDetail> {
  const family = await getDemoFamily(executor);
  const [row] = await executor
    .select({ card: cardsTable, dependentName: membersTable.displayName })
    .from(cardsTable)
    .innerJoin(membersTable, eq(membersTable.id, cardsTable.dependentMemberId))
    .where(eq(membersTable.familyId, family.id))
    .orderBy(asc(cardsTable.id))
    .limit(1);
  if (!row) {
    throw new FamilyServiceError(
      "not_found",
      "The card hasn't been issued yet.",
    );
  }
  return row;
}

/**
 * Freezes (active → frozen) or unfreezes (frozen → active) the card, in the
 * database only for now. Asking for the state it is already in changes
 * nothing; a card that was never activated can't be frozen or unfrozen.
 */
export async function setCardFrozen(
  frozen: boolean,
  executor: DbExecutor = db,
): Promise<CardDetail> {
  return executor.transaction(async (tx) => {
    const { card, dependentName } = await getDependentCard(tx);
    const [locked] = await tx
      .select()
      .from(cardsTable)
      .where(eq(cardsTable.id, card.id))
      .for("update");
    const current = locked ?? card;
    const target = frozen ? "frozen" : "active";
    if (current.status === target) {
      return { card: current, dependentName };
    }
    if (current.status === "issued") {
      throw new FamilyServiceError(
        "rule",
        `The card hasn't been activated yet, so it can't be ${frozen ? "frozen" : "unfrozen"}.`,
      );
    }
    const [updated] = await tx
      .update(cardsTable)
      .set({ status: target })
      .where(eq(cardsTable.id, current.id))
      .returning();
    return { card: updated!, dependentName };
  });
}
