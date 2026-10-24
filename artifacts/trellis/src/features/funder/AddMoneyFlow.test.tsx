// @vitest-environment happy-dom
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BankAccount, BucketSummary, Contribution, Member, SendMoneyResult } from '@workspace/api-client-react';
import { byTestId, cleanupApi, renderWithApi, settle, type ApiCall } from '@/test/api-test-utils';
import ParentAddMoney from '@/features/parent/ParentAddMoney';
import FunderAddMoney from './FunderAddMoney';

/** Neutral placeholder names: the real demo names live in BRAND only. */
const chain = { status: 'not_submitted', txHash: null, confirmedAt: null, explorerUrl: null } as const;

const member = (id: number, displayName: string, role: Member['role'], relationship: string): Member => ({
  id,
  displayName,
  role,
  relationship,
  age: null,
  onboardingComplete: true,
  onchainId: `0x${String(id).padStart(64, '0')}`,
});

const PARENT = member(1, 'Sample Parent', 'parent', 'parent');
const GRANDPARENT = member(2, 'Sample Grandparent', 'funder', 'grandparent');
const CO_PARENT = member(3, 'Sample Co-parent', 'funder', 'co-parent');
const DEPENDENT = member(4, 'Sample Teen', 'dependent', 'student');

const bank = (id: number, memberId: number, bankName: string, last4: string, balanceCents: number): BankAccount => ({
  id,
  memberId,
  bankName,
  last4,
  balanceCents,
  chain,
});

const BANKS: Record<number, BankAccount[]> = {
  [PARENT.id]: [bank(11, PARENT.id, 'Parent Bank', '1111', 390_00)],
  [GRANDPARENT.id]: [bank(12, GRANDPARENT.id, 'Grandparent Bank', '2222', 100_00)],
  [CO_PARENT.id]: [bank(13, CO_PARENT.id, 'Co-parent Bank', '3333', 50_00)],
};

const bucket = (id: number, name: string, availableCents: number): BucketSummary => ({
  id,
  name,
  purpose: `${name} things`,
  icon: null,
  perPurchaseLimitCents: 40_00,
  approvalThresholdCents: 30_00,
  availableCents,
  heldCents: 0,
  spentCents: 0,
  fundedCents: availableCents,
  spentThisWeekCents: 0,
  funderNames: [],
  chain,
});

/** The family API as the add-money screens see it; a send moves money and is listed. */
function familyApi() {
  const buckets = [bucket(1, 'Food', 150_00), bucket(2, 'School', 200_00)];
  const contributions: Record<number, Contribution[]> = {};
  const calls: ApiCall[] = [];
  // Member and bucket routes carry ids, so the fake answers them by pattern.
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const href = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const path = new URL(href, 'http://localhost').pathname;
    const method = (init?.method ?? 'GET').toUpperCase();
    calls.push({ method, path, search: '', body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined });
    const json = (body: unknown, status = 200) =>
      new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
    if (path === '/api/family') return json({ id: 1, name: 'Sample family', members: [PARENT, GRANDPARENT, CO_PARENT, DEPENDENT] });
    if (path === '/api/family/buckets') return json(buckets);
    let m = path.match(/^\/api\/members\/(\d+)\/bank-accounts$/);
    if (m) return json(BANKS[Number(m[1])] ?? []);
    m = path.match(/^\/api\/members\/(\d+)\/contributions$/);
    if (m) {
      const list = contributions[Number(m[1])] ?? [];
      return json({ memberId: Number(m[1]), totalCents: list.reduce((s, c) => s + c.amountCents, 0), contributions: list });
    }
    m = path.match(/^\/api\/buckets\/(\d+)\/send-money$/);
    if (m && method === 'POST') {
      const body = JSON.parse(String(init!.body)) as { memberId: number; bankAccountId: number; amountCents: number; note: string | null };
      const funder = [PARENT, GRANDPARENT, CO_PARENT].find((x) => x.id === body.memberId)!;
      const account = BANKS[funder.id]!.find((b) => b.id === body.bankAccountId)!;
      const target = buckets.find((b) => b.id === Number(m![1]))!;
      target.availableCents += body.amountCents;
      const contribution: Contribution = {
        id: 90 + Object.values(contributions).flat().length,
        memberId: funder.id,
        bucketId: target.id,
        bucketName: target.name,
        bankAccountId: account.id,
        bankName: account.bankName,
        bankLast4: account.last4,
        amountCents: body.amountCents,
        note: body.note ?? `${target.name}, from ${funder.displayName}`,
        createdAt: new Date().toISOString(),
        chain,
      };
      (contributions[funder.id] ??= []).unshift(contribution);
      const result: SendMoneyResult = {
        deposit: { id: 70, bankAccountId: account.id, amountCents: body.amountCents, createdAt: contribution.createdAt, chain },
        contribution,
        bankAccount: account,
        bucket: { ...target, chain },
      };
      return json(result, 201);
    }
    return json({ error: 'Not found' }, 404);
  });
  return { calls, buckets };
}

const sends = (calls: ReturnType<typeof familyApi>['calls']) =>
  calls.filter((c) => c.method === 'POST' && /\/send-money$/.test(c.path));

const text = (id: string) => byTestId(id)?.textContent ?? '';

function typeInto(id: string, value: string) {
  const input = byTestId(id) as HTMLInputElement;
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
  act(() => {
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

async function send() {
  act(() => byTestId('button-send-money')!.click());
  await settle();
}

afterEach(() => cleanupApi());

describe("the parent's Add money screen", () => {
  it("adds money from the parent's own bank, as the parent, into the chosen bucket", async () => {
    const { calls, buckets } = familyApi();
    renderWithApi(<ParentAddMoney />);
    await settle();

    expect(text('text-screen-title')).toBe('Add money');
    expect(document.body.textContent).toContain(`Top up one of ${DEPENDENT.displayName}'s buckets.`);
    // The From card is the parent's bank, not the grandparent's.
    expect(text('card-linked-bank')).toContain('Parent Bank ••1111');
    expect(text('card-linked-bank')).toContain('$390.00');
    expect(text('card-linked-bank')).not.toContain('Grandparent Bank');
    expect(byTestId('link-back-home')?.getAttribute('href')).toBe('/parent/home');

    act(() => byTestId('option-bucket-2')!.click());
    expect((byTestId('input-note') as HTMLInputElement).placeholder).toBe(`School, from ${PARENT.displayName}`);
    typeInto('input-amount', '25');
    await send();

    expect(sends(calls)).toEqual([
      expect.objectContaining({
        path: '/api/buckets/2/send-money',
        body: { memberId: PARENT.id, bankAccountId: 11, amountCents: 25_00, note: null },
      }),
    ]);
    expect(buckets.find((b) => b.id === 2)!.availableCents).toBe(225_00);

    // The same confirmation as the grandparent's: bank, conversion, bucket and the default note.
    expect(byTestId('state-money-sent')).not.toBeNull();
    expect(text('step-sent-1')).toContain('Parent Bank ••1111 sent $25');
    expect(text('step-sent-2')).toContain('Partner bank converted $25');
    expect(text('step-sent-3')).toContain('School');
    expect(text('tag-contribution-note')).toBe(`School, from ${PARENT.displayName}`);
    expect(byTestId('status-send-chain')).not.toBeNull();
    // Its chain status follows the parent's own contributions.
    expect(calls.some((c) => c.path === `/api/members/${PARENT.id}/contributions`)).toBe(true);
  });

  it("keeps the parent's own note", async () => {
    const { calls } = familyApi();
    renderWithApi(<ParentAddMoney />);
    await settle();
    typeInto('input-note', 'For the trip');
    await send();
    expect(sends(calls)[0]?.body).toMatchObject({ memberId: PARENT.id, bankAccountId: 11, amountCents: 50_00, note: 'For the trip' });
    expect(text('tag-contribution-note')).toBe('For the trip');
  });
});

describe("the grandparent's Add money tab", () => {
  it('still adds money from the grandparent, with her bank and greeting', async () => {
    const { calls } = familyApi();
    renderWithApi(<FunderAddMoney />);
    await settle();

    expect(text('text-screen-title')).toBe(`Hi, ${GRANDPARENT.displayName}`);
    expect(text('card-linked-bank')).toContain('Grandparent Bank ••2222');
    expect(byTestId('link-back-home')).toBeNull();
    await send();

    expect(sends(calls)).toEqual([
      expect.objectContaining({
        path: '/api/buckets/1/send-money',
        body: { memberId: GRANDPARENT.id, bankAccountId: 12, amountCents: 50_00, note: null },
      }),
    ]);
    expect(text('tag-contribution-note')).toBe(`Food, from ${GRANDPARENT.displayName}`);
  });
});
