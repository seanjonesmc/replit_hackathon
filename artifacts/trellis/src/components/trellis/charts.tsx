import { type ReactNode } from 'react';
import { Bar, BarChart, Cell, Pie, PieChart, XAxis } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { ChartContainer } from '@/components/ui/chart';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { formatCents } from '@/lib/format';
import { cn } from '@/lib/utils';

/**
 * Chart building blocks on the shared Recharts wrapper: a donut with a text
 * legend, a bar series and a KPI tile. Colors are the design system's chart
 * order (chart1–5), read from the BRAND variables. Every chart carries its
 * numbers as text too (legend or screen-reader list), so nothing depends on
 * color or on seeing the graphic.
 */

// The brand variables themselves (set at runtime on <html>), in the design
// system's chart1–5 order. Tailwind's chart-* aliases are compile-time only.
const CHART_COLORS = [
  'var(--color-primary)',
  'var(--color-signature)',
  'var(--color-approved)',
  'var(--color-pending)',
  'var(--color-rejected)',
] as const;

/** The chart color for the nth series (buckets in display order, dependents in order). */
export function chartColor(index: number): string {
  return CHART_COLORS[((index % CHART_COLORS.length) + CHART_COLORS.length) % CHART_COLORS.length]!;
}

/** A 0–1 share as a whole percent: 0.333 → "33%", tiny but non-zero → "<1%". */
export function formatShare(share: number): string {
  if (share > 0 && share < 0.005) return '<1%';
  return `${Math.round(share * 100)}%`;
}

export interface DonutSlice {
  key: string;
  label: string;
  valueCents: number;
  color: string;
  /** Extra text after the amount in the legend, e.g. "3 purchases". */
  note?: string;
}

/** The legend's swatch. A hairline ring keeps pale colors (the lime) visible on white. */
function Swatch({ color }: { color: string }) {
  return <span className="mt-1 size-3 shrink-0 rounded-[4px] ring-1 ring-ink/20" style={{ background: color }} aria-hidden="true" />;
}

/**
 * A donut with the total in the middle and a legend listing each slice's
 * dollars and share as text. Slices worth nothing are left out. The graphic
 * is hidden from screen readers; the legend is the text alternative.
 */
export function DonutChart({
  slices,
  centerLabel,
  centerValue,
  size = 'md',
  legend = true,
  className,
  'data-testid': testId,
}: {
  slices: DonutSlice[];
  centerLabel: string;
  centerValue: string;
  size?: 'sm' | 'md';
  legend?: boolean;
  className?: string;
  'data-testid'?: string;
}) {
  const reduced = useReducedMotion();
  const shown = slices.filter((s) => s.valueCents > 0);
  const total = shown.reduce((sum, s) => sum + s.valueCents, 0);
  const box = size === 'sm' ? 'size-[112px]' : 'size-[148px]';
  return (
    <div className={cn('flex flex-wrap items-center gap-5', className)} data-testid={testId}>
      <div className={cn('relative shrink-0', box)} aria-hidden="true">
        <ChartContainer config={{}} className={cn('aspect-square', box)}>
          <PieChart>
            <Pie
              data={shown}
              dataKey="valueCents"
              nameKey="label"
              innerRadius="64%"
              outerRadius="100%"
              paddingAngle={shown.length > 1 ? 2 : 0}
              stroke="var(--color-surface)"
              strokeWidth={2}
              startAngle={90}
              endAngle={-270}
              isAnimationActive={!reduced}
              animationDuration={600}
            >
              {shown.map((s) => (
                <Cell key={s.key} fill={s.color} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={cn('font-heading font-semibold tnum leading-none text-ink', size === 'sm' ? 'text-[17px]' : 'text-[21px]')}>
            {centerValue}
          </span>
          <span className="mt-1 text-[12px] font-semibold leading-tight text-ink-muted">{centerLabel}</span>
        </div>
      </div>
      {legend && (
        <ul className="flex min-w-[150px] flex-1 flex-col gap-2" aria-label={`${centerLabel}: ${centerValue}`}>
          {shown.map((s) => (
            <li key={s.key} className="flex items-start gap-2" data-testid={`legend-${s.key}`}>
              <Swatch color={s.color} />
              <span className="min-w-0 flex-1">
                <span className="type-body-sm block truncate">{s.label}</span>
                {s.note && <span className="type-caption block text-ink-muted">{s.note}</span>}
              </span>
              <span className="text-right">
                <span className="type-link-sm tnum block">{formatCents(s.valueCents)}</span>
                <span className="type-caption tnum block text-ink-muted">{formatShare(total > 0 ? s.valueCents / total : 0)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export interface BarDatum {
  key: string;
  /** Axis label, e.g. "Mon". */
  label: string;
  /** Full label for the text alternative, e.g. "Monday, Oct 19". */
  longLabel: string;
  valueCents: number;
}

/**
 * Vertical bars in the first chart color, with a screen-reader list of every
 * bar's value as the text alternative.
 */
export function BarSeries({
  data,
  label,
  className,
  'data-testid': testId,
}: {
  data: BarDatum[];
  /** What the bars show, e.g. "Spending per day". */
  label: string;
  className?: string;
  'data-testid'?: string;
}) {
  const reduced = useReducedMotion();
  // Thin out axis labels on long series so they never overlap.
  const every = Math.max(1, Math.ceil(data.length / 7));
  return (
    <figure className={className} data-testid={testId}>
      <div aria-hidden="true">
        <ChartContainer config={{}} className="aspect-auto h-[150px] w-full">
          <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              interval={every - 1}
              tickMargin={6}
              tick={{ fill: 'var(--color-ink-muted)', fontSize: 12 }}
            />
            <Bar dataKey="valueCents" fill={chartColor(0)} radius={[6, 6, 0, 0]} maxBarSize={28} minPointSize={0} isAnimationActive={!reduced} animationDuration={600} />
          </BarChart>
        </ChartContainer>
      </div>
      <figcaption className="sr-only">
        {label}
        <ul>
          {data.map((d) => (
            <li key={d.key}>
              {d.longLabel}: {formatCents(d.valueCents)}
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}

/** One headline number with a label and an optional caption. */
export function KpiTile({
  label,
  value,
  caption,
  className,
  'data-testid': testId,
}: {
  label: string;
  value: ReactNode;
  caption?: ReactNode;
  className?: string;
  'data-testid'?: string;
}) {
  return (
    <div className={cn('rounded-card-sm border bg-surface p-4', className)} data-testid={testId}>
      <p className="type-label text-ink-muted">{label}</p>
      <p className="mt-2 font-heading text-[24px] font-semibold leading-none tracking-[-0.5px] tnum">{value}</p>
      {caption && <p className="type-caption mt-1.5 text-ink-muted">{caption}</p>}
    </div>
  );
}

/** The plain empty state every chart shows when the period has no spending. */
export function NoSpendingYet({ body, className, 'data-testid': testId }: { body?: ReactNode; className?: string; 'data-testid'?: string }) {
  return (
    <div className={cn('flex items-center gap-3 rounded-card-sm bg-surface-alt p-4', className)} data-testid={testId ?? 'state-no-spending'}>
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-ink-muted">
        <PieChartIcon className="size-5" aria-hidden="true" />
      </span>
      <span>
        <span className="type-link-sm block">No spending yet</span>
        {body && <span className="type-caption block text-ink-muted">{body}</span>}
      </span>
    </div>
  );
}
