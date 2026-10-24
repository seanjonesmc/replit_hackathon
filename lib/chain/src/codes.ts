/**
 * Names for the FamilyCardNetwork enums. Each list is in the Solidity
 * declaration order, so a name's index is its on-chain value. Reason codes use
 * the product spec's card-network names.
 */

export const REASON_CODES = [
  "approved",
  "blocked_category",
  "insufficient_funds",
  "over_limit",
  "card_inactive",
  "needs_approval",
  "outside_hours",
] as const;
export type ReasonCode = (typeof REASON_CODES)[number];

export const AUTH_STATUSES = [
  "approved",
  "declined",
  "pending",
  "parent_approved",
  "parent_declined",
  "captured",
] as const;
export type AuthStatus = (typeof AUTH_STATUSES)[number];

export const CARD_STATUSES = ["issued", "active", "frozen"] as const;
export type CardStatus = (typeof CARD_STATUSES)[number];

/** The backend decision engine's verdict, passed into `authorize`. */
export const ENGINE_DECISIONS = ["approve", "pending", "reject"] as const;
export type EngineDecision = (typeof ENGINE_DECISIONS)[number];

function nameAt<T extends string>(
  names: readonly T[],
  value: bigint | number,
  enumName: string,
): T {
  const index = Number(value);
  const name = Number.isInteger(index) ? names[index] : undefined;
  if (name === undefined) {
    throw new RangeError(`Unknown ${enumName} value: ${String(value)}`);
  }
  return name;
}

function valueOf<T extends string>(
  names: readonly T[],
  name: T,
  enumName: string,
): number {
  const index = names.indexOf(name);
  if (index < 0) throw new RangeError(`Unknown ${enumName}: ${name}`);
  return index;
}

export const reasonCodeName = (value: bigint | number): ReasonCode =>
  nameAt(REASON_CODES, value, "reason code");
export const authStatusName = (value: bigint | number): AuthStatus =>
  nameAt(AUTH_STATUSES, value, "authorization status");
export const cardStatusName = (value: bigint | number): CardStatus =>
  nameAt(CARD_STATUSES, value, "card status");

export const reasonCodeValue = (name: ReasonCode): number =>
  valueOf(REASON_CODES, name, "reason code");
export const engineDecisionValue = (name: EngineDecision): number =>
  valueOf(ENGINE_DECISIONS, name, "engine decision");
