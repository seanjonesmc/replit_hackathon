// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { BRAND } from '@brand/brand.config';
import { useListApprovals, type Authorization, type Card, type Merchant, type SwipeResult } from '@workspace/api-client-react';
import { act } from 'react';
import {
  byTestId,
  changeValue,
  cleanupApi,
  countCalls,
  mockApi,
  renderWithApi,
  settle,
  wait,
  type ApiRoutes,
} from '@/test/api-test-utils';
import { ANSWER_POLL_MS } from './SwipeResultDialog';
import SwipeSimulator from './SwipeSimulator';

const chain = { status: 'not_submitted', txHash: null, confirmedAt: null, explorerUrl: null } as const;

const card = (status: Card['status'] = 'active'): Card => ({
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

const merchant = (id: number, name: string, mcc: string, category: string): Merchant => ({
  id,
  name,
  mcc,
  category,
  onchainId: `0x${String(id).padStart(64, '0')}`,
  chain,
});

// The seed's merchants, in seed order (the grid reorders them).
const MERCHANTS = [
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

const policy = {
  familyId: 1,
  presetName: 'Balanced',
  timeZone: 'America/Los_Angeles',
  policy: { buckets: [], blockedCategories: [], approvalThresholdCents: null, timeWindows: [], blockedMerchants: [], allowedMerchants: [] },
};

const pendingRide: SwipeResult = {
  authorizationId: 41,
  decision: 'PENDING',
  reasonCode: 'outside_hours',
  reason: 'Late-night purchases need a quick OK first.',
  decidedBy: 'Rule',
  aiConfidence: null,
  bucketId: null,
  bucketName: null,
  decisionMs: 0.42,
  trace: [
    { label: 'Visa asked the card issuer to approve $22.00 at Uber', state: 'done' },
    { label: 'Family rules checked', state: 'done' },
    { label: 'Nothing held, no money moved', state: 'skipped' },
    { label: "Waiting for a parent's OK", state: 'pending' },
  ],
  chain,
};

const heldGroceries: SwipeResult = {
  authorizationId: 42,
  decision: 'APPROVED',
  reasonCode: 'approved',
  reason: 'Groceries fit the Food bucket.',
  decidedBy: 'Rule',
  aiConfidence: null,
  bucketId: 1,
  bucketName: 'Food',
  decisionMs: 3.1,
  trace: [
    { label: "Visa asked the card issuer to approve $18.40 at Trader Joe's", state: 'done' },
    { label: 'Family rules checked', state: 'done' },
    { label: '18.40 USDC held in Food, not paid yet', state: 'held' },
    { label: 'Approved', state: 'approved' },
  ],
  chain,
};

const storedRide = (body: { amount: number; timestamp: string }): Authorization => ({
  id: 41,
  cardId: 3,
  dependentId: 4,
  merchantId: 7,
  merchantName: 'Uber',
  mcc: '4121',
  merchantCategory: 'rideshare',
  items: ['ride home'],
  amountCents: body.amount,
  location: 'Sample',
  swipedAt: new Date().toISOString(),
  bucketId: null,
  bucketName: null,
  decision: 'PENDING',
  status: 'pending',
  reasonCode: 'outside_hours',
  reason: pendingRide.reason,
  decidedBy: 'Rule',
  aiConfidence: null,
  decisionMs: 0.42,
  previousAuthorizationId: null,
  nextAuthorizationId: null,
  resolvedAt: null,
  settledAt: null,
  settlement: null,
  settlementId: null,
  issuerRedeemedAt: null,
  trace: pendingRide.trace,
  createdAt: new Date().toISOString(),
  chain,
  captureChain: chain,
  resolveChain: chain,
});

/** The API as the dependent's screen sees it; a swipe adds to the feed. */
function demoApi(overrides: ApiRoutes = {}) {
  const stored: Authorization[] = [];
  const calls = mockApi({
    'GET /api/authorizations/41': () => ({ body: { authorization: stored.find((a) => a.id === 41), retry: stored.find((a) => a.previousAuthorizationId === 41) ?? null } }),
    'GET /api/merchants': { body: MERCHANTS },
    'GET /api/card': { body: card() },
    'GET /api/policy': { body: policy },
    'GET /api/authorizations': () => ({ body: stored }),
    'GET /api/approvals': { body: [] },
    'POST /api/swipes': (call) => {
      stored.unshift(storedRide(call.body as { amount: number; timestamp: string }));
      return { status: 201, body: pendingRide };
    },
    ...overrides,
  });
  return Object.assign(calls, { stored });
}

/** What the server does when the parent answers request #41. */
function parentAnswers(stored: Authorization[], answer: 'approve' | 'decline') {
  const original = stored.find((a) => a.id === 41)!;
  const resolvedAt = new Date().toISOString();
  if (answer === 'decline') {
    Object.assign(original, { status: 'parent_declined', resolvedAt });
    return;
  }
  Object.assign(original, { status: 'parent_approved', resolvedAt, nextAuthorizationId: 42 });
  stored.unshift({
    ...original,
    id: 42,
    decision: 'APPROVED',
    status: 'approved',
    reasonCode: 'approved',
    reason: 'Paid from Transit with a one-time OK.',
    bucketId: 5,
    bucketName: 'Transit',
    previousAuthorizationId: 41,
    nextAuthorizationId: null,
    resolvedAt: null,
  });
}

/** Stands in for the parent's Approvals badge, which also reads GET /api/approvals. */
function ApprovalsProbe() {
  useListApprovals();
  return null;
}

const tileFor = (name: string) => {
  const m = MERCHANTS.find((x) => x.name === name)!;
  return byTestId(`button-swipe-merchant-${m.id}`) as HTMLButtonElement;
};

afterEach(() => cleanupApi());

describe('swipe simulator', () => {
  it("shows the seeded merchants with the spec's six first, their prices, and Uber at 2:10am", async () => {
    demoApi();
    const host = renderWithApi(<SwipeSimulator />);
    await settle();

    const grid = host.querySelector('[aria-labelledby="demo-swipes-title"]')!;
    const names = [...grid.querySelectorAll('[data-testid^="button-swipe-merchant-"]')].map((b) => b.getAttribute('aria-label'));
    expect(names).toEqual([
      "Swipe at Trader Joe's for $18.40",
      'Swipe at Campus Bookstore for $24.00',
      'Swipe at The Tipsy Tavern for $32.00',
      'Swipe at Steam for $14.99',
      'Swipe at Uber for $22.00, at 2:10am',
      'Swipe at Apple Store for $129.00',
    ]);
    // Custom purchase sits right after the six.
    expect(grid.querySelector('button:last-child')?.getAttribute('data-testid')).toBe('button-custom-purchase');
    expect(host.querySelector('[aria-labelledby="more-shops-title"]')?.querySelectorAll('button')).toHaveLength(3);
    expect(byTestId('text-swipe-card-status')?.textContent).toBe('Your card is on');
    expect(byTestId('state-recent-swipes-empty')).not.toBeNull();
  });

  it('swipes at 2:10am on the family clock and shows the decision, who decided and how fast', async () => {
    const calls = demoApi();
    renderWithApi(
      <>
        <SwipeSimulator />
        <ApprovalsProbe />
      </>,
    );
    await settle();
    const authorizationsBefore = countCalls(calls, 'GET', '/api/authorizations');
    const approvalsBefore = countCalls(calls, 'GET', '/api/approvals');

    tileFor('Uber').click();
    await settle();

    const swipe = calls.find((c) => c.method === 'POST' && c.path === '/api/swipes')!;
    expect(swipe.body).toMatchObject({ cardId: 3, dependentId: 4, merchantId: 7, merchantName: 'Uber', mcc: '4121', amount: 22_00 });
    expect((swipe.body as { timestamp: string }).timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T02:10:00$/);

    const dialog = byTestId('dialog-swipe-result')!;
    expect(dialog.querySelector('[data-testid="text-decision-label"]')?.textContent).toBe('Pending');
    expect(dialog.querySelector('[data-testid="text-decision-reason"]')?.textContent).toBe(pendingRide.reason);
    expect(dialog.querySelector('[data-testid="text-reason-code"]')?.textContent).toBe('outside_hours');
    expect(dialog.querySelector('[data-testid="text-decided-by"]')?.textContent).toBe('Rule');
    expect(dialog.querySelector('[data-testid="text-decision-ms"]')?.textContent).toBe('under 1 ms');
    expect(dialog.textContent).toContain('swiped at 2:10am');
    expect(byTestId('text-waiting-approval')?.textContent).toContain(BRAND.demo.parent);

    // The feed and the parent's approvals refetch after the swipe.
    expect(countCalls(calls, 'GET', '/api/authorizations')).toBeGreaterThan(authorizationsBefore);
    expect(countCalls(calls, 'GET', '/api/approvals')).toBeGreaterThan(approvalsBefore);
    expect(byTestId('row-swipe-41')?.textContent).toContain('Uber');

    byTestId('button-decision-done')!.click();
    await settle(2);
    expect(byTestId('dialog-swipe-result')).toBeNull();
  });

  it('swipes daytime presets at the moment of the tap', async () => {
    const calls = demoApi();
    renderWithApi(<SwipeSimulator />);
    await settle();
    const before = Date.now();

    tileFor("Trader Joe's").click();
    await settle();

    const body = calls.find((c) => c.path === '/api/swipes')!.body as { amount: number; timestamp: string };
    expect(body.amount).toBe(18_40);
    expect(Date.parse(body.timestamp)).toBeGreaterThanOrEqual(before - 1000);
    expect(body.timestamp.endsWith('Z')).toBe(true);
  });

  it("shows an approval's step trace with the hold, and says nothing is paid until settlement", async () => {
    demoApi({ 'POST /api/swipes': { status: 201, body: heldGroceries } });
    renderWithApi(<SwipeSimulator />);
    await settle();

    tileFor("Trader Joe's").click();
    await settle();

    const steps = [...byTestId('list-decision-trace')!.querySelectorAll('li')].map((li) => li.textContent);
    expect(steps).toEqual(heldGroceries.trace.map((t) => t.label));
    expect(byTestId('text-decision-ms')?.textContent).toBe('3.1 ms');
    expect(byTestId('text-held-note')?.textContent).toContain('Nothing is paid until settlement');
  });

  it('shows a frozen card before any swipe', async () => {
    demoApi({ 'GET /api/card': { body: card('frozen') } });
    renderWithApi(<SwipeSimulator />);
    await settle();
    expect(byTestId('text-swipe-card-status')?.textContent).toBe('Your card is frozen');
    expect(byTestId('card-swipe-card-status')?.textContent).toContain(BRAND.demo.parent);
    // Tiles stay tappable: the server declines the swipe and says why.
    expect(tileFor('Steam').disabled).toBe(false);
  });

  it("explains a swipe that didn't go through, in the server's words, without a result", async () => {
    demoApi({ 'POST /api/swipes': { status: 400, body: { error: 'That card belongs to someone else.' } } });
    renderWithApi(<SwipeSimulator />);
    await settle();

    tileFor('Steam').click();
    await settle();

    expect(byTestId('text-swipe-error')?.textContent).toBe('That card belongs to someone else.');
    expect(byTestId('dialog-swipe-result')).toBeNull();
  });

  it('waits for the parent after a pending swipe, then flips to Approved from Transit on its own', async () => {
    const api = demoApi();
    renderWithApi(<SwipeSimulator />);
    await settle();
    tileFor('Uber').click();
    await settle();

    expect(byTestId('state-ask-sent')?.textContent).toContain(`request sent to ${BRAND.demo.parent}`);
    expect(byTestId('button-ask-parent')).toBeNull();
    const polls = countCalls(api, 'GET', '/api/authorizations/41');
    expect(polls).toBeGreaterThan(0);

    parentAnswers(api.stored, 'approve');
    await wait(ANSWER_POLL_MS + 200);
    await settle();

    const dialog = byTestId('dialog-swipe-result')!;
    expect(dialog.querySelector('[data-testid="text-decision-label"]')?.textContent).toBe('Approved');
    expect(dialog.textContent).toContain('Transit');
    expect(dialog.textContent).toContain(`after ${BRAND.demo.parent} said yes`);
    expect(byTestId('state-ask-sent')).toBeNull();

    // Polling stops once answered, and the recent swipes fold into one row.
    const after = countCalls(api, 'GET', '/api/authorizations/41');
    await wait(ANSWER_POLL_MS + 200);
    expect(countCalls(api, 'GET', '/api/authorizations/41')).toBe(after);
    expect(byTestId('row-swipe-41')).toBeNull();
    expect(byTestId('row-swipe-42')?.textContent).toContain('Pending → Parent approved → Approved');
  });

  it('shows "Parent declined" when the parent says no', async () => {
    const api = demoApi();
    renderWithApi(<SwipeSimulator />);
    await settle();
    tileFor('Uber').click();
    await settle();

    parentAnswers(api.stored, 'decline');
    await wait(ANSWER_POLL_MS + 200);
    await settle();

    const dialog = byTestId('dialog-swipe-result')!;
    expect(dialog.querySelector('[data-testid="text-decision-label"]')?.textContent).toBe('Parent declined');
    expect(dialog.querySelector('[data-testid="text-reason-code"]')?.textContent).toBe('parent_declined');
    expect(byTestId('row-swipe-41')?.textContent).toContain('Pending → Parent declined');
  });

  it('sends a custom purchase at a typed store with its category, items, amount and time', async () => {
    const api = demoApi({
      'POST /api/swipes': { status: 201, body: { ...pendingRide, authorizationId: 50, decision: 'REJECTED', reasonCode: 'blocked_category', reason: 'No bars.' } },
    });
    renderWithApi(<SwipeSimulator />);
    await settle();

    byTestId('button-custom-purchase')!.click();
    await settle(2);
    changeValue(byTestId('select-custom-store')!, 'typed');
    changeValue(byTestId('input-custom-store-name')!, 'Corner Pub');
    changeValue(byTestId('select-custom-category')!, 'bar');
    changeValue(byTestId('input-custom-items')!, 'nachos, soda');
    changeValue(byTestId('input-custom-amount')!, '12.50');
    changeValue(byTestId('input-custom-time')!, '21:30');
    act(() => byTestId('button-custom-swipe')!.click());
    await settle();

    const body = api.find((c) => c.method === 'POST' && c.path === '/api/swipes')!.body as Record<string, unknown>;
    expect(body).toMatchObject({ merchantId: null, merchantName: 'Corner Pub', merchantCategory: 'bar', mcc: '5813', items: ['nachos', 'soda'], amount: 12_50 });
    expect(body.timestamp).toMatch(/T21:30:00$/);
    expect(byTestId('sheet-custom-purchase')).toBeNull();
    const dialog = byTestId('dialog-swipe-result')!;
    expect(dialog.querySelector('[data-testid="text-decision-label"]')?.textContent).toBe('Declined');
    expect(dialog.textContent).toContain('Corner Pub');
    expect(dialog.textContent).toContain('swiped at 9:30pm');
  });

  it('swipes a typed name that matches a seeded store as that store, and needs an amount', async () => {
    const api = demoApi();
    renderWithApi(<SwipeSimulator />);
    await settle();

    byTestId('button-custom-purchase')!.click();
    await settle(2);
    changeValue(byTestId('select-custom-store')!, 'typed');
    changeValue(byTestId('input-custom-store-name')!, "  trader joe's ");
    expect(byTestId('text-custom-category')?.textContent).toContain('MCC 5411');

    act(() => byTestId('button-custom-swipe')!.click());
    await settle();
    expect(countCalls(api, 'POST', '/api/swipes')).toBe(0);
    expect(byTestId('sheet-custom-purchase')?.textContent).toContain('Enter an amount');

    changeValue(byTestId('input-custom-amount')!, '65');
    act(() => byTestId('button-custom-swipe')!.click());
    await settle();
    const body = api.find((c) => c.method === 'POST' && c.path === '/api/swipes')!.body as Record<string, unknown>;
    expect(body).toMatchObject({ merchantId: 1, merchantName: "Trader Joe's", mcc: '5411', merchantCategory: 'grocery', amount: 65_00 });
    expect(Date.parse(body.timestamp as string)).toBeGreaterThan(Date.now() - 60_000);
  });
});
