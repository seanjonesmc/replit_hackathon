/**
 * A failure the caller can act on, with a message safe to show a user.
 * Routes map `kind` to an HTTP status; services never deal in HTTP.
 *
 * - `not_found`: a named member, bank account, bucket or the family is missing.
 * - `conflict`: the request duplicates something that already exists.
 * - `rule`: well-formed but not allowed, e.g. the bank balance is too low.
 */
export type FamilyErrorKind = "not_found" | "conflict" | "rule";

export class FamilyServiceError extends Error {
  constructor(
    readonly kind: FamilyErrorKind,
    message: string,
  ) {
    super(message);
    this.name = "FamilyServiceError";
  }
}

/** Formats integer cents as dollars for user-facing messages, e.g. $12.50. */
export function formatCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100).toLocaleString("en-US");
  return `${sign}$${dollars}.${String(abs % 100).padStart(2, "0")}`;
}

/** The largest value an integer cents column can hold. */
export const MAX_CENTS = 2_147_483_647;
