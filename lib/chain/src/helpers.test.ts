import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  AUTH_STATUSES,
  authStatusName,
  cardStatusName,
  engineDecisionValue,
  reasonCodeName,
  reasonCodeValue,
  REASON_CODES,
} from "./codes";
import { DEFAULT_EXPLORER_URL, explorerAddressUrl, explorerTxUrl } from "./explorer";
import { chainId, memberChainId, merchantChainId } from "./ids";
import { toJsonSafe } from "./json";

const sha256Hex = (text: string) =>
  `0x${createHash("sha256").update(text, "utf8").digest("hex")}`;

describe("chain IDs", () => {
  it("are the SHA-256 of the key, so stored member IDs never change", () => {
    expect(chainId("demo-family:member:parent")).toBe(
      sha256Hex("demo-family:member:parent"),
    );
    expect(memberChainId("grandparent")).toBe(
      sha256Hex("demo-family:member:grandparent"),
    );
    expect(merchantChainId("trader-joes")).toBe(
      sha256Hex("demo-family:merchant:trader-joes"),
    );
  });

  it("are bytes32 hex and differ between members and merchants", () => {
    expect(memberChainId("parent")).toMatch(/^0x[0-9a-f]{64}$/);
    expect(memberChainId("x")).not.toBe(merchantChainId("x"));
    expect(() => chainId("")).toThrow();
  });
});

describe("explorer links", () => {
  it("build transaction and address pages, ignoring a trailing slash", () => {
    expect(explorerTxUrl(DEFAULT_EXPLORER_URL, "0xabc")).toBe(
      "https://testnet.monadvision.com/tx/0xabc",
    );
    expect(explorerAddressUrl("https://explorer.example/", "0xdef")).toBe(
      "https://explorer.example/address/0xdef",
    );
  });
});

describe("enum names", () => {
  it("follow the Solidity declaration order", () => {
    expect(REASON_CODES.indexOf("outside_hours")).toBe(6);
    expect(AUTH_STATUSES.indexOf("captured")).toBe(5);
    expect(reasonCodeName(2n)).toBe("insufficient_funds");
    expect(authStatusName(3)).toBe("parent_approved");
    expect(cardStatusName(2n)).toBe("frozen");
    expect(reasonCodeValue("needs_approval")).toBe(5);
    expect(engineDecisionValue("reject")).toBe(2);
  });

  it("reject values the contract does not define", () => {
    expect(() => authStatusName(6n)).toThrow(RangeError);
  });
});

describe("toJsonSafe", () => {
  it("turns big numbers into decimal strings, recursively", () => {
    expect(
      toJsonSafe({ amount: 2n ** 70n, nested: [1n, "x", true, null] }),
    ).toEqual({
      amount: "1180591620717411303424",
      nested: ["1", "x", true, null],
    });
  });

  it("refuses values JSON cannot hold", () => {
    expect(() => toJsonSafe(undefined)).toThrow();
    expect(() => toJsonSafe(Number.NaN)).toThrow();
  });
});
