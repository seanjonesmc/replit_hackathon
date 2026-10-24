import { and, asc, desc, eq, gte, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { db as defaultDb, type Database } from "@workspace/db";
import {
  authorizationsTable,
  bucketsTable,
  cardsTable,
  contributionsTable,
  familiesTable,
  membersTable,
  policiesTable,
  settlementsTable,
  type Authorization as AuthorizationRow,
  type Card as CardRow,
  type DecidedBy as DecidedByRow,
  type Member as MemberRow,
} from "@workspace/db/schema";
import type {
  ActivityItem,
  BucketSummary,
  Card,
  CardAndPolicy,
  DecidedBy,
  Decision,
  DependentWallet,
  Member,
  ParentOverview,
  TimelineStep,
} from "@workspace/api-zod";
import { settlementState } from "../decisions/trace";
import { toChainRecord } from "../events/chain-record";
import { describePolicy } from "../policies/plain-english";
import { contributionNote } from "./contributions";
import { FamilyServiceError } from "./errors";
import { formatAmount } from "./format";
import { categoryLabel, spentOnPhrase } from "./labels";

/**
 * Read models for the family screens (the `/family/*` reads). Each function
 * returns one screen's response, already shaped to the OpenAPI contract. The
 * purchases are the decision engine's authorizations. Nothing here writes.
 */

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const DECIDED_BY: Record<DecidedByRow, DecidedBy> = {
  rule: "Rule",
  ai_guard: "AI guard",
};

const chain = toChainRecord;

function toMember(m: MemberRow): Member {
  return {
    id: m.id,
    displayName: m.displayName,
    role: m.role,
    relationship: m.relationship,
    age: m.age,
    onboardingComplete: m.onboardingComplete,
    onchainId: m.onchainId,
  };
}

function toCard(card: CardRow, dependentName: string): Card {
  return {
    id: card.id,
    dependentId: card.dependentMemberId,
    dependentName,
    last4: card.last4,
    expiryMonth: card.expiryMonth,
    expiryYear: card.expiryYear,
    status: card.status,
    onchainCardId: card.onchainCardId,
    chain: chain(card),
  };
}

async function loadFamily(database: Database, familyId: number) {
  const [family] = await database.select().from(familiesTable).where(eq(familiesTable.id, familyId));
  if (!family) throw new FamilyServiceError("not_found", "The demo family hasn't been set up yet.");
  return family;
}

async function loadMembers(database: Database, familyId: number) {
  const members = await database
    .select()
    .from(membersTable)
    .where(eq(membersTable.familyId, familyId))
    .orderBy(asc(membersTable.id));
  const byId = new Map(members.map((m) => [m.id, m]));
  const parent = members.find((m) => m.role === "parent");
  const dependent = members.find((m) => m.role === "dependent");
  if (!parent || !dependent) {
    throw new Error(`Family ${familyId} is missing its parent or dependent`);
  }
  return { members, byId, parent, dependent };
}

async function loadCard(database: Database, dependentId: number) {
  const [card] = await database
    .select()
    .from(cardsTable)
    .where(eq(cardsTable.dependentMemberId, dependentId))
    .orderBy(asc(cardsTable.id))
    .limit(1);
  if (!card) throw new FamilyServiceError("not_found", "The card hasn't been issued yet.");
  return card;
}

export async function getBuckets(familyId: number, now: Date = new Date(), database: Database = defaultDb): Promise<BucketSummary[]> {
  const buckets = await database
    .select()
    .from(bucketsTable)
    .where(eq(bucketsTable.familyId, familyId))
    .orderBy(asc(bucketsTable.id));
  if (buckets.length === 0) return [];
  const bucketIds = buckets.map((b) => b.id);

  const contributions = await database
    .select({
      bucketId: contributionsTable.bucketId,
      amountCents: contributionsTable.amountCents,
      funderName: membersTable.displayName,
    })
    .from(contributionsTable)
    .innerJoin(membersTable, eq(membersTable.id, contributionsTable.funderMemberId))
    .where(inArray(contributionsTable.bucketId, bucketIds))
    .orderBy(asc(contributionsTable.createdAt), asc(contributionsTable.id));

  const settledThisWeek = await database
    .select({ bucketId: authorizationsTable.bucketId, amountCents: authorizationsTable.amountCents })
    .from(authorizationsTable)
    .where(
      and(
        eq(authorizationsTable.familyId, familyId),
        eq(authorizationsTable.decision, "APPROVED"),
        gte(authorizationsTable.settledAt, new Date(now.getTime() - WEEK_MS)),
      ),
    );

  return buckets.map((b) => {
    const mine = contributions.filter((c) => c.bucketId === b.id);
    return {
      id: b.id,
      name: b.name,
      purpose: b.purpose,
      icon: b.icon,
      perPurchaseLimitCents: b.perPurchaseLimitCents,
      approvalThresholdCents: b.approvalThresholdCents,
      availableCents: b.availableCents,
      heldCents: b.heldCents,
      spentCents: b.spentCents,
      fundedCents: mine.reduce((sum, c) => sum + c.amountCents, 0),
      spentThisWeekCents: settledThisWeek
        .filter((a) => a.bucketId === b.id)
        .reduce((sum, a) => sum + a.amountCents, 0),
      funderNames: [...new Set(mine.map((c) => c.funderName))],
      chain: chain(b),
    };
  });
}

export async function getParentOverview(familyId: number, now: Date = new Date(), database: Database = defaultDb): Promise<ParentOverview> {
  const family = await loadFamily(database, familyId);
  const { parent, dependent } = await loadMembers(database, familyId);
  const buckets = await getBuckets(familyId, now, database);
  const pending = await database
    .select({ id: authorizationsTable.id })
    .from(authorizationsTable)
    .where(and(eq(authorizationsTable.familyId, familyId), eq(authorizationsTable.status, "pending")));
  // Approved purchases still holding money, waiting for a settlement run.
  const [held] = await database
    .select({
      count: sql<number>`count(*)::int`,
      total: sql<number>`coalesce(sum(${authorizationsTable.amountCents}), 0)::int`,
    })
    .from(authorizationsTable)
    .where(
      and(
        eq(authorizationsTable.familyId, familyId),
        eq(authorizationsTable.decision, "APPROVED"),
        isNotNull(authorizationsTable.bucketId),
        isNull(authorizationsTable.settledAt),
      ),
    );
  const [latest] = await database
    .select({ id: settlementsTable.id })
    .from(settlementsTable)
    .where(eq(settlementsTable.familyId, familyId))
    .orderBy(desc(settlementsTable.settledAt), desc(settlementsTable.id))
    .limit(1);
  return {
    familyName: family.name,
    parentName: parent.displayName,
    dependentName: dependent.displayName,
    potTotalCents: buckets.reduce((sum, b) => sum + b.availableCents + b.heldCents, 0),
    buckets,
    pendingApprovalsCount: pending.length,
    heldPurchasesCount: held?.count ?? 0,
    heldTotalCents: held?.total ?? 0,
    latestSettlementId: latest?.id ?? null,
  };
}

/** One activity row for a swipe, folding a parent-approved original into its retry. */
function purchaseItem(
  a: AuthorizationRow,
  bucketName: string | null,
  original: AuthorizationRow | undefined,
  who: string,
  nameOf: (id: number | null) => string | undefined,
): ActivityItem {
  const amount = formatAmount(a.amountCents);
  // Held money isn't paid yet; it's paid from the bucket once it settles.
  const paidFrom = bucketName ? (a.settledAt ? ` — paid from ${bucketName}` : ` — held in ${bucketName}`) : "";
  const approverName = nameOf(original?.resolvedByMemberId ?? a.resolvedByMemberId) ?? "a parent";
  const spentOn = spentOnPhrase(a.merchantCategory);

  let decision: Decision = a.decision;
  let summary: string;
  let timeline: TimelineStep[] = [];
  if (original) {
    summary = `${who} spent ${amount} on ${spentOn} at ${a.merchantName} after ${approverName} said yes${paidFrom}`;
    timeline = [
      { label: "Asked for an OK", state: "pending", at: original.swipedAt },
      { label: `${approverName} approved`, state: "approved", at: original.resolvedAt },
      { label: a.decision === "APPROVED" ? "Approved" : "Declined", state: a.decision === "APPROVED" ? "approved" : "rejected", at: a.swipedAt },
      ...(a.settledAt ? [{ label: "Settled", state: "settled" as const, at: a.settledAt }] : []),
    ];
    if (a.decision !== "APPROVED") {
      summary = `${who}'s ${amount} at ${a.merchantName} was declined after ${approverName} said yes`;
    }
  } else if (a.status === "parent_declined") {
    decision = "REJECTED";
    summary = `${who}'s ${amount} request at ${a.merchantName} was turned down by ${approverName}`;
    timeline = [
      { label: "Asked for an OK", state: "pending", at: a.swipedAt },
      { label: `${approverName} declined`, state: "rejected", at: a.resolvedAt },
    ];
  } else if (a.status === "parent_approved") {
    summary = `${approverName} said yes to ${who}'s ${amount} at ${a.merchantName}`;
    timeline = [
      { label: "Asked for an OK", state: "pending", at: a.swipedAt },
      { label: `${approverName} approved`, state: "approved", at: a.resolvedAt },
    ];
  } else if (a.decision === "PENDING") {
    summary = `${who} is waiting on an OK for ${amount} at ${a.merchantName}`;
  } else if (a.decision === "APPROVED") {
    summary = `${who} spent ${amount} on ${spentOn} at ${a.merchantName}${paidFrom}`;
  } else {
    summary = `${who} tried to spend ${amount} at ${a.merchantName} — declined`;
  }

  return {
    id: `purchase-${a.id}`,
    kind: "purchase",
    occurredAt: a.swipedAt,
    actorName: who,
    summary,
    detail: a.reason,
    amountCents: a.amountCents,
    direction: "out",
    decision,
    reasonCode: a.reasonCode,
    decidedBy: DECIDED_BY[a.decidedBy],
    bucketName,
    merchantName: a.merchantName,
    mcc: a.mcc,
    category: a.merchantCategory,
    timeline,
    settlement: settlementState(a),
    chain: chain(a),
    captureChain: chain({
      chainStatus: a.captureChainStatus,
      chainTxHash: a.captureChainTxHash,
      chainConfirmedAt: a.captureChainConfirmedAt,
    }),
  };
}

export async function getActivity(familyId: number, database: Database = defaultDb): Promise<ActivityItem[]> {
  const { byId, dependent } = await loadMembers(database, familyId);
  const nameOf = (id: number | null) => (id !== null ? byId.get(id)?.displayName : undefined);

  const swipes = await database
    .select({ authorization: authorizationsTable, bucketName: bucketsTable.name })
    .from(authorizationsTable)
    .leftJoin(bucketsTable, eq(bucketsTable.id, authorizationsTable.bucketId))
    .where(eq(authorizationsTable.familyId, familyId));

  const contributions = await database
    .select({ contribution: contributionsTable, bucketName: bucketsTable.name })
    .from(contributionsTable)
    .innerJoin(bucketsTable, eq(bucketsTable.id, contributionsTable.bucketId))
    .where(eq(bucketsTable.familyId, familyId));

  const byAuthId = new Map(swipes.map((r) => [r.authorization.id, r.authorization]));
  // An original that was retried is shown inside its retry's row, not on its own.
  const retried = new Set(
    swipes.map((r) => r.authorization.previousAuthorizationId).filter((id): id is number => id !== null),
  );

  const items: ActivityItem[] = [];
  for (const { authorization: a, bucketName } of swipes) {
    if (retried.has(a.id)) continue;
    const original = a.previousAuthorizationId !== null ? byAuthId.get(a.previousAuthorizationId) : undefined;
    items.push(purchaseItem(a, bucketName ?? null, original, dependent.displayName, nameOf));
  }

  for (const { contribution: c, bucketName } of contributions) {
    const funder = nameOf(c.funderMemberId) ?? "A funder";
    items.push({
      id: `contribution-${c.id}`,
      kind: "contribution",
      occurredAt: c.createdAt,
      actorName: funder,
      summary: `${funder} added ${formatAmount(c.amountCents)} to ${bucketName}`,
      detail: contributionNote(c.note, bucketName, funder),
      amountCents: c.amountCents,
      direction: "in",
      decision: null,
      reasonCode: null,
      decidedBy: null,
      bucketName,
      merchantName: null,
      mcc: null,
      category: null,
      timeline: [],
      settlement: null,
      chain: chain(c),
      captureChain: { status: "not_submitted", txHash: null, confirmedAt: null, explorerUrl: null },
    });
  }

  return items.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime() || b.id.localeCompare(a.id));
}

export async function getCardAndPolicy(familyId: number, database: Database = defaultDb): Promise<CardAndPolicy> {
  const { parent, dependent } = await loadMembers(database, familyId);
  const card = await loadCard(database, dependent.id);
  const [policy] = await database.select().from(policiesTable).where(eq(policiesTable.familyId, familyId));
  if (!policy) throw new FamilyServiceError("not_found", "The family's spending policy hasn't been set up yet.");
  const buckets = await database
    .select()
    .from(bucketsTable)
    .where(eq(bucketsTable.familyId, familyId))
    .orderBy(asc(bucketsTable.id));

  const bucketRules = buckets.map((b) => ({
    bucketName: b.name,
    perPurchaseLimitCents: b.perPurchaseLimitCents,
    approvalThresholdCents: b.approvalThresholdCents,
  }));

  return {
    card: toCard(card, dependent.displayName),
    policy: {
      presetName: policy.presetName,
      timeZone: policy.timeZone,
      bucketRules,
      lines: describePolicy({
        parentName: parent.displayName,
        blockedCategories: policy.blockedCategories,
        buckets: bucketRules.map((r) => ({ name: r.bucketName, ...r })),
        approvalThresholdCents: policy.approvalThresholdCents,
        timeWindows: policy.timeWindows,
      }),
      updatedAt: policy.updatedAt,
    },
    blockedCategories: policy.blockedCategories.map((category) => ({
      category,
      label: categoryLabel(category),
    })),
  };
}

export async function getDependentWallet(familyId: number, now: Date = new Date(), database: Database = defaultDb): Promise<DependentWallet> {
  const { dependent } = await loadMembers(database, familyId);
  const card = await loadCard(database, dependent.id);
  const buckets = await getBuckets(familyId, now, database);
  return {
    dependent: toMember(dependent),
    card: toCard(card, dependent.displayName),
    totalAvailableCents: buckets.reduce((sum, b) => sum + b.availableCents, 0),
    buckets,
  };
}
