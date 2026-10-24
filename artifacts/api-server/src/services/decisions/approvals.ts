import { and, eq } from "drizzle-orm";
import {
  authorizationsTable,
  bucketsTable,
  db,
  membersTable,
  temporaryPassesTable,
  type Authorization,
  type DbExecutor,
  type Member,
  type TemporaryPass,
} from "@workspace/db";
import { FamilyServiceError, getDemoFamily } from "../family";
import { CATEGORY_BUCKETS } from "./rules";
import {
  decideSwipe,
  loadSwipeContext,
  recordDecision,
  type SwipeInput,
} from "./swipes";

/**
 * A parent's answer to a pending swipe (the spec's approval flow):
 *
 *   swipe → PENDING → parent approves → temporary pass (that merchant, that
 *   amount, 10 minutes) → the same purchase is re-run → APPROVED
 *
 * or the parent declines and no money moves. The original row keeps its
 * PENDING decision; only its status changes. The retry is a new
 * authorization linked back through `previous_authorization_id`.
 */

/** How long a parent's one-time OK lasts. */
export const PASS_MINUTES = 10;

export type ParentDecision = "approve" | "decline";

export interface ResolveApprovalInput {
  authorizationId: number;
  parentId: number;
  decision: ParentDecision;
  /** The signed-in account answering (the session user's id). */
  actingUserId: string;
}

export interface ResolveApprovalOutcome {
  /** The original swipe, now `parent_approved` or `parent_declined`. */
  original: Authorization;
  /** The automatic retry after an approval; null after a decline. */
  retry: Authorization | null;
  /** The one-time pass an approval granted; null after a decline. */
  pass: TemporaryPass | null;
  /** The parent who answered. */
  parent: Member;
}

const ALREADY_RESOLVED: Record<string, string> = {
  parent_approved: "A parent already approved this purchase.",
  parent_declined: "A parent already declined this purchase.",
};

/**
 * Where the retry happens on the simulated clock: as long after the original
 * swipe as has really passed since it was stored. A late-night ride approved
 * a minute later is retried a minute after 2:10am, so the pass (not the
 * daytime clock) is what lets it through, and the time is never in the future.
 */
export function retryTimestamp(original: Authorization, now: Date): Date {
  const elapsed = Math.max(0, now.getTime() - original.createdAt.getTime());
  return new Date(Math.min(now.getTime(), original.swipedAt.getTime() + elapsed));
}

/** The original swipe as the engine's input, at the retry's time. */
function retryInput(original: Authorization, at: Date): SwipeInput {
  return {
    cardId: original.cardId!,
    dependentId: original.dependentMemberId,
    merchantId: original.merchantId,
    merchantName: original.merchantName,
    mcc: original.mcc,
    merchantCategory: original.merchantCategory,
    items: original.items,
    amount: original.amountCents,
    location: original.location,
    timestamp: at.toISOString(),
  };
}

/**
 * Who may answer for a parent. The demo has one presenter who plays every
 * family member, so the seeded members aren't linked to an account and the
 * signed-in presenter may act for them (presenter mode). That stops where an
 * account is linked: a parent linked to an account answers only from that
 * account, and an account linked to another member (say, the dependent) can
 * never answer for a parent. Non-parents can never answer. Also guards the
 * other parent-only demo controls (the demo reset), named by `action`.
 */
export async function requireParent(
  parentId: number,
  familyId: number,
  actingUserId: string,
  executor: DbExecutor,
  action = "approve or decline a purchase",
): Promise<Member> {
  const members = await executor
    .select()
    .from(membersTable)
    .where(eq(membersTable.familyId, familyId));
  const member = members.find((m) => m.id === parentId);
  if (!member) {
    throw new FamilyServiceError(
      "not_found",
      `There is no family member with id ${parentId}.`,
    );
  }
  if (member.role !== "parent") {
    throw new FamilyServiceError(
      "forbidden",
      `Only a parent can ${action}.`,
    );
  }
  const ownMember = members.find((m) => m.userId === actingUserId);
  const linkedElsewhere = member.userId !== null && member.userId !== actingUserId;
  if (linkedElsewhere || (ownMember && ownMember.id !== member.id)) {
    throw new FamilyServiceError(
      "forbidden",
      `Only ${member.displayName} can answer as ${member.displayName}.`,
    );
  }
  return member;
}

/**
 * A temporary pass works only for a seeded merchant on the card, from the
 * bucket the category maps to (rule step 7). Anything else can't be paid by
 * a parent's OK, so approving it would just ask again; say so instead.
 */
async function requireApprovable(
  original: Authorization,
  executor: DbExecutor,
): Promise<void> {
  const bucketName = CATEGORY_BUCKETS[original.merchantCategory.trim().toLowerCase()];
  const [bucket] = bucketName
    ? await executor
        .select({ id: bucketsTable.id })
        .from(bucketsTable)
        .where(
          and(
            eq(bucketsTable.familyId, original.familyId),
            eq(bucketsTable.name, bucketName),
          ),
        )
    : [];
  if (original.cardId === null || original.merchantId === null || !bucket) {
    throw new FamilyServiceError(
      "rule",
      `A parent's OK can only cover a purchase at a listed shop that one of the buckets pays for, so ${original.merchantName} can only be declined.`,
    );
  }
}

/**
 * Approves or declines one pending swipe, all in one transaction: the
 * original row is locked first, so two answers to the same request can't
 * both win (the second gets a `conflict`). Approving grants the pass and
 * re-runs the purchase through the same rules and money movement as a
 * swipe. The retry runs without the AI guard: the parent has just reviewed
 * it, and the pass decides it at rule step 7 before the guard's slot.
 */
export async function resolveApproval(
  input: ResolveApprovalInput,
  options: { now?: Date } = {},
  executor: DbExecutor = db,
): Promise<ResolveApprovalOutcome> {
  const now = options.now ?? new Date();
  const family = await getDemoFamily(executor);
  const parent = await requireParent(
    input.parentId,
    family.id,
    input.actingUserId,
    executor,
  );

  return executor.transaction(async (tx) => {
    const [locked] = await tx
      .select()
      .from(authorizationsTable)
      .where(
        and(
          eq(authorizationsTable.id, input.authorizationId),
          eq(authorizationsTable.familyId, family.id),
        ),
      )
      .for("update");
    if (!locked) {
      throw new FamilyServiceError(
        "not_found",
        `There is no purchase with id ${input.authorizationId}.`,
      );
    }
    if (locked.status !== "pending") {
      throw new FamilyServiceError(
        "conflict",
        ALREADY_RESOLVED[locked.status] ??
          "This purchase isn't waiting for a parent's OK.",
      );
    }

    const approve = input.decision === "approve";
    if (approve) await requireApprovable(locked, tx);

    const [original] = await tx
      .update(authorizationsTable)
      .set({
        status: approve ? "parent_approved" : "parent_declined",
        resolvedAt: now,
        resolvedByMemberId: parent.id,
      })
      .where(eq(authorizationsTable.id, locked.id))
      .returning();

    if (!approve) return { original: original!, retry: null, pass: null, parent };

    const [pass] = await tx
      .insert(temporaryPassesTable)
      .values({
        cardId: locked.cardId!,
        merchantId: locked.merchantId!,
        maxAmountCents: locked.amountCents,
        expiresAt: new Date(now.getTime() + PASS_MINUTES * 60_000),
        createdAt: now,
      })
      .returning();

    const at = retryTimestamp(locked, now);
    const ctx = await loadSwipeContext(retryInput(locked, at), tx, now);
    const decided = await decideSwipe(ctx, null);
    // Stored at `now`; its swipe time stays on the simulated clock (`at`).
    const retry = await recordDecision(
      ctx,
      decided,
      { at: now, previousAuthorizationId: locked.id },
      tx,
    );

    return { original: original!, retry, pass: pass!, parent };
  });
}
