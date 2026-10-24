import { useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { CheckCircle2, Clock, Loader2, ShieldCheck, ShieldOff, XCircle, ArrowUpRight } from 'lucide-react';
import { BRAND } from '@brand/brand.config';
import { SPROUT_PATHS } from '@brand/assets';
import { cn } from '@/lib/utils';
import type { ChainStatus, Decision } from '@/lib/domain';
import { initials } from '@/lib/format';
import { motion } from './motion';

export const brandAsset = (p: string) => import.meta.env.BASE_URL.replace(/\/$/, '') + p;

/* ---------- Logo ---------- */
export function LogoMark({ className }: { className?: string }) {
  return <img src={brandAsset(BRAND.logo.mark)} alt={BRAND.logo.alt} className={cn('size-9 rounded-[28%]', className)} data-testid="img-logo-mark" />;
}

/** The sprout glyph on its own (no tile), drawn inline from the shared brand paths. */
export function SproutGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="8 9 48 48" aria-hidden="true" className={cn('size-9 shrink-0', className)} data-testid="img-sprout-glyph">
      <path d={SPROUT_PATHS.topLeaf} fill="var(--color-signature)" />
      {SPROUT_PATHS.sides.map((d) => (
        <path key={d} d={d} fill="var(--color-ink)" />
      ))}
    </svg>
  );
}

/**
 * The app name lockup. On white it is the primary lockup (sprout glyph +
 * name); on a signature fill it uses the tiled app icon so the top leaf stays
 * visible.
 */
export function Wordmark({ onDark, className }: { onDark?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)} data-testid="text-app-name">
      {onDark ? <LogoMark className="ring-2 ring-surface/70" /> : <SproutGlyph />}
      <span className={cn('font-heading text-[26px] font-bold tracking-[-0.6px]', onDark ? 'text-on-signature' : 'text-ink')}>
        {BRAND.appName}
      </span>
    </span>
  );
}

/* ---------- Pill button ---------- */
type Variant = 'primary' | 'outline' | 'tint' | 'onDark';
interface PillProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'md' | 'sm';
  loading?: boolean;
  forceState?: 'hover' | 'pressed' | 'focus';
  icon?: ReactNode;
  block?: boolean;
}

const variantCls: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover',
  outline: 'bg-surface text-ink border border-ink hover:bg-ink/[0.04]',
  tint: 'bg-tint text-primary hover:bg-primary/15',
  onDark: 'bg-surface text-ink hover:bg-surface/90',
};
const forcedCls: Record<Variant, string> = {
  primary: 'bg-primary-hover',
  outline: 'bg-ink/[0.04]',
  tint: 'bg-primary/15',
  onDark: 'bg-surface/90',
};

/** The pill button's look, for a link that acts as a pill button (e.g. a router Link). */
export function pillButtonClass({
  variant = 'primary',
  size = 'md',
  forceState,
  block,
  className,
}: Pick<PillProps, 'variant' | 'size' | 'forceState' | 'block' | 'className'> = {}) {
  return cn(
    'relative inline-flex select-none items-center justify-center gap-2 rounded-pill font-bold transition-[background-color,transform,opacity] duration-200 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40',
    size === 'md' ? 'h-12 px-[34px] text-[18px]' : 'h-10 px-5 text-[15px]',
    variantCls[variant],
    forceState === 'hover' && forcedCls[variant],
    forceState === 'pressed' && cn(forcedCls[variant], 'scale-[0.97]'),
    forceState === 'focus' && 'outline-2 outline-offset-2 outline-primary',
    block && 'w-full',
    className,
  );
}

export function PillButton({ variant = 'primary', size = 'md', loading, forceState, icon, block, className, children, disabled, ...rest }: PillProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={pillButtonClass({ variant, size, forceState, block, className })}
    >
      {loading ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : icon}
      {children}
    </button>
  );
}

/* ---------- Decision meta (always icon + label, never color alone) ---------- */
export const decisionMeta: Record<Decision, { label: string; cls: string; fg: string; bg: string; Icon: typeof CheckCircle2 }> = {
  approved: { label: 'Approved', cls: 'bg-approved-bg text-approved', fg: 'text-approved', bg: 'bg-approved-bg', Icon: CheckCircle2 },
  rejected: { label: 'Declined', cls: 'bg-rejected-bg text-rejected', fg: 'text-rejected', bg: 'bg-rejected-bg', Icon: XCircle },
  pending: { label: 'Pending', cls: 'bg-pending-bg text-pending', fg: 'text-pending', bg: 'bg-pending-bg', Icon: Clock },
};

/* ---------- Status pill ---------- */
export function StatusPill({ status, className }: { status: Decision; className?: string }) {
  const m = decisionMeta[status];
  return (
    <span className={cn('inline-flex h-7 items-center gap-1.5 rounded-pill px-3 text-[13px] font-semibold', m.cls, className)} data-testid={`status-${status}`}>
      <m.Icon className="size-4" strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

/* ---------- Verified badge ----------
 * verified: only render with a real explorer href (never fabricated).
 * confirming: chain call in flight.
 * offchain: a real record that has not been written on chain yet.
 * failed: the chain write failed, so the record is in the app only.
 * preview: design-preview sample, nothing was sent.
 */
export function VerifiedBadge({ state, href }: { state: 'verified' | 'confirming' | 'offchain' | 'failed' | 'preview'; href?: string }) {
  const base = 'inline-flex h-7 items-center gap-1.5 rounded-pill px-3 text-[13px] font-semibold';
  if (state === 'failed')
    return (
      <span className={cn(base, 'border border-dashed border-hairline bg-surface text-ink-muted')} data-testid="badge-chain-failed">
        <ShieldOff className="size-3.5" aria-hidden="true" /> Not on chain
      </span>
    );
  if (state === 'offchain')
    return (
      <span className={cn(base, 'border border-dashed border-hairline bg-surface text-ink-muted')} data-testid="badge-offchain">
        <ShieldOff className="size-3.5" aria-hidden="true" /> Not on chain yet
      </span>
    );
  if (state === 'confirming')
    return (
      <span className={cn(base, 'bg-surface-alt text-ink-muted')} data-testid="badge-confirming">
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> Confirming
      </span>
    );
  if (state === 'preview')
    return (
      <span className={cn(base, 'border border-dashed border-chain/50 bg-surface text-chain')} data-testid="badge-preview">
        <ShieldCheck className="size-3.5" aria-hidden="true" /> Preview, not on chain
      </span>
    );
  const inner = (
    <>
      <ShieldCheck className="size-3.5" aria-hidden="true" /> {BRAND.copy.verifiedLabel}
      <ArrowUpRight className="size-3.5" aria-hidden="true" />
    </>
  );
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className={cn(base, 'bg-chain-bg text-chain hover:underline')} data-testid="link-verified">
      {inner}
    </a>
  ) : (
    <span className={cn(base, 'bg-chain-bg text-chain')} data-testid="badge-verified-specimen">{inner}</span>
  );
}

/**
 * Renders a typed ChainStatus. A verified status always carries its explorer link.
 * With `animateChange` (demo screens that watch a write land), a badge whose
 * state changes after mount fades to its new state; the first state shows at once.
 */
export function ChainBadge({ status, animateChange }: { status: ChainStatus; animateChange?: boolean }) {
  const first = useRef(status.state);
  const badge =
    status.state === 'verified' ? (
      <VerifiedBadge state="verified" href={status.href} />
    ) : status.state === 'sent' ? (
      // Confirmed without an explorer link yet: say it was sent, never "verified".
      <Tag>Sent to chain</Tag>
    ) : (
      <VerifiedBadge state={status.state} />
    );
  if (!animateChange || status.state === first.current) return badge;
  return (
    <span key={status.state} className={cn('inline-flex', motion.chainIn)} data-testid="badge-chain-changed">
      {badge}
    </span>
  );
}

/* ---------- Tag ---------- */
export function Tag({ children, tone = 'chain' }: { children: ReactNode; tone?: 'chain' | 'rejected' | 'neutral' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-tag px-2 py-1 text-[13px] font-medium',
        tone === 'chain' && 'bg-chain-bg text-chain',
        tone === 'rejected' && 'bg-rejected-bg text-rejected',
        tone === 'neutral' && 'bg-surface-alt text-ink-muted',
      )}
    >
      {children}
    </span>
  );
}

/* ---------- Avatar ---------- */
export function InitialAvatar({ name, className }: { name: string; className?: string }) {
  const ini = initials(name);
  return (
    <span className={cn('grid size-10 shrink-0 place-items-center rounded-full bg-surface-alt text-[14px] font-semibold text-ink', className)}>
      {ini}
    </span>
  );
}

/* ---------- Section heading ---------- */
export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-2 px-1">
      <h2 className="type-title">{children}</h2>
      {action}
    </div>
  );
}
