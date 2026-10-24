import { useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Check, Info, Landmark, PiggyBank, Send } from 'lucide-react';
import { useListBuckets, useSendMoneyToBucket, type SendMoneyResult } from '@workspace/api-client-react';
import { BucketIconBadge } from '@/components/trellis/bucket-card';
import { EmptyState } from '@/components/trellis/empty-state';
import { ChainBadge, PillButton, SectionTitle } from '@/components/trellis/primitives';
import { HeroBalanceCardSkeleton, LoadingRegion, Skeleton } from '@/components/trellis/skeletons';
import { ComingSoonNote, ErrorState } from '@/components/trellis/states';
import { ScreenHeader } from '@/features/shell/layout';
import { HeroBalanceCard } from '@/components/trellis/hero-balance-card';
import { chainStatusOf } from '@/lib/chain';
import { formatCents, formatCentsShort, formatUsdc, parseDollarsToCents } from '@/lib/format';
import { cn } from '@/lib/utils';
import { SendMoneyConfirmation } from './SendMoneyConfirmation';
import type { FundingMember } from './use-funder';

/** The demo script's opening amount: the presenter can send it as is. */
const DEFAULT_AMOUNT = '50';
const NOTE_MAX = 140;

const fieldCls =
  'w-full rounded-card-sm border-2 border-transparent bg-surface-alt px-4 text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-primary';

function errorMessage(error: unknown): string {
  const data = (error as { data?: unknown } | null)?.data;
  if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string') return data.error;
  return "Couldn't send the money. Please try again.";
}

interface AddMoneyFlowProps {
  /** Who is adding money: their member record and linked bank. */
  funding: FundingMember;
  title: string;
  subtitle: string;
}

/**
 * The Add money flow shared by every funding member (the grandparent on her
 * tab, the parent from her home): the form, the one-tap send, the partner
 * bank's dollar-to-USDC step and the chain status. The money always comes
 * from `funding`'s own first linked bank and goes into a bucket.
 */
export function AddMoneyFlow({ funding: funder, title, subtitle }: AddMoneyFlowProps) {
  const buckets = useListBuckets();
  const queryClient = useQueryClient();
  const send = useSendMoneyToBucket();
  const [chosen, setChosen] = useState<number | null>(null);
  const [amount, setAmount] = useState(DEFAULT_AMOUNT);
  const [note, setNote] = useState('');
  const [sent, setSent] = useState<SendMoneyResult | null>(null);

  if (funder.isLoading || buckets.isLoading) {
    return (
      <LoadingRegion label="Loading your bank and buckets" className="flex flex-col gap-4">
        <Skeleton className="h-8 w-40" />
        <HeroBalanceCardSkeleton className="bg-surface-alt" />
        <Skeleton className="h-[72px] rounded-card-sm" />
        <Skeleton className="h-[72px] rounded-card-sm" />
        <Skeleton className="h-[72px] rounded-card-sm" />
      </LoadingRegion>
    );
  }
  if (funder.isError || buckets.isError) {
    return (
      <ErrorState
        onRetry={() => {
          funder.refetch();
          void buckets.refetch();
        }}
        retrying={funder.isFetching || buckets.isFetching}
      />
    );
  }

  const name = funder.funder?.displayName;
  const bank = funder.bank;
  const list = buckets.data ?? [];
  // The first bucket is picked until the presenter chooses another.
  const selected = list.find((b) => b.id === chosen) ?? list[0] ?? null;
  const amountCents = parseDollarsToCents(amount);
  const notePlaceholder = selected && name ? `${selected.name}, from ${name}` : 'Add a note';
  const canSend = Boolean(funder.funder && bank && selected && amountCents !== null) && !send.isPending;

  if (sent && funder.funder) {
    return (
      <SendMoneyConfirmation
        result={sent}
        funderId={funder.funder.id}
        onDone={() => {
          setSent(null);
          setNote('');
          send.reset();
        }}
      />
    );
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!funder.funder || !bank || !selected || amountCents === null) return;
    send.mutate(
      {
        bucketId: selected.id,
        data: {
          memberId: funder.funder.id,
          bankAccountId: bank.id,
          amountCents,
          note: note.trim() || null,
        },
      },
      {
        onSuccess: (result) => {
          setSent(result);
          // Every screen showing a balance or the feed picks up the new money.
          void queryClient.invalidateQueries();
        },
      },
    );
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      <ScreenHeader title={title} subtitle={subtitle} />

      <section aria-labelledby="bank-title">
        <SectionTitle>
          <span id="bank-title">From</span>
        </SectionTitle>
        {bank ? (
          <HeroBalanceCard
            eyebrow={`${bank.bankName} ••${bank.last4}`}
            amountCents={bank.balanceCents}
            caption="Available to add · simulated bank · test dollars"
            badge={<Landmark className="size-5 shrink-0" aria-hidden="true" />}
            data-testid="card-linked-bank"
          >
            <ChainBadge status={chainStatusOf(bank.chain)} />
          </HeroBalanceCard>
        ) : (
          <EmptyState
            icon={Landmark}
            title="No bank linked"
            body="Linking a bank arrives with onboarding in a later step of the demo."
            className="rounded-card bg-surface-alt"
            data-testid="state-no-bank"
          />
        )}
      </section>

      <section className="mt-8" aria-labelledby="bucket-choice-title">
        <SectionTitle>
          <span id="bucket-choice-title">To</span>
        </SectionTitle>
        {list.length === 0 ? (
          <EmptyState
            icon={PiggyBank}
            title="No buckets yet"
            body="Buckets appear here once the family sets them up."
            className="rounded-card bg-surface-alt"
            data-testid="state-no-buckets"
          />
        ) : (
          <div role="radiogroup" aria-labelledby="bucket-choice-title" className="flex flex-col gap-2">
            {list.map((b) => {
              const isSelected = selected?.id === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setChosen(b.id)}
                  className={cn(
                    'flex items-center gap-3 rounded-card-sm border-2 bg-surface-alt p-4 text-left transition-colors',
                    isSelected ? 'border-primary' : 'border-transparent hover:border-hairline',
                  )}
                  data-testid={`option-bucket-${b.id}`}
                >
                  <BucketIconBadge icon={b.icon} />
                  <span className="min-w-0 flex-1">
                    <span className="type-link-sm block">{b.name}</span>
                    <span className="type-caption block text-ink-muted">{b.purpose}</span>
                  </span>
                  <span className="text-right">
                    <span className="type-link-sm tnum block">{formatCents(b.availableCents)}</span>
                    <span className="type-caption block text-ink-muted">left</span>
                  </span>
                  <span
                    className={cn(
                      'grid size-6 shrink-0 place-items-center rounded-full border-2',
                      isSelected ? 'border-primary bg-primary text-on-primary' : 'border-hairline',
                    )}
                    aria-hidden="true"
                  >
                    {isSelected && <Check className="size-4" strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-8 flex flex-col gap-4" aria-labelledby="amount-title">
        <SectionTitle>
          <span id="amount-title">How much</span>
        </SectionTitle>
        <div>
          <label htmlFor="send-amount" className="type-label mb-2 block px-1 text-ink-muted">
            Amount in dollars
          </label>
          <div className="relative">
            <span className="type-title pointer-events-none absolute inset-y-0 left-4 grid place-items-center text-ink-muted" aria-hidden="true">
              $
            </span>
            <input
              id="send-amount"
              inputMode="decimal"
              autoComplete="off"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-invalid={amountCents === null}
              aria-describedby="send-amount-help"
              className={cn(fieldCls, 'type-title tnum h-14 pl-9', amountCents === null && 'border-rejected focus:border-rejected')}
              data-testid="input-amount"
            />
          </div>
          <p id="send-amount-help" className={cn('type-caption mt-2 px-1', amountCents === null ? 'text-rejected' : 'text-ink-muted')}>
            {amountCents === null
              ? 'Enter an amount, like 50 or 12.50.'
              : `Arrives as ${formatUsdc(amountCents)} in ${selected?.name ?? 'the bucket'}.`}
          </p>
        </div>
        <div>
          <label htmlFor="send-note" className="type-label mb-2 block px-1 text-ink-muted">
            Note <span className="font-normal">(optional)</span>
          </label>
          <input
            id="send-note"
            value={note}
            maxLength={NOTE_MAX}
            onChange={(e) => setNote(e.target.value)}
            placeholder={notePlaceholder}
            className={cn(fieldCls, 'type-body-sm h-12')}
            data-testid="input-note"
          />
        </div>
      </section>

      <div className="mt-6 rounded-card-sm bg-chain-bg p-4 text-chain" data-testid="note-usdc-testnet">
        <p className="type-body-sm flex gap-2">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            Your bank sends dollars. Our partner bank converts them to USDC, one for one, and puts them in the family vault on
            Monad.
          </span>
        </p>
        <p className="type-caption mt-2 pl-6">
          Testnet demo: the USDC here is a stand-in, the project's own test dollar token. No real money or real USDC moves.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        {send.isError && (
          <p role="alert" className="type-caption rounded-card-sm bg-rejected-bg px-4 py-3 text-rejected" data-testid="text-send-error">
            {errorMessage(send.error)}
          </p>
        )}
        <PillButton
          type="submit"
          block
          disabled={!canSend}
          loading={send.isPending}
          icon={<Send className="size-5" aria-hidden="true" />}
          data-testid="button-send-money"
        >
          {amountCents !== null ? `Send ${formatCentsShort(amountCents)}` : 'Send'}
        </PillButton>
        <ComingSoonNote className="justify-center">Sending USDC straight from a wallet abroad arrives later.</ComingSoonNote>
      </div>
    </form>
  );
}
