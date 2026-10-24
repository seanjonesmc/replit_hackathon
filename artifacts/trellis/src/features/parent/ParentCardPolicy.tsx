import { useCallback, useEffect, useState } from 'react';
import { Ban, Sparkles } from 'lucide-react';
import { useGetCard, useGetCardAndPolicy } from '@workspace/api-client-react';
import { motion } from '@/components/trellis/motion';
import { PolicyCard } from '@/components/trellis/policy-card';
import { ChainBadge, PillButton, SectionTitle, Tag } from '@/components/trellis/primitives';
import { LoadingRegion, Skeleton } from '@/components/trellis/skeletons';
import { ErrorState } from '@/components/trellis/states';
import { VirtualCard } from '@/components/trellis/virtual-card';
import { CardFacts } from '@/features/family/CardFacts';
import { ScreenHeader } from '@/features/shell/layout';
import { chainStatusOf } from '@/lib/chain';
import { cn } from '@/lib/utils';
import { CardFreezeControl } from './CardFreezeControl';
import { PolicyBuilderSheet } from './policy-builder/PolicyBuilderSheet';
import { linesForGroups, visibleLines, type RuleGroup } from './policy-builder/rule-groups';

/** Name shown before the builder has added any rules (the demo's starting point). */
const STARTING_POLICY_NAME = 'Starting limits';
/** How long newly added lines keep their highlight. */
const HIGHLIGHT_MS = 1600;

export default function ParentCardPolicy() {
  const { data, isLoading, isError, refetch, isFetching } = useGetCardAndPolicy();
  // The card's live state (GET /api/card); the freeze switch updates it at once.
  const liveCard = useGetCard();
  // Simulated builder state, client side only: a reload returns to the trimmed start.
  const [applied, setApplied] = useState<ReadonlySet<RuleGroup>>(new Set());
  const [fresh, setFresh] = useState<{ lines: ReadonlySet<string>; blocked: boolean }>({ lines: new Set(), blocked: false });
  const [highlight, setHighlight] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);

  const policyLines = data?.policy.lines;
  const onApply = useCallback(
    (groups: ReadonlySet<RuleGroup>) => {
      const added = new Set([...groups].filter((g) => !applied.has(g)));
      if (added.size === 0) return;
      setApplied(new Set([...applied, ...added]));
      setFresh({ lines: new Set(linesForGroups(policyLines ?? [], added).map((l) => l.text)), blocked: added.has('blocked') });
      setHighlight(true);
    },
    [applied, policyLines],
  );

  useEffect(() => {
    if (!highlight) return;
    const t = setTimeout(() => setHighlight(false), HIGHLIGHT_MS);
    return () => {
      clearTimeout(t);
    };
  }, [highlight]);
  if (isLoading) {
    return (
      <LoadingRegion label="Loading the card and policy" className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="aspect-[1.586] w-full rounded-card" />
        <Skeleton className="h-64 rounded-card" />
      </LoadingRegion>
    );
  }
  if (isError || !data) return <ErrorState onRetry={() => refetch()} retrying={isFetching} />;

  const { policy, blockedCategories } = data;
  const card = liveCard.data ?? data.card;
  const showBlocked = applied.has('blocked') && blockedCategories.length > 0;
  return (
    <>
      <ScreenHeader title="Card & policy" subtitle={`${card.dependentName}'s card and the rules it follows.`} />
      <VirtualCard
        holderName={card.dependentName}
        last4={card.last4}
        expiryMonth={card.expiryMonth}
        expiryYear={card.expiryYear}
        frozen={card.status === 'frozen'}
        data-testid="card-dependent-card"
      />
      <CardFacts card={card} />
      <CardFreezeControl card={card} leading={<ChainBadge status={chainStatusOf(card.chain)} />} className="mt-3" />

      <section className="mt-8" aria-labelledby="policy-title">
        <SectionTitle>
          <span id="policy-title">Current policy</span>
        </SectionTitle>
        <PolicyCard
          title={applied.size > 0 ? policy.presetName : STARTING_POLICY_NAME}
          lines={visibleLines(policy.lines, applied)}
          freshLines={fresh.lines}
          highlightFresh={highlight}
          footer={
            <PillButton
              size="sm"
              variant="tint"
              block
              icon={<Sparkles className="size-4" aria-hidden="true" />}
              onClick={() => setBuilderOpen(true)}
              data-testid="button-policy-builder"
            >
              Describe new rules in plain English
            </PillButton>
          }
        />
      </section>

      {showBlocked && (
        <section className={cn('mt-8', fresh.blocked && motion.ruleIn)} aria-labelledby="blocked-title" data-testid="section-blocked">
          <SectionTitle>
            <span id="blocked-title">Always declined</span>
          </SectionTitle>
          <div className="rounded-card-sm border bg-surface p-4">
            <ul className="flex flex-wrap gap-2" data-testid="list-blocked-categories">
              {blockedCategories.map((c, i) => (
                <li
                  key={c.category}
                  className={cn(fresh.blocked && motion.itemIn)}
                  style={fresh.blocked ? { animationDelay: `${200 + i * 90}ms`, animationFillMode: 'backwards' } : undefined}
                >
                  <Tag tone="rejected">
                    <Ban className="mr-1 size-3.5" aria-hidden="true" />
                    {c.label}
                  </Tag>
                </li>
              ))}
            </ul>
            <p className="type-caption mt-3 text-ink-muted">The card declines these merchant types, whatever the amount.</p>
          </div>
        </section>
      )}

      <PolicyBuilderSheet
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        dependentName={card.dependentName}
        policyLines={policy.lines}
        applied={applied}
        onApply={onApply}
      />
    </>
  );
}
