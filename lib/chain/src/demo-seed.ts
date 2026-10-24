/**
 * The seeded demo family's chain-side catalog: member role keys, merchants
 * and blocked categories. The deploy seed registers exactly these, and the
 * backend derives the same bytes32 IDs from them, so Postgres and the chain
 * agree. Display names come from BRAND.demo, never from here.
 */

/**
 * Stable key per seeded member, passed to `memberChainId`. They match the
 * backend's seed keys, so its stored `onchain_id` values are these IDs.
 */
export const DEMO_MEMBER_KEYS = {
  parent: "parent",
  grandparent: "grandparent",
  coParent: "co-parent",
  dependent: "dependent",
} as const;

export type DemoMemberRole = keyof typeof DEMO_MEMBER_KEYS;

export interface DemoMerchant {
  /** Stable key passed to `merchantChainId` and `merchantPayoutAddress`. */
  slug: string;
  name: string;
  /** The real-world merchant category code. */
  mcc: number;
  /** Plain lowercase category; the chain rejects uppercase. */
  category: string;
}

/** Every merchant the swipe simulator offers, with real MCCs. */
export const DEMO_MERCHANTS: readonly DemoMerchant[] = [
  { slug: "trader-joes", name: "Trader Joe's", mcc: 5411, category: "grocery" },
  { slug: "campus-bookstore", name: "Campus Bookstore", mcc: 5942, category: "bookstore" },
  { slug: "the-tipsy-tavern", name: "The Tipsy Tavern", mcc: 5813, category: "bar" },
  { slug: "liquor-barn", name: "Liquor Barn", mcc: 5921, category: "liquor" },
  { slug: "lucky-star-casino", name: "Lucky Star Casino", mcc: 7995, category: "gambling" },
  { slug: "steam", name: "Steam", mcc: 5816, category: "gaming" },
  { slug: "uber", name: "Uber", mcc: 4121, category: "rideshare" },
  { slug: "apple-store", name: "Apple Store", mcc: 5732, category: "electronics" },
  { slug: "amc", name: "AMC", mcc: 7832, category: "movies" },
];

/** Categories blocked for every card in the seeded family. */
export const DEMO_BLOCKED_CATEGORIES: readonly string[] = [
  "bar",
  "liquor",
  "gambling",
  "nightclub",
  "gaming",
];

/**
 * Chain bucket ID for each seeded bucket, by name. The contract numbers
 * buckets from 1 in creation order, and the deploy seed creates them in the
 * backend seed's order (Food, School, Social, Transit), so the backend charges
 * a database bucket against this ID. The deploy read-back checks the live
 * contract agrees.
 */
export const DEMO_BUCKET_CHAIN_IDS: Readonly<Record<string, bigint>> = {
  Food: 1n,
  School: 2n,
  Social: 3n,
  Transit: 4n,
};
