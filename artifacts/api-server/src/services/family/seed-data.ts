import type { BucketIcon } from "@workspace/db";

/**
 * Seed values for the demo family's buckets (docs/plans/phase-1-signin-screens.md).
 * People and bank names come from BRAND.demo at seed time (see `seed.ts`);
 * bucket limits are the product spec's seed values, kept exactly as written.
 * Merchants, the policy, the card and the purchase history are seeded by the
 * decision engine (services/decisions/seed.ts) through the real rules.
 *
 * Times are offsets from the moment of seeding, so the funding is dated before
 * the purchase history ("the past few days").
 */

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export type SeedFunderKey = "parent" | "grandparent" | "coParent";
export type SeedBucketName = "Food" | "School" | "Social";

export interface SeedBucket {
  name: SeedBucketName;
  purpose: string;
  icon: BucketIcon;
  amountCents: number;
  perPurchaseLimitCents: number;
  approvalThresholdCents: number;
  fundedBy: SeedFunderKey;
}

/** Three buckets, each funded by a different person. */
export const SEED_BUCKETS: readonly SeedBucket[] = [
  {
    name: "Food",
    purpose: "Groceries and meals out",
    icon: "food",
    amountCents: 150_00,
    perPurchaseLimitCents: 60_00,
    approvalThresholdCents: 75_00,
    fundedBy: "grandparent",
  },
  {
    name: "School",
    purpose: "Books and supplies",
    icon: "school",
    amountCents: 200_00,
    perPurchaseLimitCents: 150_00,
    approvalThresholdCents: 100_00,
    fundedBy: "coParent",
  },
  {
    name: "Social",
    purpose: "Movies, bowling, concerts",
    icon: "social",
    amountCents: 60_00,
    perPurchaseLimitCents: 40_00,
    approvalThresholdCents: 30_00,
    fundedBy: "parent",
  },
];

/** How long ago the seeded deposits and contributions are dated. */
export const SEED_DEPOSIT_AGO_MS = 7 * DAY + 12 * HOUR;
export const SEED_CONTRIBUTION_AGO_MS = 6 * DAY;
