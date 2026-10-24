import { randomInt } from "node:crypto";
import { BRAND } from "@brand/brand.config";
import { and, asc, eq, sql } from "drizzle-orm";
import {
  bankAccountsTable,
  bankDepositsTable,
  db,
  membersTable,
  type BankAccount,
  type BankDeposit,
  type DbExecutor,
  type Member,
} from "@workspace/db";
import { FamilyServiceError, formatCents, MAX_CENTS } from "./errors";
import { getDemoFamily, getFamilyMember } from "./family";

/** Roles that hold linked banks and move money into buckets. */
export const FUNDING_ROLES: ReadonlyArray<Member["role"]> = [
  "parent",
  "funder",
];

export function bankLabel(
  account: Pick<BankAccount, "bankName" | "last4">,
): string {
  return `${account.bankName} ••${account.last4}`;
}

function generateLast4(): string {
  return String(randomInt(0, 10_000)).padStart(4, "0");
}

export async function listBankAccounts(
  memberId: number,
  executor: DbExecutor = db,
): Promise<BankAccount[]> {
  await getFamilyMember(memberId, executor);
  return executor
    .select()
    .from(bankAccountsTable)
    .where(eq(bankAccountsTable.memberId, memberId))
    .orderBy(asc(bankAccountsTable.id));
}

/**
 * Links a simulated demo bank. The name must be one of BRAND.demo.banks; the
 * last four digits are generated unless given (the seed fixes them so they
 * survive a demo reset). Each bank can be linked once per member.
 */
export async function linkBankAccount(
  input: { memberId: number; bankName: string; last4?: string },
  executor: DbExecutor = db,
): Promise<BankAccount> {
  const allowed = BRAND.demo.banks;
  if (!allowed.includes(input.bankName)) {
    throw new FamilyServiceError(
      "rule",
      `"${input.bankName}" isn't one of the demo banks. Choose one of: ${allowed.join(", ")}.`,
    );
  }

  const member = await getFamilyMember(input.memberId, executor);
  if (!FUNDING_ROLES.includes(member.role)) {
    throw new FamilyServiceError(
      "rule",
      `${member.displayName} can't link a bank. Only a parent or funder can.`,
    );
  }

  const [account] = await executor
    .insert(bankAccountsTable)
    .values({
      memberId: member.id,
      bankName: input.bankName,
      last4: input.last4 ?? generateLast4(),
    })
    .onConflictDoNothing({
      target: [bankAccountsTable.memberId, bankAccountsTable.bankName],
    })
    .returning();
  if (!account) {
    throw new FamilyServiceError(
      "conflict",
      `${member.displayName} has already linked ${input.bankName}.`,
    );
  }
  return account;
}

/**
 * A bank account that belongs to a member of the demo family. `forUpdate`
 * locks the row until the surrounding transaction ends.
 */
export async function getFamilyBankAccount(
  bankAccountId: number,
  executor: DbExecutor,
  options: { forUpdate?: boolean } = {},
): Promise<BankAccount> {
  const family = await getDemoFamily(executor);
  const query = executor
    .select({ account: bankAccountsTable })
    .from(bankAccountsTable)
    .innerJoin(membersTable, eq(membersTable.id, bankAccountsTable.memberId))
    .where(
      and(
        eq(bankAccountsTable.id, bankAccountId),
        eq(membersTable.familyId, family.id),
      ),
    );
  const [row] = options.forUpdate
    ? await query.for("update", { of: bankAccountsTable })
    : await query;
  if (!row) {
    throw new FamilyServiceError(
      "not_found",
      `There is no linked bank account with id ${bankAccountId}.`,
    );
  }
  return row.account;
}

/**
 * A simulated deposit (stands in for ACH). Records the deposit and raises the
 * bank balance in one transaction.
 */
export async function depositToBank(
  input: { bankAccountId: number; amountCents: number },
  executor: DbExecutor = db,
): Promise<{ deposit: BankDeposit; bankAccount: BankAccount }> {
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    throw new FamilyServiceError(
      "rule",
      "A deposit must be a positive amount.",
    );
  }

  return executor.transaction(async (tx) => {
    const account = await getFamilyBankAccount(input.bankAccountId, tx, {
      forUpdate: true,
    });
    if (account.balanceCents > MAX_CENTS - input.amountCents) {
      throw new FamilyServiceError(
        "rule",
        `A ${formatCents(input.amountCents)} deposit would take ${bankLabel(account)} over the demo's balance limit.`,
      );
    }

    const [bankAccount] = await tx
      .update(bankAccountsTable)
      .set({
        balanceCents: sql`${bankAccountsTable.balanceCents} + ${input.amountCents}`,
      })
      .where(eq(bankAccountsTable.id, account.id))
      .returning();
    const [deposit] = await tx
      .insert(bankDepositsTable)
      .values({ bankAccountId: account.id, amountCents: input.amountCents })
      .returning();
    return { deposit: deposit!, bankAccount: bankAccount! };
  });
}
