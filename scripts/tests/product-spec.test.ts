import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const workspaceRoot = path.resolve(import.meta.dirname, "..", "..");
const SPEC = "docs/product-spec.md";

/**
 * SHA-256 and size of the user's original master prompt, kept byte-for-byte as
 * the source of requirements for every phase. It must never be edited — not by
 * formatters, search-and-replace rebrands, or well-meaning fixes. Record
 * decisions and deviations in docs/stack-decisions.md, or in a plan under
 * docs/plans/, instead.
 */
const SPEC_SHA256 = "436a28ede34aa42257d88bd0d8eaf2b0daeb30aefee860fd9b0dd42427e2f8e6";
const SPEC_BYTES = 25326;

const NEVER_EDIT =
  `${SPEC} is the user's original product spec and must never be edited. ` +
  "Restore it from git, and put changes in docs/stack-decisions.md or a plan under docs/plans/.";

describe("immutable product spec", () => {
  it("is preserved byte-for-byte", () => {
    const bytes = fs.readFileSync(path.join(workspaceRoot, SPEC));
    expect(bytes.length, NEVER_EDIT).toBe(SPEC_BYTES);
    expect(createHash("sha256").update(bytes).digest("hex"), NEVER_EDIT).toBe(SPEC_SHA256);
  });
});
