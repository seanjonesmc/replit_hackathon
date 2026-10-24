// @vitest-environment happy-dom
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CardAndPolicy } from '@workspace/api-client-react';
import { byTestId, cleanupApi, countCalls, mockApi, renderWithApi, settle } from '@/test/api-test-utils';
import ParentCardPolicy from '../ParentCardPolicy';
import { matchGroups } from './rule-groups';

const chain = { status: 'not_submitted', txHash: null, confirmedAt: null, explorerUrl: null } as const;
const card = {
  id: 3,
  dependentId: 4,
  dependentName: 'Sample Teen',
  last4: '0000',
  expiryMonth: 10,
  expiryYear: 2029,
  status: 'active',
  onchainCardId: null,
  chain,
} as const;

const cardAndPolicy: CardAndPolicy = {
  card,
  policy: {
    presetName: 'Balanced',
    timeZone: 'America/Los_Angeles',
    bucketRules: [],
    lines: [
      { kind: 'block', text: 'Bars and gaming are always declined' },
      { kind: 'limit', text: 'Food: up to $60.00 per purchase' },
      { kind: 'ask', text: 'Food purchases over $75.00 need a quick OK from Sample Parent' },
      { kind: 'time', text: 'Nothing between 11pm and 6am without an OK from Sample Parent' },
    ],
    updatedAt: new Date().toISOString(),
  },
  blockedCategories: [
    { category: 'bar', label: 'Bars' },
    { category: 'gaming', label: 'Gaming' },
  ],
};

/** Advances fake time in small steps so React commits and re-arms each timer. */
const advance = (ms: number) => {
  for (let t = 0; t < ms; t += 20) {
    act(() => {
      vi.advanceTimersByTime(20);
    });
  }
};
const click = (id: string) =>
  act(() => {
    byTestId(id)!.click();
  });
const lines = (kind: string) => document.querySelectorAll(`[data-testid="card-policy"] [data-testid="policy-line-${kind}"]`).length;

afterEach(() => {
  vi.useRealTimers();
  cleanupApi();
});

describe('the simulated rules builder', () => {
  it('starts trimmed, and a chip plus "Looks right" adds the blocked line and "Always declined"', async () => {
    const calls = mockApi({
      'GET /api/card': { body: card },
      'GET /api/family/card-policy': { body: cardAndPolicy },
    });
    renderWithApi(<ParentCardPolicy />);
    await settle();

    expect(lines('limit')).toBe(1);
    expect(lines('block') + lines('ask') + lines('time')).toBe(0);
    expect(byTestId('section-blocked')).toBeNull();
    expect(byTestId('text-policy-name')?.textContent).not.toBe('Balanced');
    expect((byTestId('button-policy-builder') as HTMLButtonElement).disabled).toBe(false);

    vi.useFakeTimers();
    click('button-policy-builder');
    click('chip-rule-blocked');
    advance(5000); // typing finishes
    expect((byTestId('input-policy-text') as HTMLTextAreaElement).value).toBe('No bars, liquor stores, casinos, clubs or gaming for Sample Teen.');

    click('button-build-rules');
    expect(byTestId('list-thinking-steps')).not.toBeNull();
    advance(4000); // stages, then review lines
    advance(1000);
    expect(byTestId('card-rules-review')).not.toBeNull();
    expect(document.querySelectorAll('[data-testid^="review-line-"]').length).toBe(1);

    click('button-confirm-rules');
    advance(2000);
    expect(byTestId('sheet-policy-builder')).toBeNull();
    expect(lines('block')).toBe(1);
    expect(lines('ask') + lines('time')).toBe(0);
    expect(byTestId('section-blocked')).not.toBeNull();
    expect(byTestId('list-blocked-categories')?.textContent).toContain('Bars');
    expect(byTestId('text-policy-name')?.textContent).toBe('Balanced');
    // Nothing is sent to the server.
    expect(calls.filter((c) => c.method !== 'GET')).toHaveLength(0);
    expect(countCalls(calls, 'GET', '/api/family/card-policy')).toBe(1);
  });
});

describe('keyword matching for typed rules', () => {
  it('maps words to rule groups and falls back to all of them', () => {
    expect([...matchGroups('No casinos please')]).toEqual(['blocked']);
    expect([...matchGroups('ask me over $50')]).toEqual(['ask']);
    expect([...matchGroups('Nothing late at night')]).toEqual(['time']);
    expect([...matchGroups('be sensible')].sort()).toEqual(['ask', 'blocked', 'time']);
  });
});
