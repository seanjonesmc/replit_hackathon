import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PillButton } from './primitives';

/* ---------- Progress dots ---------- */
export function ProgressDots({ step, total, className }: { step: number; total: number; className?: string }) {
  return (
    <div className={cn('flex items-center gap-1.5', className)} data-testid="progress-dots">
      <span className="sr-only">
        Step {step} of {total}
      </span>
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1;
        return (
          <span
            key={n}
            aria-hidden="true"
            className={cn(
              'h-2 rounded-pill transition-[width,background-color] duration-200 ease-out',
              n === step ? 'w-6 bg-primary' : 'w-2',
              n < step && 'bg-primary',
              n > step && 'bg-hairline',
            )}
          />
        );
      })}
    </div>
  );
}

/* ---------- Single-tap pill answers ---------- */
export interface ChoiceOption {
  value: string;
  label: string;
}

interface ChoicePillsProps {
  options: ChoiceOption[];
  value: string | null;
  onChange: (value: string) => void;
  /** Accessible name for the group, usually the question text. */
  label: string;
  className?: string;
}

/** One tap picks an answer. A radio group: Tab enters, arrow keys move. */
export function ChoicePills({ options, value, onChange, label, className }: ChoicePillsProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = options.findIndex((o) => o.value === value);
  const tabStop = selectedIndex >= 0 ? selectedIndex : 0;

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (i + step + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div role="radiogroup" aria-label={label} className={cn('flex flex-wrap gap-2', className)}>
      {options.map((o, i) => {
        const checked = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={i === tabStop ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              'h-11 rounded-pill border px-5 type-link-sm transition-[background-color,color,border-color,transform] duration-150 ease-out active:scale-[0.97]',
              checked ? 'border-primary bg-primary text-surface' : 'border-ink bg-surface text-ink hover:bg-ink/[0.04]',
            )}
            data-testid={`choice-${o.value}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Onboarding step layout ---------- */
interface OnboardingStepProps {
  step: number;
  totalSteps: number;
  question: string;
  helper?: ReactNode;
  /** The answers, usually <ChoicePills>. */
  children: ReactNode;
  onBack?: () => void;
  onContinue: () => void;
  continueDisabled?: boolean;
  continueLabel?: string;
  onSkip?: () => void;
  skipLabel?: string;
  /** Extra content under the actions, e.g. a live status message. */
  footer?: ReactNode;
  titleAs?: 'h1' | 'h2' | 'h3' | 'h4';
  className?: string;
}

/**
 * One onboarding screen: back button and progress dots on top, one question,
 * the answers, and a large continue button with a skip link at the bottom.
 * Fills its container.
 */
export function OnboardingStep({
  step,
  totalSteps,
  question,
  helper,
  children,
  onBack,
  onContinue,
  continueDisabled,
  continueLabel = 'Continue',
  onSkip,
  skipLabel = 'Skip to demo',
  footer,
  titleAs: Title = 'h1',
  className,
}: OnboardingStepProps) {
  return (
    <section className={cn('flex h-full min-h-0 flex-col overflow-y-auto bg-surface p-6', className)} data-testid="onboarding-step">
      <div className="flex h-10 items-center justify-between">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="-ml-2 grid size-10 place-items-center rounded-full text-ink hover:bg-ink/[0.04]"
            data-testid="button-onboarding-back"
          >
            <ChevronLeft className="size-6" aria-hidden="true" />
          </button>
        ) : (
          <span className="size-10" aria-hidden="true" />
        )}
        <ProgressDots step={step} total={totalSteps} />
        <span className="size-10" aria-hidden="true" />
      </div>

      <div className="mt-8">
        <Title className="type-display-md">{question}</Title>
        {helper && <p className="type-body-sm mt-3 text-ink-muted">{helper}</p>}
      </div>

      <div className="mt-8">{children}</div>

      <div className="mt-auto flex flex-col items-center gap-3 pt-8">
        <PillButton block onClick={onContinue} disabled={continueDisabled} data-testid="button-onboarding-continue">
          {continueLabel}
        </PillButton>
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="type-link-sm rounded-input px-2 py-1 text-primary hover:text-primary-hover hover:underline"
            data-testid="button-onboarding-skip"
          >
            {skipLabel}
          </button>
        )}
        {footer}
      </div>
    </section>
  );
}
