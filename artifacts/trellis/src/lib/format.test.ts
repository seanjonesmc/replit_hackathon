import { describe, expect, it } from 'vitest';
import { formatCents, formatCentsShort, formatDecisionTime, formatDurationMs, formatSignedCents, formatUsdc, parseDollarsToCents } from './format';
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

describe('formatDurationMs', () => {
  it.each([
    [0.4, 'under 1 ms'],
    [1, '1.0 ms'],
    [3.27, '3.3 ms'],
    [9.96, '10 ms'],
    [812.6, '813 ms'],
    [999.6, '1.0 s'],
    [1520, '1.5 s'],
  ])('%s ms -> %s', (ms, label) => {
    expect(formatDurationMs(ms)).toBe(label);
  });
});

describe('send-money amounts', () => {
  it('shows whole dollars without cents, and the same amount in USDC', () => {
    expect(formatCentsShort(5000)).toBe('$50');
    expect(formatCentsShort(1250)).toBe('$12.50');
    expect(formatUsdc(5000)).toBe('50 USDC');
    expect(formatUsdc(1250)).toBe('12.50 USDC');
    expect(formatUsdc(500000)).toBe('5,000 USDC');
  });

  it('parses typed dollars into cents and rejects anything else', () => {
    expect(parseDollarsToCents('50')).toBe(5000);
    expect(parseDollarsToCents('$12.5')).toBe(1250);
    expect(parseDollarsToCents('1,000.05')).toBe(100005);
    for (const bad of ['', '0', '0.00', '-5', '12.345', 'abc', '5e3']) {
      expect(parseDollarsToCents(bad)).toBeNull();
    }
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
