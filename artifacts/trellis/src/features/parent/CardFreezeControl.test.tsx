// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import type { Card, CardAndPolicy } from '@workspace/api-client-react';
import { byTestId, cleanupApi, countCalls, mockApi, renderWithApi, settle } from '@/test/api-test-utils';
import ParentCardPolicy from './ParentCardPolicy';

const chain = { status: 'not_submitted', txHash: null, confirmedAt: null } as const;

const card = (status: Card['status']): Card => ({
  id: 3,
  dependentId: 4,
  dependentName: 'Sample Teen',
  last4: '0000',
  expiryMonth: 10,
  expiryYear: 2029,
  status,
  onchainCardId: null,
  chain,
});

const cardAndPolicy = (status: Card['status']): CardAndPolicy => ({
  card: card(status),
  policy: { presetName: 'Balanced', timeZone: 'America/Los_Angeles', bucketRules: [], lines: [], updatedAt: new Date().toISOString() },
  blockedCategories: [],
});

/** A card whose status the freeze routes change, like the server's. */
function cardApi(start: Card['status'] = 'active') {
  let status = start;
  return mockApi({
    'GET /api/card': () => ({ body: card(status) }),
    'GET /api/family/card-policy': () => ({ body: cardAndPolicy(status) }),
    'POST /api/card/freeze': () => {
      status = 'frozen';
      return { body: card(status) };
    },
    'POST /api/card/unfreeze': () => {
      status = 'active';
      return { body: card(status) };
    },
  });
}

const freezeButton = () => byTestId('button-freeze-card') as HTMLButtonElement;

afterEach(() => cleanupApi());

describe("the parent's freeze switch", () => {
  it('freezes the card, shows it frozen at once, and unfreezes it again', async () => {
    const calls = cardApi();
    renderWithApi(<ParentCardPolicy />);
    await settle();
    expect(freezeButton().textContent).toBe('Freeze card');
    expect(byTestId('state-card-frozen')).toBeNull();

    freezeButton().click();
    await settle();
    expect(countCalls(calls, 'POST', '/api/card/freeze')).toBe(1);
    expect(freezeButton().textContent).toBe('Unfreeze card');
    expect(byTestId('state-card-frozen')).not.toBeNull();
    expect(byTestId('text-card-status')?.textContent).toContain('Frozen');

    freezeButton().click();
    await settle();
    expect(countCalls(calls, 'POST', '/api/card/unfreeze')).toBe(1);
    expect(freezeButton().textContent).toBe('Freeze card');
    expect(byTestId('state-card-frozen')).toBeNull();
  });

  it("can't freeze a card that isn't active yet", async () => {
    cardApi('issued');
    renderWithApi(<ParentCardPolicy />);
    await settle();
    expect(freezeButton().disabled).toBe(true);
  });

  it("shows the server's reason when freezing fails", async () => {
    mockApi({
      'GET /api/card': { body: card('active') },
      'GET /api/family/card-policy': { body: cardAndPolicy('active') },
      'POST /api/card/freeze': { status: 409, body: { error: 'The card is already frozen.' } },
    });
    renderWithApi(<ParentCardPolicy />);
    await settle();

    freezeButton().click();
    await settle();
    expect(byTestId('text-freeze-error')?.textContent).toBe('The card is already frozen.');
    expect(freezeButton().textContent).toBe('Freeze card');
  });
});
