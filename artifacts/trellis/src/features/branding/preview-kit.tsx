import { useState, type ReactNode } from 'react';
import { FlaskConical } from 'lucide-react';
import { SectionTitle } from '@/components/trellis/primitives';

/** Every sample collection carries this label. */
export const SAMPLE_LABEL = 'Preview data · testnet only';

export function SampleLabel() {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-tag border border-dashed border-pending bg-pending-bg px-2 py-1 type-label text-pending"
      data-testid="label-preview-data"
    >
      <FlaskConical className="size-3.5" aria-hidden="true" />
      {SAMPLE_LABEL}
    </span>
  );
}

export function Specimen({ children }: { children: ReactNode }) {
  return <span className="type-caption text-ink-muted">{children}</span>;
}

/** A titled white panel inside the preview. */
export function Panel({ id, title, children, note }: { id: string; title: string; children: ReactNode; note?: ReactNode }) {
  return (
    <PreviewSection id={id} title={title} note={note}>
      <div className="rounded-card bg-surface p-6 md:p-8">{children}</div>
    </PreviewSection>
  );
}

/** A titled section placed directly on the sand background. */
export function PreviewSection({ id, title, children, note }: { id: string; title: string; children: ReactNode; note?: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24">
      <SectionTitle action={note}>
        <span id={`${id}-title`}>{title}</span>
      </SectionTitle>
      {children}
    </section>
  );
}

/** A 390px-wide phone screen for full-screen components. */
export function PhoneFrame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      role="group"
      aria-label={label}
      className="mx-auto h-[720px] w-full max-w-[390px] overflow-hidden rounded-card border bg-surface"
    >
      {children}
    </div>
  );
}

/**
 * Preview-only actions say so out loud instead of pretending to work.
 * Returns a trigger and the live message to render.
 */
export function usePreviewNotice() {
  const [message, setMessage] = useState('');
  const notify = (action: string) => setMessage(`${action}: preview only. Nothing was sent or saved.`);
  const node = (
    <p aria-live="polite" className="type-caption min-h-5 text-center text-ink-muted" data-testid="text-preview-notice">
      {message}
    </p>
  );
  return [notify, node, () => setMessage('')] as const;
}
