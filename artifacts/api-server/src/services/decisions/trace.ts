import { BRAND } from "@brand/brand.config";
import type { SettlementState, SettlementStep, SwipeTraceStep } from "@workspace/api-zod";
import type { Authorization } from "@workspace/db";

/**
 * Plain-words copy for the card flow around a swipe and a settlement. The
 * card network and the issuer are simulated: no real card network, issuer or
 * bank is involved. Amounts on chain are test tokens shown as USDC.
 */

/** "18.40" for 1840 cents. */
export function tokenAmount(cents: number): string {
  return (cents / 100).toFixed(2);
}

/** "$18.40" for 1840 cents. */
export function dollars(cents: number): string {
  return `$${tokenAmount(cents)}`;
}

/** Where an approved purchase's money stands; null when it moved none. */
export function settlementState(
  a: Pick<Authorization, "decision" | "bucketId" | "settledAt">,
): SettlementState | null {
  if (a.decision !== "APPROVED" || a.bucketId === null) return null;
  return a.settledAt ? "settled" : "held";
}

/**
 * The swipe's steps as the card network would run them: the network asks
 * the issuer, the issuer asks the app, the rules (and the AI guard when it
 * decided) check it, the money is held or not, and the decision.
 */
export function swipeTrace(
  a: Pick<Authorization, "decision" | "decidedBy" | "amountCents" | "merchantName" | "aiConfidence">,
  bucketName: string | null,
): SwipeTraceStep[] {
  const amount = dollars(a.amountCents);
  const steps: SwipeTraceStep[] = [
    { label: `Visa asked the card issuer to approve ${amount} at ${a.merchantName}`, state: "done" },
    { label: `The card issuer asked ${BRAND.appName}`, state: "done" },
    { label: "Family rules checked", state: "done" },
  ];
  if (a.decidedBy === "ai_guard") {
    const confidence =
      a.aiConfidence === null ? "" : ` (${Math.round(a.aiConfidence * 100)}% sure)`;
    steps.push({ label: `AI guard checked the items${confidence}`, state: "done" });
  }
  if (a.decision === "APPROVED" && bucketName !== null) {
    steps.push({
      label: `${tokenAmount(a.amountCents)} USDC held in ${bucketName}, not paid yet`,
      state: "held",
    });
    steps.push({ label: "Approved", state: "approved" });
  } else if (a.decision === "PENDING") {
    steps.push({ label: "Nothing held, no money moved", state: "skipped" });
    steps.push({ label: "Waiting for a parent's OK", state: "pending" });
  } else {
    steps.push({ label: "Nothing held, no money moved", state: "skipped" });
    steps.push({ label: a.decision === "APPROVED" ? "Approved" : "Declined", state: a.decision === "APPROVED" ? "approved" : "rejected" });
  }
  return steps;
}

/**
 * The three settlement steps for one purchase. Only the vault's release is
 * real (a testnet capture); the network's dollar payment and the issuer's
 * redemption are simulated and say so.
 */
export function settlementSteps(
  a: Pick<Authorization, "amountCents" | "merchantName">,
  captureChain: SettlementStep["chain"],
): SettlementStep[] {
  const amount = dollars(a.amountCents);
  const tokens = `${tokenAmount(a.amountCents)} USDC`;
  return [
    {
      key: "network_paid_merchant",
      label: `Visa paid ${a.merchantName} ${amount} from the card issuer's account`,
      detail: "Simulated: no real card network is involved.",
      simulated: true,
      chain: null,
    },
    {
      key: "vault_paid_issuer",
      label: `The vault released ${tokens} to the card issuer`,
      detail: "On Monad testnet, with test tokens standing in for USDC.",
      simulated: false,
      chain: captureChain,
    },
    {
      key: "issuer_redeemed",
      label: `The card issuer redeemed ${tokens} with the partner bank for ${amount}`,
      detail: "Simulated: no real bank is involved.",
      simulated: true,
      chain: null,
    },
  ];
}
