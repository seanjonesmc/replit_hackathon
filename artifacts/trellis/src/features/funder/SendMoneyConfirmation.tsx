import { useState } from 'react';
import { ArrowRightLeft, CheckCircle2, Landmark, PiggyBank } from 'lucide-react';
import { useListMemberContributions, type ChainRecord, type SendMoneyResult } from '@workspace/api-client-react';
import { AnimatedCents } from '@/components/trellis/animated-cents';
import { STAGGER_MS, motion, stagger } from '@/components/trellis/motion';
import { ChainBadge, PillButton, Tag } from '@/components/trellis/primitives';
import { chainStatusOf } from '@/lib/chain';
import { formatCentsShort, formatUsdc } from '@/lib/format';
import { cn } from '@/lib/utils';

/** Stop waiting for the chain after this long; the badge then shows the last known state. */
const CHAIN_WAIT_MS = 120_000;
const POLL_MS = 1500;

const settled = (chain: ChainRecord) => chain.status === 'confirmed' || chain.status === 'failed';

/**
 * What the funder sees after sending: the bank transfer, the partner bank's
 * conversion to USDC, and the money landing in the bucket with its note. The
 * chain badge follows the contribution's real status until it is mined (then
 * links to the explorer) or the write fails.
 */
export function SendMoneyConfirmation({ result, funderId, onDone }: { result: SendMoneyResult; funderId: number; onDone: () => void }) {
  const { contribution, bankAccount, bucket } = result;
  const [sentAt] = useState(() => Date.now());
  const list = useListMemberContributions(funderId, {
    query: {
      refetchInterval: (q) => {
        const latest = q.state.data?.contributions.find((c) => c.id === contribution.id);
        if (latest && settled(latest.chain)) return false;
        return Date.now() - sentAt < CHAIN_WAIT_MS ? POLL_MS : false;
      },
    },
  });
  const chain = list.data?.contributions.find((c) => c.id === contribution.id)?.chain ?? contribution.chain;
  const dollars = formatCentsShort(contribution.amountCents);
  const usdc = formatUsdc(contribution.amountCents);

  const steps = [
    {
      icon: Landmark,
      title: `${bankAccount.bankName} ••${bankAccount.last4} sent ${dollars}`,
      body: 'Simulated bank transfer, test dollars.',
    },
    {
      icon: ArrowRightLeft,
      title: `Partner bank converted ${dollars} → ${usdc}`,
      body: 'One dollar becomes one USDC.',
    },
    {
      icon: PiggyBank,
      title: `${usdc} is in the ${contribution.bucketName} bucket`,
      body: null,
    },
  ];

  return (
    <div data-testid="state-money-sent">
      <div className={cn('flex flex-col items-center px-4 pb-6 pt-4 text-center', motion.riseIn)} style={stagger(0)}>
        <span className="grid size-14 place-items-center rounded-full bg-approved-bg text-approved">
          <CheckCircle2 className="size-8" strokeWidth={2.2} aria-hidden="true" />
        </span>
        <h1 className="type-display-md mt-4" role="status">
          {dollars} sent
        </h1>
        <p className="type-body-sm mt-1 text-ink-muted">It's in {contribution.bucketName} now. The family can spend it right away.</p>
      </div>

      <ol className="flex flex-col gap-2" aria-label="What happened">
        {steps.map((s, i) => (
          <li key={i} className={cn('flex gap-3 rounded-card-sm border bg-surface p-4', motion.riseIn)} style={stagger(i + 1)} data-testid={`step-sent-${i + 1}`}>
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-alt text-ink">
              <s.icon className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="type-link-sm">{s.title}</p>
              {s.body && <p className="type-caption mt-0.5 text-ink-muted">{s.body}</p>}
              {i === steps.length - 1 && (
                <p className="type-caption mt-0.5 text-ink-muted" data-testid="text-bucket-new-balance">
                  {bucket.name} now has{' '}
                  <span className="tnum font-semibold text-ink">
                    {/* Counts up from the old balance once this step has risen in. */}
                    <AnimatedCents
                      cents={bucket.availableCents}
                      from={Math.max(0, bucket.availableCents - contribution.amountCents)}
                      delayMs={(i + 1) * STAGGER_MS + 300}
                    />
                  </span>{' '}
                  to spend.
                </p>
              )}
              {i === steps.length - 1 && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span data-testid="tag-contribution-note">
                    <Tag>{contribution.note}</Tag>
                  </span>
                </div>
              )}
            </div>
            <CheckCircle2 className="size-5 shrink-0 text-approved" aria-label="Done" />
          </li>
        ))}
      </ol>

      <div className={cn('mt-4 flex flex-wrap items-center gap-2 px-1', motion.riseIn)} style={stagger(steps.length + 1)} data-testid="status-send-chain">
        <span className="type-caption text-ink-muted">Monad testnet:</span>
        <ChainBadge status={chainStatusOf(chain)} animateChange />
      </div>
      <p className="type-caption mt-2 px-1 text-ink-muted">
        Testnet demo: the USDC is a stand-in, the project's own test dollar token.
      </p>

      <PillButton block variant="outline" className="mt-8" onClick={onDone} data-testid="button-send-more">
        Send more
      </PillButton>
    </div>
  );
}
