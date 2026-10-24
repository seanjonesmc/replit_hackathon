// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import type { ParentOverview } from '@workspace/api-client-react';
import { byTestId, cleanupApi, mockApi, renderWithApi, settle } from '@/test/api-test-utils';
import ParentHome from './ParentHome';

const overview: ParentOverview = {
  familyName: 'Sample family',
  parentName: 'Sample Parent',
  dependentName: 'Sample Teen',
  potTotalCents: 460_00,
  buckets: [],
  pendingApprovalsCount: 0,
  heldPurchasesCount: 0,
  heldTotalCents: 0,
  latestSettlementId: null,
};

afterEach(() => cleanupApi());

describe('parent home', () => {
  it('offers Add money on the family pot card', async () => {
    mockApi({
      'GET /api/family/overview': { body: overview },
      'GET /api/family/activity': { body: [] },
      'GET /api/family': { body: { id: 1, name: 'Sample family', members: [] } },
    });
    renderWithApi(<ParentHome />);
    await settle();

    const pot = byTestId('card-family-pot')!;
    const link = pot.querySelector<HTMLAnchorElement>('[data-testid="link-add-money"]');
    expect(link?.textContent).toBe('Add money');
    expect(link?.getAttribute('href')).toBe('/parent/add-money');
  });
});
