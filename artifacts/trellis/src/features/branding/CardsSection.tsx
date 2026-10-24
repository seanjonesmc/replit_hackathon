import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { ActivityRow } from '@/components/trellis/activity-row';
import { BucketCard } from '@/components/trellis/bucket-card';
import { HeroBalanceCard } from '@/components/trellis/hero-balance-card';
import { InitialAvatar, PillButton } from '@/components/trellis/primitives';
import { VirtualCard } from '@/components/trellis/virtual-card';
import { activity, buckets, demo, potTotal, sampleCardExpiry } from '@/lib/preview-data';
import { PreviewSection, SampleLabel } from './preview-kit';

/** Hero balance card, virtual card, bucket cards and activity rows. */
export function CardsSection() {
  const [cardKey, setCardKey] = useState(0);
  const members = [demo.parent, ...demo.funders, demo.dependent];

  return (
    <PreviewSection id="cards" title="App cards" note={<SampleLabel />}>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h3 className="type-label flex min-h-10 items-center px-1 text-ink-muted">Hero balance card</h3>
          <HeroBalanceCard
            eyebrow={demo.familyName}
            amountCents={potTotal}
            caption="Illustrative family pot · not a real balance"
            badge={<span className="rounded-tag bg-surface px-2 py-1 type-label text-pending">Sample</span>}
            data-testid="card-hero-balance"
          >
            <div className="flex items-center gap-2">
              {members.map((n) => (
                <InitialAvatar key={n} name={n} className="ring-2 ring-signature" />
              ))}
            </div>
          </HeroBalanceCard>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex min-h-10 flex-wrap items-center justify-between gap-2 px-1">
            <h3 className="type-label text-ink-muted">Virtual card</h3>
            <PillButton
              variant="tint"
              size="sm"
              icon={<RotateCcw className="size-4" aria-hidden="true" />}
              onClick={() => setCardKey((k) => k + 1)}
              data-testid="button-replay-virtual-card"
            >
              Replay entry
            </PillButton>
          </div>
          <div className="grid place-items-center rounded-card bg-surface p-6">
            <VirtualCard
              key={cardKey}
              holderName={demo.dependent}
              last4={demo.cardLast4}
              expiryMonth={sampleCardExpiry.month}
              expiryYear={sampleCardExpiry.year}
              data-testid="card-virtual"
            />
          </div>
        </div>
      </div>

      <h3 className="type-label mt-8 px-1 text-ink-muted">Bucket cards</h3>
      <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
        {buckets.map((b) => (
          <BucketCard
            key={b.id}
            name={b.name}
            icon={b.icon}
            availableCents={b.available}
            totalCents={b.total}
            heldCents={b.held}
            purpose={b.purpose}
            fundedBy={b.fundedBy}
            data-testid={`card-bucket-${b.id}`}
          />
        ))}
      </div>

      <article className="mt-8 rounded-card bg-surface p-6 md:p-8" aria-labelledby="activity-sample-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 id="activity-sample-title" className="type-title">Activity rows</h3>
          <SampleLabel />
        </div>
        <ul className="mt-2 flex flex-col divide-y">
          {activity.map((a) => (
            <ActivityRow
              key={a.id}
              who={a.who}
              sentence={a.sentence}
              amountCents={a.amount}
              status={a.status}
              when={a.when}
              bucket={a.bucket}
              steps={a.chainSteps}
              chain={{ state: 'preview' }}
              data-testid={`row-activity-${a.id}`}
            />
          ))}
        </ul>
      </article>
    </PreviewSection>
  );
}
