import type { PolicyLine } from '@workspace/api-client-react';

/**
 * The simulated plain-English builder (front end only). It never parses or
 * saves anything: it reveals groups of lines the real policy already has, so
 * the screen never shows a rule the card doesn't enforce.
 */
export type RuleGroup = 'blocked' | 'ask' | 'time';

export const ALL_GROUPS: readonly RuleGroup[] = ['blocked', 'ask', 'time'];

/** Which group a policy line belongs to; per-purchase limits are always shown. */
export function groupOfLine(line: PolicyLine): RuleGroup | null {
  switch (line.kind) {
    case 'block':
      return 'blocked';
    case 'ask':
      return 'ask';
    case 'time':
      return 'time';
    default:
      return null;
  }
}

/** Lines to show on the policy card, given the groups applied so far. */
export function visibleLines(lines: PolicyLine[], applied: ReadonlySet<RuleGroup>): PolicyLine[] {
  return lines.filter((l) => {
    const g = groupOfLine(l);
    return g === null || applied.has(g);
  });
}

/** Lines belonging to `groups`, in the policy's own order. */
export function linesForGroups(lines: PolicyLine[], groups: ReadonlySet<RuleGroup>): PolicyLine[] {
  return lines.filter((l) => {
    const g = groupOfLine(l);
    return g !== null && groups.has(g);
  });
}

const KEYWORDS: Record<RuleGroup, RegExp> = {
  blocked: /\b(bars?|liquor|alcohol|casinos?|gambl\w*|clubs?|nightclubs?|gaming|games?)\b/i,
  ask: /\b(ask|over|big|approv\w*|ok)\b|\$/i,
  time: /\b(night|late|pm|midnight)\b|\d\s*(pm|am)\b/i,
};

/** Keyword match for typed text; nothing recognised falls back to every group. */
export function matchGroups(text: string): Set<RuleGroup> {
  const found = new Set(ALL_GROUPS.filter((g) => KEYWORDS[g].test(text)));
  return found.size > 0 ? found : new Set(ALL_GROUPS);
}

export interface RuleSuggestion {
  id: string;
  label: string;
  text: string;
}

/** Suggestion chips from the demo material; the last one types the script line. */
export function ruleSuggestions(dependentName: string): RuleSuggestion[] {
  return [
    { id: 'blocked', label: 'No bars or gaming', text: `No bars, liquor stores, casinos, clubs or gaming for ${dependentName}.` },
    { id: 'ask', label: 'Ask before anything big', text: 'Ask me before anything big, like that $129 Apple Store purchase.' },
    { id: 'time', label: 'Nothing late at night', text: 'Nothing between 11pm and 6am without asking me first.' },
    { id: 'all', label: 'Use all three', text: 'No bars, no gaming, and ask me before anything over $75. Nothing late at night.' },
  ];
}
