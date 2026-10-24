import { formatMoney } from "../family/format";
import { categoryLabel, joinWithAnd } from "../family/labels";

export interface PolicyLineInput {
  parentName: string;
  blockedCategories: string[];
  buckets: { name: string; perPurchaseLimitCents: number; approvalThresholdCents: number }[];
  /** Family-wide "ask me before anything over" amount, if set. */
  approvalThresholdCents: number | null;
  /** 24-hour HH:MM windows; purchases inside one need a parent's OK. */
  timeWindows: { start: string; end: string }[];
}

export interface PolicyLine {
  kind: "block" | "ask" | "limit" | "time";
  text: string;
}

/** "23:00" → "11pm", "06:30" → "6:30am". */
export function clockLabel(hhmm: string): string {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  const suffix = h < 12 ? "am" : "pm";
  const twelve = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${twelve}${suffix}` : `${twelve}:${String(m).padStart(2, "0")}${suffix}`;
}

/**
 * The current policy as short plain-English lines for the policy card. Values
 * are stated exactly as stored, even where they overlap (for example a bucket
 * whose per-purchase limit is below its approval threshold).
 */
export function describePolicy(input: PolicyLineInput): PolicyLine[] {
  const lines: PolicyLine[] = [];
  if (input.blockedCategories.length > 0) {
    const labels = input.blockedCategories.map(categoryLabel);
    const [first, ...rest] = labels;
    const phrase = joinWithAnd([first!, ...rest.map((l) => l.toLowerCase())]);
    lines.push({ kind: "block", text: `${phrase} are always declined` });
  }
  for (const b of input.buckets) {
    lines.push({
      kind: "limit",
      text: `${b.name}: up to ${formatMoney(b.perPurchaseLimitCents)} per purchase`,
    });
    lines.push({
      kind: "ask",
      text: `${b.name} purchases over ${formatMoney(b.approvalThresholdCents)} need a quick OK from ${input.parentName}`,
    });
  }
  if (input.approvalThresholdCents !== null) {
    lines.push({
      kind: "ask",
      text: `Anything over ${formatMoney(input.approvalThresholdCents)} needs a quick OK from ${input.parentName}`,
    });
  }
  for (const w of input.timeWindows) {
    lines.push({
      kind: "time",
      text: `Nothing between ${clockLabel(w.start)} and ${clockLabel(w.end)} without an OK from ${input.parentName}`,
    });
  }
  return lines;
}
