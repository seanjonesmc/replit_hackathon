import type { BankDeposit, Contribution } from "@workspace/db";
import { findChainBucketId } from "../blockchain";
import {
  markChainFailed,
  submitInBackground,
  type BackgroundSubmitDeps,
  type SubmissionOutcome,
} from "../events";

/**
 * Mirrors family money moves on Monad after their Postgres commit. Amounts
 * are cents on both sides; members are addressed by their stored
 * `onchain_id`, buckets by name (see `findChainBucketId`). Each function
 * never rejects, so routes call them with `void` and respond immediately.
 */

/** A simulated deposit → `bankDeposit`. */
export function mirrorDepositOnChain(
  input: { deposit: BankDeposit; memberOnchainId: string },
  deps?: BackgroundSubmitDeps,
): Promise<SubmissionOutcome> {
  return submitInBackground(
    {
      label: "bankDeposit",
      owner: { table: "bank_deposits", id: input.deposit.id },
      send: (client) =>
        client.bankDeposit({
          userId: input.memberOnchainId,
          amount: input.deposit.amountCents,
        }),
    },
    deps,
  );
}

/** A contribution → `fundBucket`. */
export function mirrorContributionOnChain(
  input: { contribution: Contribution; bucketName: string; funderOnchainId: string },
  deps?: BackgroundSubmitDeps,
): Promise<SubmissionOutcome> {
  return submitInBackground(
    {
      label: "fundBucket",
      owner: { table: "contributions", id: input.contribution.id },
      send: async (client) =>
        client.fundBucket({
          funderId: input.funderOnchainId,
          bucketId: await findChainBucketId(client, input.bucketName),
          amount: input.contribution.amountCents,
        }),
    },
    deps,
  );
}

/**
 * Send money: the deposit first, then the contribution once the deposit is
 * mined. If the deposit fails, the contribution is marked failed without
 * being sent, mirroring the single database transaction behind both.
 */
export async function mirrorSendMoneyOnChain(
  input: {
    deposit: BankDeposit;
    contribution: Contribution;
    bucketName: string;
    funderOnchainId: string;
  },
  deps?: BackgroundSubmitDeps,
): Promise<{ deposit: SubmissionOutcome; contribution: SubmissionOutcome }> {
  const deposit = await mirrorDepositOnChain(
    { deposit: input.deposit, memberOnchainId: input.funderOnchainId },
    deps,
  );
  if (deposit.status === "not_configured") return { deposit, contribution: deposit };
  if (deposit.status === "failed") {
    await markChainFailed({ table: "contributions", id: input.contribution.id }, null, deps);
    return {
      deposit,
      contribution: { status: "failed", txHash: null, error: deposit.error },
    };
  }
  const contribution = await mirrorContributionOnChain(input, deps);
  return { deposit, contribution };
}
