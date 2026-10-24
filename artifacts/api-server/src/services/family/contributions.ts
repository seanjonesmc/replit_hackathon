import { and, desc, eq, sql } from "drizzle-orm";
import {
  bankAccountsTable,
  bucketsTable,
  CONTRIBUTION_NOTE_MAX,
  contributionsTable,
  db,
  membersTable,
  type BankAccount,
  type BankDeposit,
  type Bucket,
  type Contribution,
  type DbExecutor,
  type Member,
} from "@workspace/db";
import {
  bankLabel,
  depositToBank,
  FUNDING_ROLES,
  getFamilyBankAccount,
} from "./banks";
import { FamilyServiceError, formatCents, MAX_CENTS } from "./errors";
import { getDemoFamily, getFamilyMember } from "./family";

/** The note a contribution shows when its funder didn't write one. */
export function defaultContributionNote(
  bucketName: string,
  funderName: string,
): string {
  return `${bucketName}, from ${funderName}`;
}

/** A contribution's note: the stored one, or the default when it's empty. */
export function contributionNote(
  note: string | null | undefined,
  bucketName: string,
  funderName: string,
): string {
  return note?.trim() || defaultContributionNote(bucketName, funderName);
}

export interface ContributionInput {
  bucketId: number;
  memberId: number;
  bankAccountId: number;
  amountCents: number;
  /** Optional; empty or missing stores "<bucket>, from <funder name>". */
  note?: string | null;
}

export interface ContributionOutcome {
  contribution: Contribution;
  bankAccount: BankAccount;
  bucket: Bucket;
  /** The parent or funder who moved the money. */
  funder: Member;
}

/**
 * A parent or funder moves money from one of their linked banks into a
 * bucket. The balance check, both balance changes and the contribution record
 * happen in one transaction, with the bank and bucket rows locked.
 */
export async function contributeToBucket(
  input: ContributionInput,
  executor: DbExecutor = db,
): Promise<ContributionOutcome> {
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    throw new FamilyServiceError(
      "rule",
      "A contribution must be a positive amount.",
    );
  }
  const writtenNote = input.note?.trim() ?? "";
  if (writtenNote.length > CONTRIBUTION_NOTE_MAX) {
    throw new FamilyServiceError(
      "invalid",
      `A note can be at most ${CONTRIBUTION_NOTE_MAX} characters.`,
    );
  }

  return executor.transaction(async (tx) => {
    const family = await getDemoFamily(tx);
    const member = await getFamilyMember(input.memberId, tx);
    if (!FUNDING_ROLES.includes(member.role)) {
      throw new FamilyServiceError(
        "rule",
        `${member.displayName} can't add money to a bucket. Only a parent or funder can.`,
      );
    }

    // Lock order is always bank, then bucket.
    const account = await getFamilyBankAccount(input.bankAccountId, tx, {
      forUpdate: true,
    });
    if (account.memberId !== member.id) {
      throw new FamilyServiceError(
        "rule",
        `${bankLabel(account)} isn't one of ${member.displayName}'s linked banks.`,
      );
    }

    const [bucket] = await tx
      .select()
      .from(bucketsTable)
      .where(
        and(
          eq(bucketsTable.id, input.bucketId),
          eq(bucketsTable.familyId, family.id),
        ),
      )
      .for("update");
    if (!bucket) {
      throw new FamilyServiceError(
        "not_found",
        `There is no bucket with id ${input.bucketId}.`,
      );
    }

    if (account.balanceCents < input.amountCents) {
      throw new FamilyServiceError(
        "rule",
        `${bankLabel(account)} has ${formatCents(account.balanceCents)}, which isn't enough to add ${formatCents(input.amountCents)} to ${bucket.name}.`,
      );
    }
    if (bucket.availableCents > MAX_CENTS - input.amountCents) {
      throw new FamilyServiceError(
        "rule",
        `Adding ${formatCents(input.amountCents)} would take ${bucket.name} over the demo's balance limit.`,
      );
    }

    const [bankAccount] = await tx
      .update(bankAccountsTable)
      .set({
        balanceCents: sql`${bankAccountsTable.balanceCents} - ${input.amountCents}`,
      })
      .where(eq(bankAccountsTable.id, account.id))
      .returning();
    const [updatedBucket] = await tx
      .update(bucketsTable)
      .set({
        availableCents: sql`${bucketsTable.availableCents} + ${input.amountCents}`,
      })
      .where(eq(bucketsTable.id, bucket.id))
      .returning();
    const [contribution] = await tx
      .insert(contributionsTable)
      .values({
        funderMemberId: member.id,
        bankAccountId: account.id,
        bucketId: bucket.id,
        amountCents: input.amountCents,
        note: contributionNote(writtenNote, bucket.name, member.displayName),
      })
      .returning();

    return {
      contribution: contribution!,
      bankAccount: bankAccount!,
      bucket: updatedBucket!,
      funder: member,
    };
  });
}

/**
 * One tap from the funder's Add money screen: a simulated deposit into their
 * bank, then a contribution of the same amount into the bucket. Both happen
 * in one transaction, so a rejected contribution (not their bank, bucket
 * missing) leaves no stray deposit behind.
 */
export async function sendMoneyToBucket(
  input: ContributionInput,
  executor: DbExecutor = db,
): Promise<ContributionOutcome & { deposit: BankDeposit }> {
  return executor.transaction(async (tx) => {
    // Checked first so the deposit never lands in someone else's bank.
    const account = await getFamilyBankAccount(input.bankAccountId, tx);
    if (account.memberId !== input.memberId) {
      const member = await getFamilyMember(input.memberId, tx);
      throw new FamilyServiceError(
        "rule",
        `${bankLabel(account)} isn't one of ${member.displayName}'s linked banks.`,
      );
    }
    const { deposit } = await depositToBank(
      { bankAccountId: input.bankAccountId, amountCents: input.amountCents },
      tx,
    );
    const outcome = await contributeToBucket(input, tx);
    return { ...outcome, deposit };
  });
}

export interface ContributionDetail {
  contribution: Contribution;
  bucketName: string;
  bankName: string;
  bankLast4: string;
  funderName: string;
}

/** One member's contributions, newest first, with their total. */
export async function listMemberContributions(
  memberId: number,
  executor: DbExecutor = db,
): Promise<{ totalCents: number; contributions: ContributionDetail[] }> {
  await getFamilyMember(memberId, executor);
  const rows = await executor
    .select({
      contribution: contributionsTable,
      bucketName: bucketsTable.name,
      bankName: bankAccountsTable.bankName,
      bankLast4: bankAccountsTable.last4,
      funderName: membersTable.displayName,
    })
    .from(contributionsTable)
    .innerJoin(bucketsTable, eq(bucketsTable.id, contributionsTable.bucketId))
    .innerJoin(membersTable, eq(membersTable.id, contributionsTable.funderMemberId))
    .innerJoin(
      bankAccountsTable,
      eq(bankAccountsTable.id, contributionsTable.bankAccountId),
    )
    .where(eq(contributionsTable.funderMemberId, memberId))
    .orderBy(desc(contributionsTable.createdAt), desc(contributionsTable.id));

  const totalCents = rows.reduce(
    (sum, row) => sum + row.contribution.amountCents,
    0,
  );
  return { totalCents, contributions: rows };
}
