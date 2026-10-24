// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import type { Family } from '@workspace/api-client-react';
import { byTestId, cleanupApi, countCalls, mockApi, renderWithApi, settle } from '@/test/api-test-utils';
import { DemoResetControl } from './DemoResetControl';

const family = (parentId: number): Family => ({
  id: 1,
  name: 'Sample Family',
  members: [
    { id: parentId, displayName: 'Sample Parent', role: 'parent', relationship: 'parent', age: null, onboardingComplete: true, onchainId: `0x${'1'.repeat(64)}` },
    { id: parentId + 1, displayName: 'Sample Funder', role: 'funder', relationship: 'grandparent', age: null, onboardingComplete: true, onchainId: `0x${'2'.repeat(64)}` },
  ],
});

const resetButton = () => byTestId('button-reset-demo') as HTMLButtonElement;

afterEach(() => cleanupApi());

describe('the Reset demo control', () => {
  it('asks first, says nothing on chain is undone, and cancelling resets nothing', async () => {
    const calls = mockApi({ 'GET /api/family': { body: family(7) } });
    renderWithApi(<DemoResetControl />);
    await settle();
    expect(resetButton().disabled).toBe(false);

    resetButton().click();
    await settle();
    expect(byTestId('dialog-reset-demo')).not.toBeNull();
    expect(byTestId('text-reset-chain-note')?.textContent).toContain('stay on chain');

    (byTestId('button-cancel-reset') as HTMLButtonElement).click();
    await settle();
    expect(byTestId('dialog-reset-demo')).toBeNull();
    expect(countCalls(calls, 'POST', '/api/demo/reset')).toBe(0);
  });

  it('resets as the parent, then reloads every screen from the fresh seed', async () => {
    let parentId = 7;
    const calls = mockApi({
      'GET /api/family': () => ({ body: family(parentId) }),
      'POST /api/demo/reset': () => {
        parentId = 21;
        return { body: { familyId: 2, historyAdded: 8, resetAt: new Date().toISOString() } };
      },
    });
    renderWithApi(<DemoResetControl />);
    await settle();

    resetButton().click();
    await settle();
    (byTestId('button-confirm-reset') as HTMLButtonElement).click();
    await settle();

    expect(calls.find((c) => c.method === 'POST' && c.path === '/api/demo/reset')?.body).toEqual({ memberId: 7 });
    expect(byTestId('dialog-reset-demo')).toBeNull();
    expect(byTestId('text-reset-done')).not.toBeNull();
    // The cached family was dropped and fetched again with its new ids.
    expect(countCalls(calls, 'GET', '/api/family')).toBe(2);
  });

  it("shows the server's reason when the reset is refused", async () => {
    mockApi({
      'GET /api/family': { body: family(7) },
      'POST /api/demo/reset': { status: 403, body: { error: 'Only a parent can reset the demo.' } },
    });
    renderWithApi(<DemoResetControl />);
    await settle();

    resetButton().click();
    await settle();
    (byTestId('button-confirm-reset') as HTMLButtonElement).click();
    await settle();

    expect(byTestId('text-reset-error')?.textContent).toBe('Only a parent can reset the demo.');
    expect(byTestId('text-reset-done')).toBeNull();
  });
});
