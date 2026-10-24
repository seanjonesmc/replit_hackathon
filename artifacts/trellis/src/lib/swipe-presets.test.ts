import { describe, expect, it } from 'vitest';
import type { Merchant } from '@workspace/api-client-react';
import { SWIPE_PRESETS, arrangeMerchants, buildSwipeRequest, formatClock, lastFamilyClockTime } from './swipe-presets';

const TZ = 'America/Los_Angeles';

const merchant = (id: number, name: string, mcc: string, category: string): Merchant => ({
  id,
  name,
  mcc,
  category,
  onchainId: `0x${String(id).padStart(64, '0')}`,
  chain: { status: 'not_submitted', txHash: null, confirmedAt: null },
});

// The seed's merchants, in seed order.
const SEEDED = [
  merchant(1, "Trader Joe's", '5411', 'grocery'),
  merchant(2, 'Campus Bookstore', '5942', 'bookstore'),
  merchant(3, 'The Tipsy Tavern', '5813', 'bar'),
  merchant(4, 'Liquor Barn', '5921', 'liquor'),
  merchant(5, 'Lucky Star Casino', '7995', 'gambling'),
  merchant(6, 'Steam', '5816', 'gaming'),
  merchant(7, 'Uber', '4121', 'rideshare'),
  merchant(8, 'Apple Store', '5732', 'electronics'),
  merchant(9, 'AMC', '7832', 'movies'),
];

describe('the spec presets', () => {
  it("are the spec's six demo swipes with their amounts, and only Uber has a set time (2:10am)", () => {
    const spec = SWIPE_PRESETS.filter((p) => p.spec).map((p) => [p.merchantName, p.amountCents, p.clock ?? null]);
    expect(spec).toEqual([
      ["Trader Joe's", 18_40, null],
      ['Campus Bookstore', 24_00, null],
      ['The Tipsy Tavern', 32_00, null],
      ['Steam', 14_99, null],
      ['Uber', 22_00, '02:10'],
      ['Apple Store', 129_00, null],
    ]);
  });

  it('give every seeded merchant a purchase', () => {
    for (const { preset } of arrangeMerchants(SEEDED)) expect(preset).not.toBeNull();
  });
});

describe('arrangeMerchants', () => {
  it('puts the six presets first in spec order, then the rest in seed order, then unknown merchants', () => {
    const extra = merchant(10, 'Corner Shop', '5499', 'grocery');
    const names = arrangeMerchants([extra, ...SEEDED]).map((m) => m.merchant.name);
    expect(names).toEqual([
      "Trader Joe's",
      'Campus Bookstore',
      'The Tipsy Tavern',
      'Steam',
      'Uber',
      'Apple Store',
      'AMC',
      'Liquor Barn',
      'Lucky Star Casino',
      'Corner Shop',
    ]);
    expect(arrangeMerchants([extra])[0]!.preset).toBeNull();
  });
});

describe('lastFamilyClockTime', () => {
  it('uses today on the family clock once that time has passed', () => {
    expect(lastFamilyClockTime('02:10', new Date('2026-10-24T15:00:00-07:00'), TZ)).toBe('2026-10-24T02:10:00');
  });

  it('uses yesterday before that time, so the swipe is never in the future', () => {
    expect(lastFamilyClockTime('02:10', new Date('2026-10-24T01:30:00-07:00'), TZ)).toBe('2026-10-23T02:10:00');
    expect(lastFamilyClockTime('02:10', new Date('2026-11-01T01:00:00-07:00'), TZ)).toBe('2026-10-31T02:10:00');
  });

  it("reads the family's clock, not the browser's or UTC", () => {
    // 08:00 UTC on Oct 24 is 1:00am on Oct 24 in Los Angeles: before 2:10am there.
    expect(lastFamilyClockTime('02:10', new Date('2026-10-24T08:00:00Z'), TZ)).toBe('2026-10-23T02:10:00');
    // The same instant is already past 2:10am in Tokyo (5pm).
    expect(lastFamilyClockTime('02:10', new Date('2026-10-24T08:00:00Z'), 'Asia/Tokyo')).toBe('2026-10-24T02:10:00');
  });
});

describe('buildSwipeRequest', () => {
  const card = { id: 3, dependentId: 4 };
  const now = new Date('2026-10-24T14:30:00-07:00');
  const presetFor = (name: string) => SWIPE_PRESETS.find((p) => p.merchantName === name)!;

  it('sends the seeded merchant, the preset purchase and the moment of the swipe', () => {
    const req = buildSwipeRequest({ card, merchant: SEEDED[0]!, preset: presetFor("Trader Joe's"), now, timeZone: TZ });
    expect(req).toEqual({
      cardId: 3,
      dependentId: 4,
      merchantId: 1,
      merchantName: "Trader Joe's",
      mcc: '5411',
      merchantCategory: 'grocery',
      items: ['bananas', 'oat milk', 'pasta'],
      amount: 18_40,
      location: 'Westwood, Los Angeles',
      timestamp: now.toISOString(),
    });
  });

  it('sends the late-night ride at 2:10am on the family clock', () => {
    const req = buildSwipeRequest({ card, merchant: SEEDED[6]!, preset: presetFor('Uber'), now, timeZone: TZ });
    expect(req.amount).toBe(22_00);
    expect(req.timestamp).toBe('2026-10-24T02:10:00');
  });
});

describe('formatClock', () => {
  it.each([
    ['02:10', '2:10am'],
    ['00:00', '12am'],
    ['12:30', '12:30pm'],
    ['23:00', '11pm'],
  ])('%s -> %s', (hhmm, label) => {
    expect(formatClock(hhmm)).toBe(label);
  });
});
