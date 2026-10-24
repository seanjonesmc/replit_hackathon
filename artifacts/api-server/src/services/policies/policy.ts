import { asc, eq } from "drizzle-orm";
import {
  bucketsTable,
  db,
  policiesTable,
  type Bucket,
  type DbExecutor,
  type Policy,
} from "@workspace/db";
import { BUCKET_NAMES, FamilyPolicy, type BucketName } from "../ai";
import { isValidTimeZone } from "../decisions/clock";
import { FamilyServiceError, getDemoFamily } from "../family";

export interface FamilyPolicySettings {
  familyId: number;
  presetName: string;
  /** IANA time zone the time windows are read in. */
  timeZone: string;
  /** The stored policy in the shared FamilyPolicy shape, validated. */
  policy: FamilyPolicy;
  /** The family's bucket rows (limits, thresholds and balances). */
  buckets: Bucket[];
}

const isBucketName = (name: string): name is BucketName =>
  (BUCKET_NAMES as readonly string[]).includes(name);

/**
 * Builds the shared FamilyPolicy from the stored policy row and the bucket
 * rows (per-bucket limits live on the buckets). Throws if the stored policy no
 * longer fits the schema, rather than deciding swipes on a bad policy.
 */
export function toFamilyPolicy(row: Policy, buckets: Bucket[]): FamilyPolicy {
  const parsed = FamilyPolicy.safeParse({
    buckets: buckets
      .filter((b) => isBucketName(b.name))
      .map((b) => ({
        name: b.name,
        budgetCents: b.availableCents + b.heldCents + b.spentCents,
        period: null,
        perTxLimitCents: b.perPurchaseLimitCents,
        approvalThresholdCents: b.approvalThresholdCents,
      })),
    blockedCategories: row.blockedCategories,
    approvalThresholdCents: row.approvalThresholdCents,
    timeWindows: row.timeWindows,
    blockedMerchants: row.blockedMerchants,
    allowedMerchants: row.allowedMerchants,
  });
  if (!parsed.success) {
    throw new Error(
      `The stored policy for family ${row.familyId} is invalid: ${parsed.error.issues[0]?.message ?? "unknown problem"}`,
    );
  }
  if (!isValidTimeZone(row.timeZone)) {
    throw new Error(
      `The stored policy for family ${row.familyId} has an unknown time zone: ${row.timeZone}`,
    );
  }
  return parsed.data;
}

/** The demo family's policy and buckets, loaded together. */
export async function getFamilyPolicy(
  executor: DbExecutor = db,
): Promise<FamilyPolicySettings> {
  // Sequential, not Promise.all: a transaction is one connection.
  const family = await getDemoFamily(executor);
  const [row] = await executor
    .select()
    .from(policiesTable)
    .where(eq(policiesTable.familyId, family.id));
  const buckets = await executor
    .select()
    .from(bucketsTable)
    .where(eq(bucketsTable.familyId, family.id))
    .orderBy(asc(bucketsTable.id));
  if (!row) {
    throw new FamilyServiceError(
      "not_found",
      "The family's spending policy hasn't been set up yet.",
    );
  }
  return {
    familyId: family.id,
    presetName: row.presetName,
    timeZone: row.timeZone,
    policy: toFamilyPolicy(row, buckets),
    buckets,
  };
}
