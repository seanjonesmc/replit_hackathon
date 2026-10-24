import { useState, type ReactNode } from 'react';
import { BookOpen, Bus, FlaskConical, Plus, Sparkles, UtensilsCrossed } from 'lucide-react';
import { BRAND } from '@brand/brand.config';
import {
  InitialAvatar,
  LogoMark,
  PillButton,
  SectionTitle,
  StatusPill,
  Tag,
  VerifiedBadge,
  Wordmark,
  brandAsset,
} from '@/components/trellis/primitives';
import {
  activity,
  buckets,
  demo,
  formatCents,
  potTotal,
  type BucketIcon,
} from '@/lib/preview-data';

const SAMPLE_LABEL = 'Preview data · testnet only';

const bucketIcons: Record<BucketIcon, typeof BookOpen> = {
  food: UtensilsCrossed,
  school: BookOpen,
  social: Sparkles,
  transit: Bus,
};

const swatches: { name: string; token: string; cls: string; key: keyof typeof BRAND.colors }[] = [
  { name: 'Signature', token: 'signature', cls: 'bg-signature', key: 'signature' },
  { name: 'Primary', token: 'primary', cls: 'bg-primary', key: 'primary' },
  { name: 'Primary hover', token: 'primary-hover', cls: 'bg-primary-hover', key: 'primaryHover' },
  { name: 'Tint', token: 'tint', cls: 'bg-tint', key: 'tint' },
  { name: 'Ink', token: 'ink', cls: 'bg-ink', key: 'ink' },
  { name: 'Ink muted', token: 'ink-muted', cls: 'bg-ink-muted', key: 'inkMuted' },
  { name: 'Surface', token: 'surface', cls: 'bg-surface', key: 'surface' },
  { name: 'Surface alt', token: 'surface-alt', cls: 'bg-surface-alt', key: 'surfaceAlt' },
  { name: 'Hairline', token: 'hairline', cls: 'bg-hairline', key: 'hairline' },
  { name: 'Approved', token: 'approved', cls: 'bg-approved', key: 'approved' },
  { name: 'Approved bg', token: 'approved-bg', cls: 'bg-approved-bg', key: 'approvedBg' },
  { name: 'Rejected', token: 'rejected', cls: 'bg-rejected', key: 'rejected' },
  { name: 'Rejected bg', token: 'rejected-bg', cls: 'bg-rejected-bg', key: 'rejectedBg' },
  { name: 'Pending', token: 'pending', cls: 'bg-pending', key: 'pending' },
  { name: 'Pending bg', token: 'pending-bg', cls: 'bg-pending-bg', key: 'pendingBg' },
  { name: 'Chain', token: 'chain', cls: 'bg-chain', key: 'chain' },
  { name: 'Chain bg', token: 'chain-bg', cls: 'bg-chain-bg', key: 'chainBg' },
];

const typeScale = [
  ['type-display-xxl', 'Display XXL'],
  ['type-display-xl', 'Display XL'],
  ['type-display-md', 'Display MD'],
  ['type-title', 'Title'],
  ['type-body-lg', 'Body LG'],
  ['type-body-md', 'Body MD'],
  ['type-body-lead', 'Body lead'],
  ['type-body-sm', 'Body SM'],
  ['type-link-md', 'Link MD'],
  ['type-link-sm', 'Link SM'],
  ['type-caption', 'Caption'],
  ['type-label', 'Label'],
] as const;

const radii = [
  { name: 'pill', cls: 'rounded-pill', value: BRAND.radius.pill },
  { name: 'card', cls: 'rounded-card', value: BRAND.radius.card },
  { name: 'card-sm', cls: 'rounded-card-sm', value: BRAND.radius.cardSm },
  { name: 'tag', cls: 'rounded-tag', value: BRAND.radius.tag },
  { name: 'input', cls: 'rounded-input', value: BRAND.radius.input },
];

const variants = ['primary', 'outline', 'tint', 'onDark'] as const;
const states = ['default', 'hover', 'pressed', 'focus', 'disabled', 'loading'] as const;

const nav = [
  ['assets', 'Brand assets'],
  ['colors', 'Colors'],
  ['type', 'Typography'],
  ['layout', 'Spacing & radii'],
  ['buttons', 'Buttons'],
  ['status', 'Status & tags'],
  ['compositions', 'Compositions'],
] as const;

function Panel({ id, title, children, note }: { id: string; title: string; children: ReactNode; note?: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24">
      <SectionTitle action={note}>
        <span id={`${id}-title`}>{title}</span>
      </SectionTitle>
      <div className="rounded-card bg-surface p-6 md:p-8">{children}</div>
    </section>
  );
}

function SampleLabel() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-tag border border-dashed border-pending bg-pending-bg px-2 py-1 type-label text-pending" data-testid="label-preview-data">
      <FlaskConical className="size-3.5" aria-hidden="true" />
      {SAMPLE_LABEL}
    </span>
  );
}

function Specimen({ children }: { children: ReactNode }) {
  return <span className="type-caption text-ink-muted">{children}</span>;
}

export default function BrandPreview() {
  const [pressCount, setPressCount] = useState(0);
  const [demoLoading, setDemoLoading] = useState(false);

  const toggleLoading = () => {
    setDemoLoading(true);
    window.setTimeout(() => setDemoLoading(false), 1200);
  };

  return (
    <div className="min-h-[100dvh] bg-surface-alt">
      <div role="note" className="sticky top-0 z-20 bg-pending-bg px-4 py-2 text-center type-caption font-semibold text-pending" data-testid="banner-dev-preview">
        Development-only design preview. Nothing here is real money, a real decision, or an on-chain record.
      </div>

      <header className="header-sky px-4 pb-16 pt-10 md:px-8">
        <div className="mx-auto max-w-6xl">
          <Wordmark onDark />
          <h1 className="type-display-md mt-8 text-surface md:type-display-xl">Phase 0 brand preview</h1>
          <p className="type-body-md mt-3 max-w-2xl text-surface">{BRAND.tagline}</p>
          <nav aria-label="Preview sections" className="no-scrollbar mt-6 flex gap-2 overflow-x-auto">
            {nav.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="shrink-0 rounded-pill bg-surface px-4 py-2 type-link-sm text-ink" data-testid={`link-section-${id}`}>
                {label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto -mt-8 flex max-w-6xl flex-col gap-12 px-4 pb-16 md:px-8">
        <Panel id="assets" title="Brand assets">
          <div className="grid gap-6 md:grid-cols-3">
            <figure className="flex flex-col items-start gap-3">
              <LogoMark className="size-16" />
              <figcaption className="type-caption text-ink-muted">Logo mark · {BRAND.logo.mark}</figcaption>
            </figure>
            <figure className="flex flex-col items-start gap-3">
              <img src={brandAsset(BRAND.logo.wordmark)} alt={`${BRAND.appName} wordmark`} className="h-16 w-auto" data-testid="img-wordmark" />
              <figcaption className="type-caption text-ink-muted">Wordmark · {BRAND.logo.wordmark}</figcaption>
            </figure>
            <figure className="flex flex-col items-start gap-3">
              <div className="rounded-card-sm bg-signature p-4">
                <Wordmark onDark />
              </div>
              <figcaption className="type-caption text-ink-muted">Wordmark on signature</figcaption>
            </figure>
          </div>
          <dl className="mt-6 grid gap-2 border-t pt-6 type-caption sm:grid-cols-2">
            <div><dt className="type-label text-ink-muted">App name</dt><dd data-testid="text-brand-name">{BRAND.appName}</dd></div>
            <div><dt className="type-label text-ink-muted">Tagline</dt><dd>{BRAND.tagline}</dd></div>
            <div><dt className="type-label text-ink-muted">Favicon</dt><dd>{BRAND.favicon}</dd></div>
            <div><dt className="type-label text-ink-muted">Fonts</dt><dd>{BRAND.fonts.heading} / {BRAND.fonts.body}</dd></div>
          </dl>
        </Panel>

        <Panel id="colors" title="Color tokens">
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {swatches.map((s) => (
              <li key={s.token} data-testid={`swatch-${s.token}`}>
                <div className={`h-16 rounded-card-sm border ${s.cls}`} aria-hidden="true" />
                <p className="type-link-sm mt-2">{s.name}</p>
                <p className="type-caption text-ink-muted">--color-{s.token}</p>
                <p className="type-caption tnum text-ink-muted">{BRAND.colors[s.key]}</p>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel id="type" title="Typography">
          <ul className="flex flex-col divide-y">
            {typeScale.map(([cls, label]) => (
              <li key={cls} className="flex flex-col gap-1 py-3 md:flex-row md:items-baseline md:gap-6">
                <span className="type-caption w-40 shrink-0 text-ink-muted">{label} · .{cls}</span>
                <span className={`${cls} min-w-0 break-words`}>{BRAND.tagline}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel id="layout" title="Spacing & radii">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="type-label text-ink-muted">Spacing scale (px)</h3>
              <ul className="mt-3 flex flex-col gap-2">
                {BRAND.spacing.map((v) => (
                  <li key={v} className="flex items-center gap-3">
                    <span className="type-caption tnum w-8 text-ink-muted">{v}</span>
                    <span className="h-3 rounded-tag bg-primary" style={{ width: v * 4 }} aria-hidden="true" />
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="type-label text-ink-muted">Radii</h3>
              <ul className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {radii.map((r) => (
                  <li key={r.name}>
                    <div className={`h-16 border-2 border-primary bg-tint ${r.cls}`} aria-hidden="true" />
                    <p className="type-caption mt-2">{r.name} · {r.value}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Panel>

        <Panel id="buttons" title="Pill buttons" note={<Specimen>Forced states are static specimens</Specimen>}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-separate border-spacing-y-3">
              <caption className="sr-only">Pill button variants by state</caption>
              <thead>
                <tr>
                  <th scope="col" className="type-label text-left text-ink-muted">Variant</th>
                  {states.map((st) => (
                    <th key={st} scope="col" className="type-label text-left text-ink-muted">{st}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {variants.map((v) => (
                  <tr key={v}>
                    <th scope="row" className="type-link-sm pr-4 text-left">{v}</th>
                    {states.map((st) => (
                      <td key={st} className={v === 'onDark' ? 'bg-signature p-2 first:rounded-l-card-sm last:rounded-r-card-sm' : 'p-2'}>
                        <PillButton
                          variant={v}
                          size="sm"
                          tabIndex={-1}
                          aria-hidden="true"
                          forceState={st === 'hover' || st === 'pressed' || st === 'focus' ? st : undefined}
                          disabled={st === 'disabled'}
                          loading={st === 'loading'}
                          data-testid={`specimen-button-${v}-${st}`}
                        >
                          Label
                        </PillButton>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex flex-col gap-3 border-t pt-6">
            <h3 className="type-label text-ink-muted">Sizes & live interaction (local only)</h3>
            <div className="flex flex-wrap items-center gap-3">
              <PillButton onClick={() => setPressCount((c) => c + 1)} data-testid="button-try-press">
                Try me
              </PillButton>
              <PillButton variant="outline" size="sm" icon={<Plus className="size-4" aria-hidden="true" />} onClick={toggleLoading} loading={demoLoading} data-testid="button-try-loading">
                Show loading
              </PillButton>
              <PillButton variant="tint" disabled aria-label={`${BRAND.copy.askParentLabel} — preview only`}>
                {BRAND.copy.askParentLabel}
              </PillButton>
              <span className="type-caption text-ink-muted" aria-live="polite" data-testid="text-press-count">
                Pressed {pressCount} {pressCount === 1 ? 'time' : 'times'} · nothing is sent
              </span>
            </div>
          </div>
        </Panel>

        <Panel id="status" title="Status, badges, tags & avatars">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="flex flex-col gap-3">
              <h3 className="type-label text-ink-muted">Status pills</h3>
              <div className="flex flex-wrap gap-2">
                <StatusPill status="approved" />
                <StatusPill status="rejected" />
                <StatusPill status="pending" />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="type-label text-ink-muted">Chain badges</h3>
              <div className="flex flex-wrap items-center gap-2">
                <VerifiedBadge state="preview" />
                <VerifiedBadge state="confirming" />
              </div>
              <Specimen>
                Specimens only. "{BRAND.copy.verifiedLabel}" appears only with a real explorer link and is never shown in this preview.
              </Specimen>
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="type-label text-ink-muted">Tags</h3>
              <div className="flex flex-wrap gap-2">
                <Tag>Chain</Tag>
                <Tag tone="rejected">Blocked</Tag>
                <Tag tone="neutral">Neutral</Tag>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="type-label text-ink-muted">Avatars</h3>
              <div className="flex flex-wrap gap-2">
                {[demo.parent, ...demo.funders, demo.dependent].map((n) => (
                  <InitialAvatar key={n} name={n} />
                ))}
              </div>
            </div>
          </div>
        </Panel>

        <section id="compositions" aria-labelledby="compositions-title" className="scroll-mt-24">
          <SectionTitle action={<SampleLabel />}>
            <span id="compositions-title">Illustrative compositions</span>
          </SectionTitle>
          <div className="grid gap-6 lg:grid-cols-2">
            <article className="lattice relative overflow-hidden rounded-card bg-primary p-6 text-surface md:p-8" data-testid="card-family-preview">
              <div className="flex items-start justify-between gap-3">
                <p className="type-label">{demo.familyName}</p>
                <span className="rounded-tag bg-surface px-2 py-1 type-label text-pending">Sample</span>
              </div>
              <p className="type-display-md tnum mt-6" data-testid="text-pot-total">{formatCents(potTotal)}</p>
              <p className="type-caption mt-1">Illustrative family pot · not a real balance</p>
              <div className="mt-6 flex items-center gap-2">
                {[demo.parent, ...demo.funders, demo.dependent].map((n) => (
                  <InitialAvatar key={n} name={n} className="ring-2 ring-primary" />
                ))}
              </div>
              <p className="type-caption mt-2">
                {demo.dependent}, {demo.dependentAge} · card ending {demo.cardLast4} (sample)
              </p>
            </article>

            <article className="rounded-card bg-surface p-6 md:p-8" aria-label="Sample buckets">
              <div className="flex items-center justify-between gap-3">
                <h3 className="type-title">Buckets</h3>
                <SampleLabel />
              </div>
              <ul className="mt-4 flex flex-col gap-4">
                {buckets.map((b) => {
                  const Icon = bucketIcons[b.icon];
                  const pct = Math.round((b.available / b.total) * 100);
                  return (
                    <li key={b.id} className="flex items-center gap-3" data-testid={`card-bucket-${b.id}`}>
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-tint text-primary">
                        <Icon className="size-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="type-link-sm">{b.name}</p>
                          <p className="type-caption tnum">{formatCents(b.available)} left</p>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-pill bg-surface-alt" role="img" aria-label={`${pct}% of sample ${b.name} bucket available`}>
                          <div className="h-full rounded-pill bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="type-caption mt-1 text-ink-muted">{b.purpose} · funded by {b.fundedBy}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </article>

            <article className="rounded-card bg-surface p-6 md:p-8 lg:col-span-2" aria-label="Sample activity">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="type-title">Activity</h3>
                <SampleLabel />
              </div>
              <ul className="mt-4 flex flex-col divide-y">
                {activity.map((a) => (
                  <li key={a.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:gap-4" data-testid={`row-activity-${a.id}`}>
                    <InitialAvatar name={a.who} />
                    <div className="min-w-0 flex-1">
                      <p className="type-body-sm">{a.sentence}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="type-caption text-ink-muted">{a.when}</span>
                        <Tag tone="neutral">{a.bucket}</Tag>
                        <VerifiedBadge state="preview" />
                      </div>
                      {a.chainSteps && (
                        <ol className="mt-2 flex flex-wrap items-center gap-2 type-caption text-ink-muted" aria-label="Sample decision steps">
                          {a.chainSteps.map((s, i) => (
                            <li key={i} className="flex items-center gap-2">
                              {i > 0 && <span aria-hidden="true">→</span>}
                              {s.label}
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                    <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                      <span className="type-link-sm tnum">{formatCents(a.amount)}</span>
                      <StatusPill status={a.status} />
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
