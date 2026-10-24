import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, CreditCard, Landmark, ReceiptText, Vault, type LucideIcon } from 'lucide-react';
import {
  getGetSettlementQueryKey,
  getListActivityQueryKey,
  useGetSettlement,
  useRunSettlement,
  type ChainRecord,
  type Settlement,
  type SettlementStep,
} from '@workspace/api-client-react';
import { motion, stagger } from '@/components/trellis/motion';
import { ChainBadge, PillButton, Tag } from '@/components/trellis/primitives';
import { apiErrorMessage, refreshAfterSwipe } from '@/features/family/spending';
import { chainStatusOf } from '@/lib/chain';
import { formatCents } from '@/lib/format';
import { cn } from '@/lib/utils';

/** Stop waiting for the chain after this long; badges then show the last known state. */
const CHAIN_WAIT_MS = 120_000;
const POLL_MS = 2000;

const STEP_ICON: Record<SettlementStep['key'], LucideIcon> = {
  network_paid_merchant: CreditCard,
  vault_paid_issuer: Vault,
  issuer_redeemed: Landmark,
};

// A capture starts as not_submitted until the background write picks it up,
// so only a mined or failed write ends the wait (capped by CHAIN_WAIT_MS).
const chainDone = (chain: ChainRecord | null) => chain === null || chain.status === 'confirmed' || chain.status === 'failed';

/** Settlement steps come in a little slower than other sequences so each one can be read on the demo video. */
const SETTLE_STAGGER_MS = 140;

const shortAddress = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`;

/**
 * The presenter's demo control on the parent home: settles every held
 * purchase at once, then walks through the three settlement steps for each.
 * Only the vault's release to the card issuer is on chain; its badge follows
 * the capture until it is mined (then links to the explorer) or fails.
 */
export function SettlementControl({ heldCount, heldTotalCents }: { heldCount: number; heldTotalCents: number }) {
  const queryClient = useQueryClient();
  const run = useRunSettlement();
  const [runId, setRunId] = useState<{ id: number; at: number } | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  const start = () => {
    setFailure(null);
    run.mutate(undefined, {
      onSuccess: (settlement) => {
        queryClient.setQueryData(getGetSettlementQueryKey(settlement.id), settlement);
        setRunId({ id: settlement.id, at: Date.now() });
        void refreshAfterSwipe(queryClient);
      },
      onError: (error) => setFailure(apiErrorMessage(error, "Settlement didn't run. Try again.")),
    });
  };

  return (
    <section className="mt-4 rounded-card-sm border border-dashed p-4" aria-labelledby="settlement-title" data-testid="card-settlement">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 id="settlement-title" className="type-link-sm">
              Settlement
            </h2>
            <Tag tone="neutral">Demo control</Tag>
          </div>
          <p className="type-caption mt-0.5 text-ink-muted" data-testid="text-held-summary">
            {heldCount === 0
              ? 'Nothing is held right now.'
              : `${heldCount} approved ${heldCount === 1 ? 'purchase' : 'purchases'} held · ${formatCents(heldTotalCents)} not paid yet`}
          </p>
        </div>
        <PillButton
          size="sm"
          disabled={heldCount === 0}
          loading={run.isPending}
          icon={<ReceiptText className="size-4" aria-hidden="true" />}
          onClick={start}
          data-testid="button-run-settlement"
        >
          Run settlement
        </PillButton>
      </div>
      {failure && (
        <p role="alert" className="type-caption mt-2 flex items-center gap-1.5 text-rejected" data-testid="text-settlement-error">
          <AlertCircle className="size-4" aria-hidden="true" />
          {failure}
        </p>
      )}
      {runId && <SettlementSummary id={runId.id} startedAt={runId.at} />}
    </section>
  );
}

function SettlementSummary({ id, startedAt }: { id: number; startedAt: number }) {
  const queryClient = useQueryClient();
  const { data } = useGetSettlement(id, {
    query: {
      queryKey: getGetSettlementQueryKey(id),
      refetchInterval: (q) => {
        const done = q.state.data?.purchases.every((p) => p.steps.every((s) => chainDone(s.chain)));
        if (done) return false;
        return Date.now() - startedAt < CHAIN_WAIT_MS ? POLL_MS : false;
      },
    },
  });
  // When a capture's status changes, the activity feed's badges follow.
  const chainStates = data?.purchases.map((p) => p.steps.map((s) => s.chain?.status ?? '').join()).join('|');
  useEffect(() => {
    if (chainStates) void queryClient.invalidateQueries({ queryKey: getListActivityQueryKey() });
  }, [chainStates, queryClient]);
  if (!data) return null;
  return <SettlementSteps settlement={data} />;
}

/**
 * The run's result: each purchase, then its three steps appearing one after
 * another, purchase by purchase.
 */
export function SettlementSteps({ settlement }: { settlement: Settlement }) {
  // Each purchase takes its turn: its card, then its steps.
  const startOf = (index: number) => settlement.purchases.slice(0, index).reduce((n, p) => n + p.steps.length + 1, 1);
  return (
    <div className="mt-4" data-testid={`summary-settlement-${settlement.id}`}>
      <p className={cn('type-body-sm flex items-center gap-2', motion.riseIn)} role="status">
        <CheckCircle2 className="size-5 text-approved" aria-hidden="true" />
        Settled {settlement.purchaseCount} {settlement.purchaseCount === 1 ? 'purchase' : 'purchases'} ·{' '}
        <span className="tnum font-semibold">{formatCents(settlement.totalCents)}</span>
      </p>
      <ul className="mt-3 flex flex-col gap-3">
        {settlement.purchases.map((p, pi) => (
          <li
            key={p.authorizationId}
            className={cn('rounded-card-sm bg-surface-alt p-4', motion.riseIn)}
            style={stagger(startOf(pi), 0, SETTLE_STAGGER_MS)}
            data-testid={`settled-purchase-${p.authorizationId}`}
          >
            <p className="flex items-baseline justify-between gap-2">
              <span className="type-link-sm">
                {p.merchantName}
                {p.bucketName && <span className="font-normal text-ink-muted"> · {p.bucketName}</span>}
              </span>
              <span className="type-link-sm tnum">{formatCents(p.amountCents)}</span>
            </p>
            <ol className="mt-3 flex flex-col gap-3" aria-label={`How ${p.merchantName} was settled`}>
              {p.steps.map((s, i) => {
                const Icon = STEP_ICON[s.key];
                return (
                  <li
                    key={s.key}
                    className={cn('flex gap-3', motion.riseIn)}
                    style={stagger(startOf(pi) + i + 1, 0, SETTLE_STAGGER_MS)}
                    data-testid={`settlement-step-${p.authorizationId}-${i + 1}`}
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface text-ink">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="type-body-sm">
                        <span className="tnum text-ink-muted">{i + 1}.</span> {s.label}
                      </p>
                      <p className="type-caption mt-0.5 text-ink-muted">{s.detail}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        {s.simulated && <Tag tone="neutral">Simulated</Tag>}
                        {s.chain && <ChainBadge status={chainStatusOf(s.chain)} animateChange />}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </li>
        ))}
      </ul>
      <p className="type-caption mt-3 text-ink-muted">
        Card issuer's testnet wallet:{' '}
        <a
          href={settlement.issuerExplorerUrl}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-primary underline-offset-2 hover:underline"
          data-testid="link-issuer-wallet"
        >
          {shortAddress(settlement.issuerAddress)}
        </a>
      </p>
    </div>
  );
}
