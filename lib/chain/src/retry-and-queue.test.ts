import { describe, expect, it } from "vitest";
import { SerialQueue } from "./queue";
import {
  isAlreadyKnownError,
  isNonceError,
  isTransientRpcError,
  withRetry,
} from "./retry";

/** The shape ethers gives a JSON-RPC error it could not classify. */
const rpcError = (code: number, message: string) =>
  Object.assign(new Error("could not coalesce error"), {
    code: "UNKNOWN_ERROR",
    error: { code, message },
  });

describe("RPC error classification", () => {
  it("treats connection, timeout and rate-limit failures as transient", () => {
    expect(isTransientRpcError(Object.assign(new Error("x"), { code: "TIMEOUT" }))).toBe(true);
    expect(
      isTransientRpcError(new Error("fetch failed", { cause: { code: "ECONNRESET" } })),
    ).toBe(true);
    expect(isTransientRpcError(rpcError(-32005, "request limit reached"))).toBe(true);
    expect(isTransientRpcError(rpcError(-32000, "Too Many Requests"))).toBe(true);
  });

  it("never retries reverts, nonce errors or duplicates", () => {
    const revert = Object.assign(new Error("execution reverted"), {
      code: "CALL_EXCEPTION",
      data: "0x1234abcd",
      info: { error: { message: "timeout" } },
    });
    expect(isTransientRpcError(revert)).toBe(false);
    expect(isTransientRpcError(rpcError(-32000, "nonce too low"))).toBe(false);
    expect(isTransientRpcError(rpcError(-32000, "already known"))).toBe(false);
    expect(isTransientRpcError(rpcError(-32000, "insufficient funds"))).toBe(false);
  });

  it("recognises nonce and already-known errors from the message or code", () => {
    expect(isNonceError(Object.assign(new Error("x"), { code: "NONCE_EXPIRED" }))).toBe(true);
    expect(isNonceError(rpcError(-32000, "Nonce too high"))).toBe(true);
    expect(isNonceError(rpcError(-32000, "gas too low"))).toBe(false);
    expect(isAlreadyKnownError(rpcError(-32000, "known transaction: 0xabc"))).toBe(true);
  });
});

describe("withRetry", () => {
  it("retries transient failures, then gives up with the last error", async () => {
    let calls = 0;
    const flaky = () => {
      calls++;
      return calls < 3 ? Promise.reject(rpcError(-32005, "limit")) : Promise.resolve("ok");
    };
    await expect(withRetry(flaky, { attempts: 3, baseDelayMs: 1 })).resolves.toBe("ok");

    calls = 0;
    const down = () => {
      calls++;
      return Promise.reject(rpcError(-32005, "limit"));
    };
    await expect(withRetry(down, { attempts: 2, baseDelayMs: 1 })).rejects.toThrow();
    expect(calls).toBe(2);
  });

  it("does not retry other failures", async () => {
    let calls = 0;
    const failing = () => {
      calls++;
      return Promise.reject(rpcError(-32000, "nonce too low"));
    };
    await expect(withRetry(failing, { attempts: 5, baseDelayMs: 1 })).rejects.toThrow();
    expect(calls).toBe(1);
  });
});

describe("SerialQueue", () => {
  it("starts each job only after the previous job's hold settles", async () => {
    const queue = new SerialQueue();
    const log: string[] = [];
    let releaseFirst!: () => void;
    const firstHold = new Promise<void>((resolve) => (releaseFirst = resolve));

    const first = queue.run(async () => {
      log.push("first sent");
      return { value: 1, holdUntil: firstHold };
    });
    const second = queue.run(async () => {
      log.push("second sent");
      return { value: 2, holdUntil: Promise.resolve() };
    });

    expect(await first).toBe(1);
    expect(log).toEqual(["first sent"]);
    releaseFirst();
    expect(await second).toBe(2);
    expect(log).toEqual(["first sent", "second sent"]);
  });

  it("keeps going after a job fails or its hold rejects", async () => {
    const queue = new SerialQueue();
    const failed = queue.run(async () => {
      throw new Error("estimate reverted");
    });
    const rejectedHold = queue.run(async () => ({
      value: "sent",
      holdUntil: Promise.reject(new Error("timed out")),
    }));
    const next = queue.run(async () => ({ value: "next", holdUntil: Promise.resolve() }));

    await expect(failed).rejects.toThrow("estimate reverted");
    expect(await rejectedHold).toBe("sent");
    expect(await next).toBe("next");
  });
});
