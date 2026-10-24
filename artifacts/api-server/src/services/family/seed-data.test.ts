import { DEMO_BUCKET_CHAIN_IDS } from "@workspace/chain";
import { describe, expect, it } from "vitest";
import { SEED_BUCKETS } from "./seed-data";

describe("seed buckets on chain", () => {
  it("each has the chain bucket ID the deploy seed creates, in creation order", () => {
    expect(Object.keys(DEMO_BUCKET_CHAIN_IDS)).toEqual(SEED_BUCKETS.map((b) => b.name));
    SEED_BUCKETS.forEach((bucket, index) => {
      expect(DEMO_BUCKET_CHAIN_IDS[bucket.name]).toBe(BigInt(index + 1));
    });
  });
});
