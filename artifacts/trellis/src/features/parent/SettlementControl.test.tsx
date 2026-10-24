// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import type { Settlement } from '@workspace/api-client-react';
import { byTestId, cleanupApi, countCalls, mockApi, renderWithApi, settle } from '@/test/api-test-utils';
import { SettlementControl } from './SettlementControl';

const issuer = '0x00000000000000000000000000000000000000aa';
const txHash = `0x${'1'.repeat(64)}`;

const settlement = (captureStatus: 'not_submitted' | 'confirmed'): Settlement => ({
  id: 7,
  settledAt: new Date().toISOString(),
  purchaseCount: 1,
  totalCents: 18_40,
  issuerAddress: issuer,
  issuerExplorerUrl: `https://explorer.example/address/${issuer}`,
  purchases: [
    {
      authorizationId: 21,
      merchantName: 'Sample Grocer',
      bucketName: 'Food',
      amountCents: 18_40,
      swipedAt: new Date().toISOString(),
      steps: [
        { key: 'network_paid_merchant', label: 'Visa paid Sample Grocer $18.40', detail: 'Simulated.', simulated: true, chain: null },
        {
          key: 'vault_paid_issuer',
          label: 'The vault released 18.40 USDC to the card issuer',
          detail: 'On Monad testnet.',
          simulated: false,
          chain:
            captureStatus === 'confirmed'
              ? { status: 'confirmed', txHash, confirmedAt: new Date().toISOString(), explorerUrl: `https://explorer.example/tx/${txHash}` }
              : { status: 'not_submitted', txHash: null, confirmedAt: null, explorerUrl: null },
        },
        { key: 'issuer_redeemed', label: 'The card issuer redeemed 18.40 USDC', detail: 'Simulated.', simulated: true, chain: null },
      ],
    },
  ],
});

afterEach(() => cleanupApi());

describe('settlement control', () => {
  it("can't run when nothing is held", async () => {
    mockApi({});
    renderWithApi(<SettlementControl heldCount={0} heldTotalCents={0} />);
    await settle();
    expect(byTestId('text-held-summary')?.textContent).toBe('Nothing is held right now.');
    expect((byTestId('button-run-settlement') as HTMLButtonElement).disabled).toBe(true);
  });

  it('settles the held purchases and walks through the three steps, following the capture until it is mined', async () => {
    const calls = mockApi({
      'POST /api/settlements': { status: 201, body: settlement('not_submitted') },
      'GET /api/settlements/7': { body: settlement('confirmed') },
      'GET /api/family/activity': { body: [] },
    });
    renderWithApi(<SettlementControl heldCount={1} heldTotalCents={18_40} />);
    await settle();
    expect(byTestId('text-held-summary')?.textContent).toBe('1 approved purchase held · $18.40 not paid yet');

    byTestId('button-run-settlement')!.click();
    await settle();

    expect(countCalls(calls, 'POST', '/api/settlements')).toBe(1);
    const summary = byTestId('summary-settlement-7')!;
    expect(summary.textContent).toContain('Settled 1 purchase');
    const steps = [1, 2, 3].map((i) => byTestId(`settlement-step-21-${i}`)!);
    expect(steps.map((s) => s.textContent?.includes('Simulated'))).toEqual([true, false, true]);
    expect(byTestId('link-issuer-wallet')?.getAttribute('href')).toBe(`https://explorer.example/address/${issuer}`);

    // The first poll finds the capture mined; its badge links to the transaction.
    await new Promise((resolve) => setTimeout(resolve, 2100));
    await settle();
    const link = byTestId('settlement-step-21-2')!.querySelector('a');
    expect(link?.getAttribute('href')).toBe(`https://explorer.example/tx/${txHash}`);
  });
});
