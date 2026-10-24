import { describe, expect, it } from 'vitest';
import { formatCents, formatDecisionTime, formatSignedCents } from './format';
import { cn } from './utils';

describe('money formatting', () => {
  it('formats cents as dollars with a leading minus for spending', () => {
    expect(formatCents(1840)).toBe('$18.40');
    expect(formatCents(-11480)).toBe('-$114.80');
    expect(formatCents(123456)).toBe('$1,234.56');
  });

  it('adds a plus sign only to money in', () => {
    expect(formatSignedCents(5000)).toBe('+$50.00');
    expect(formatSignedCents(-1840)).toBe('-$18.40');
    expect(formatSignedCents(0)).toBe('$0.00');
  });
});

describe('formatDecisionTime', () => {
  const now = new Date(2026, 9, 24, 16, 0);
  // ICU may put a narrow no-break space before AM/PM.
  const formatDecisionTimeText = (at: Date) => formatDecisionTime(at, now).replace(/\s/g, ' ');

  it('says Today for the same calendar day', () => {
    expect(formatDecisionTimeText(new Date(2026, 9, 24, 12, 41))).toBe('Today at 12:41 PM');
  });

  it('says Yesterday for the previous calendar day', () => {
    expect(formatDecisionTimeText(new Date(2026, 9, 23, 9, 5))).toBe('Yesterday at 9:05 AM');
  });

  it('falls back to a short date', () => {
    expect(formatDecisionTimeText(new Date(2026, 9, 20, 18, 30))).toBe('Oct 20 at 6:30 PM');
  });
});

describe('cn', () => {
  it('lets a later brand radius override an earlier one', () => {
    expect(cn('rounded-input', 'rounded-full')).toBe('rounded-full');
    expect(cn('rounded-card', 'rounded-pill')).toBe('rounded-pill');
  });
});
