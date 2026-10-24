// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Authorization, Family, ParentOverview } from '@workspace/api-client-react';
import { byTestId, cleanupApi, countCalls, mockApi, renderWithApi, settle, type ApiRoutes } from '@/test/api-test-utils';
import ParentApprovals from './ParentApprovals';

const chain = { status: 'not_submitted', txHash: null, confirmedAt: null, explorerUrl: null } as const;

const request = (id: number, merchantName: string, amountCents: number): Authorization => ({
  id,
  cardId: 3,
  dependentId: 4,
  merchantId: 8,
  merchantName,
  mcc: '5732',
  merchantCategory: 'electronics',
  items: ['sample item'],
  amountCents,
  location: 'Sample',
  swipedAt: new Date().toISOString(),
  bucketId: 2,
  bucketName: 'School',
  decision: 'PENDING',
  status: 'pending',
  reasonCode: 'needs_approval',
  reason: 'Over the School approval threshold.',
  decidedBy: 'Rule',
  aiConfidence: null,
  decisionMs: 0.5,
  previousAuthorizationId: null,
  nextAuthorizationId: null,
  resolvedAt: null,
  settledAt: null,
  settlement: null,
  settlementId: null,
  issuerRedeemedAt: null,
  trace: [],
  createdAt: new Date().toISOString(),
  chain,
  captureChain: chain,
  resolveChain: chain,
});

const member = (id: number, role: 'parent' | 'dependent' | 'funder', displayName: string) => ({
  id,
  displayName,
  role,
  relationship: role,
  age: null,
  onboardingComplete: true,
  onchainId: `0x${String(id).padStart(64, '0')}`,
});

const family: Family = {
  id: 1,
  name: 'Sample Family',
  members: [member(1, 'parent', 'Sample Parent'), member(2, 'dependent', 'Sample Teen'), member(3, 'funder', 'Sample Funder')],
};

const overview: ParentOverview = {
  familyName: 'Sample Family',
  parentName: 'Sample Parent',
  dependentName: 'Sample Teen',
  potTotalCents: 0,
  buckets: [],
  pendingApprovalsCount: 2,
  heldPurchasesCount: 0,
  heldTotalCents: 0,
  latestSettlementId: null,
};

/** Two waiting requests; answering one removes it, like the server. */
function approvalsApi(overrides: ApiRoutes = {}) {
  let waiting = [request(41, 'Sample Electronics', 129_00), request(43, 'Sample Ride', 22_00)];
  const answer = (id: number) => (call: { body: unknown }) => {
    const found = waiting.find((r) => r.id === id);
    if (!found) return { status: 409, body: { error: 'A parent already approved this purchase.' } };
    waiting = waiting.filter((r) => r.id !== id);
    const approved = (call.body as { decision: string }).decision === 'approve';
    return {
      body: {
        authorization: { ...found, status: approved ? 'parent_approved' : 'parent_declined' },
        retry: approved ? { ...found, id: 99, decision: 'APPROVED', status: 'approved', previousAuthorizationId: id } : null,
      },
    };
  };
  return mockApi({
    'GET /api/approvals': () => ({ body: waiting }),
    'GET /api/family/overview': { body: overview },
    'GET /api/family': { body: family },
    'POST /api/approvals/41/resolve': answer(41),
    'POST /api/approvals/43/resolve': answer(43),
    ...overrides,
  });
}

const button = (id: string) => byTestId(id) as HTMLButtonElement;

afterEach(() => cleanupApi());

describe('parent approvals', () => {
  it('approves as the parent, removes the request and refreshes the screens', async () => {
    const calls = approvalsApi();
    renderWithApi(<ParentApprovals />);
    await settle();

    expect(button('button-approve-41').disabled).toBe(false);
    expect(button('button-decline-41').disabled).toBe(false);
    expect(byTestId('card-approval-41')?.textContent).not.toContain('live app');
    const approvalsBefore = countCalls(calls, 'GET', '/api/approvals');

    button('button-approve-41').click();
    await settle();

    const resolve = calls.find((c) => c.method === 'POST' && c.path === '/api/approvals/41/resolve');
    expect(resolve?.body).toEqual({ parentId: 1, decision: 'approve' });
    expect(byTestId('card-approval-41')).toBeNull();
    expect(byTestId('card-approval-43')).not.toBeNull();
    expect(countCalls(calls, 'GET', '/api/approvals')).toBeGreaterThan(approvalsBefore);
  });

  it('declines, and shows "all caught up" once nothing is waiting', async () => {
    const calls = approvalsApi();
    renderWithApi(<ParentApprovals />);
    await settle();

    button('button-decline-41').click();
    await settle();
    button('button-decline-43').click();
    await settle();

    expect(calls.filter((c) => c.method === 'POST').map((c) => [c.path, (c.body as { decision: string }).decision])).toEqual([
      ['/api/approvals/41/resolve', 'decline'],
      ['/api/approvals/43/resolve', 'decline'],
    ]);
    expect(byTestId('state-approvals-empty')?.textContent).toContain("You're all caught up");
  });

  it('locks both buttons while an answer is on its way', async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => (release = resolve));
    approvalsApi();
    // Hold the answer's response until the test lets it through.
    const answerApi = vi.mocked(globalThis.fetch).getMockImplementation()!;
    vi.mocked(globalThis.fetch).mockImplementation(async (input, init) => {
      if (init?.method?.toUpperCase() === 'POST') await gate;
      return answerApi(input, init);
    });
    renderWithApi(<ParentApprovals />);
    await settle();

    button('button-approve-41').click();
    await settle(2);
    expect(byTestId('card-approval-41')?.getAttribute('aria-busy')).toBe('true');
    expect(button('button-approve-41').disabled).toBe(true);
    expect(button('button-decline-41').disabled).toBe(true);

    release();
    await settle();
    expect(byTestId('card-approval-41')).toBeNull();
  });

  it("shows the server's reason when an answer is rejected, and keeps the request", async () => {
    approvalsApi({ 'POST /api/approvals/41/resolve': { status: 409, body: { error: 'A parent already declined this purchase.' } } });
    renderWithApi(<ParentApprovals />);
    await settle();

    button('button-approve-41').click();
    await settle();

    expect(byTestId('text-approval-error-41')?.textContent).toBe('A parent already declined this purchase.');
    expect(button('button-approve-41').disabled).toBe(false);
  });
});
