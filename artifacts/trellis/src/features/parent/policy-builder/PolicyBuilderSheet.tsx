import { useEffect, useMemo, useState } from 'react';
import { Check, Loader2, Pencil, Sparkles } from 'lucide-react';
import type { PolicyLine } from '@workspace/api-client-react';
import { PolicyLineIcon } from '@/components/trellis/policy-card';
import { motion } from '@/components/trellis/motion';
import { PillButton, Tag } from '@/components/trellis/primitives';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { cn } from '@/lib/utils';
import { ALL_GROUPS, groupOfLine, linesForGroups, matchGroups, ruleSuggestions, type RuleGroup } from './rule-groups';

/** Timing of the simulated flow (about 3.4s of "thinking"). */
export const BUILDER_TIMING = {
  typeCharMs: 22,
  thinkingStepMs: 850,
  reviewLineMs: 350,
  savingStepMs: 600,
} as const;

type Phase = 'compose' | 'thinking' | 'review' | 'saving';

interface PolicyBuilderSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dependentName: string;
  /** Every line of the real policy from the API. */
  policyLines: PolicyLine[];
  applied: ReadonlySet<RuleGroup>;
  onApply: (groups: ReadonlySet<RuleGroup>) => void;
}

/**
 * Simulated plain-English rules builder. Front end only: nothing is parsed by
 * an AI, sent or saved. It reveals lines the real policy already enforces.
 */
export function PolicyBuilderSheet({ open, onOpenChange, dependentName, policyLines, applied, onApply }: PolicyBuilderSheetProps) {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<Phase>('compose');
  const [text, setText] = useState('');
  const [typingTarget, setTypingTarget] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [groups, setGroups] = useState<ReadonlySet<RuleGroup>>(new Set());
  const [revealed, setRevealed] = useState(0);

  const suggestions = useMemo(() => ruleSuggestions(dependentName), [dependentName]);
  const thinkingSteps = useMemo(
    () => ['Reading your rules…', 'Matching merchant types…', `Checking ${dependentName}'s buckets…`, 'Drafting the policy…'],
    [dependentName],
  );
  const savingSteps = useMemo(() => ['Saving rules…', `Updating ${dependentName}'s card…`], [dependentName]);
  const reviewLines = useMemo(() => linesForGroups(policyLines, groups), [policyLines, groups]);

  // Every opening starts fresh.
  useEffect(() => {
    if (!open) return;
    setPhase('compose');
    setText('');
    setTypingTarget(null);
    setStep(0);
    setRevealed(0);
  }, [open]);

  // A chip types its text into the box, one character at a time.
  useEffect(() => {
    if (typingTarget === null) return;
    if (reduced || text === typingTarget) {
      setText(typingTarget);
      setTypingTarget(null);
      return;
    }
    const t = setTimeout(() => setText(typingTarget.slice(0, text.length + 1)), BUILDER_TIMING.typeCharMs);
    return () => {
      clearTimeout(t);
    };
  }, [typingTarget, text, reduced]);

  // Thinking and saving stages advance on a timer.
  useEffect(() => {
    if (phase !== 'thinking' && phase !== 'saving') return;
    const steps = phase === 'thinking' ? thinkingSteps : savingSteps;
    const ms = phase === 'thinking' ? BUILDER_TIMING.thinkingStepMs : BUILDER_TIMING.savingStepMs;
    const t = setTimeout(() => {
      if (step + 1 < steps.length) {
        setStep(step + 1);
      } else if (phase === 'thinking') {
        setRevealed(reduced ? Number.MAX_SAFE_INTEGER : 1);
        setPhase('review');
      } else {
        onApply(groups);
        onOpenChange(false);
      }
    }, ms);
    return () => {
      clearTimeout(t);
    };
  }, [phase, step, thinkingSteps, savingSteps, groups, reduced, onApply, onOpenChange]);

  // Review lines appear in turn.
  useEffect(() => {
    if (phase !== 'review' || revealed >= reviewLines.length) return;
    const t = setTimeout(() => setRevealed(revealed + 1), BUILDER_TIMING.reviewLineMs);
    return () => {
      clearTimeout(t);
    };
  }, [phase, revealed, reviewLines.length]);

  const hasLines = (gs: Iterable<RuleGroup>) => {
    const set = new Set(gs);
    return policyLines.some((l) => {
      const g = groupOfLine(l);
      return g !== null && set.has(g);
    });
  };

  const build = () => {
    const matched = matchGroups(text);
    // Only groups the real policy has lines for; otherwise show the full demo set.
    const usable = new Set([...matched].filter((g) => hasLines([g])));
    setGroups(usable.size > 0 ? usable : new Set(ALL_GROUPS));
    setTypingTarget(null);
    setStep(0);
    setPhase('thinking');
  };

  const confirm = () => {
    setStep(0);
    setPhase('saving');
  };

  const typing = typingTarget !== null;
  const allApplied = reviewLines.length > 0 && reviewLines.every((l) => applied.has(groupOfLine(l)!));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        overlayClassName="bg-ink/40"
        className="mx-auto max-h-[92dvh] w-full max-w-phone overflow-y-auto rounded-t-card border-0 bg-surface p-6 pb-safe shadow-none data-[state=open]:duration-600 data-[state=closed]:duration-350 ease-settle"
        data-testid="sheet-policy-builder"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="type-title font-heading text-ink">Describe {dependentName}'s rules</SheetTitle>
          <SheetDescription className="type-caption text-ink-muted">Say it the way you'd say it out loud.</SheetDescription>
        </SheetHeader>

        {phase === 'compose' && (
          <div className="mt-5 flex flex-col gap-4">
            <label className="flex flex-col gap-2">
              <span className="type-label text-ink-muted">Your rules</span>
              <textarea
                value={text}
                onChange={(e) => {
                  setTypingTarget(null);
                  setText(e.target.value);
                }}
                rows={4}
                placeholder="No bars, and ask me before anything over $75…"
                className="type-body-sm w-full resize-none rounded-input border border-hairline bg-surface-alt px-4 py-3 text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                data-testid="input-policy-text"
              />
            </label>
            <div>
              <p className="type-label mb-2 text-ink-muted">Try one</p>
              <ul className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setText('');
                        setTypingTarget(s.text);
                      }}
                      className={cn(
                        'h-9 rounded-pill px-4 text-[14px] font-semibold transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                        s.id === 'all' ? 'bg-primary text-on-primary hover:bg-primary-hover' : 'bg-tint text-primary hover:bg-primary/15',
                      )}
                      data-testid={`chip-rule-${s.id}`}
                    >
                      {s.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <PillButton block disabled={typing || text.trim() === ''} onClick={build} icon={<Sparkles className="size-5" aria-hidden="true" />} data-testid="button-build-rules">
              Build rules
            </PillButton>
          </div>
        )}

        {(phase === 'thinking' || phase === 'saving') && (
          <StepList steps={phase === 'thinking' ? thinkingSteps : savingSteps} current={step} testId={`list-${phase}-steps`} />
        )}

        {phase === 'review' && (
          <div className={cn('mt-5 rounded-card-sm bg-surface-alt p-5', motion.decisionIn)} data-testid="card-rules-review">
            <p className="type-label text-ink-muted">Here's what I understood</p>
            <ul className="mt-3 flex flex-col gap-3">
              {reviewLines.slice(0, revealed).map((l) => (
                <li key={`${l.kind}-${l.text}`} className={cn('flex items-start gap-3', motion.itemIn)} data-testid={`review-line-${l.kind}`}>
                  <PolicyLineIcon kind={l.kind} />
                  <div className="flex flex-col items-start gap-1 pt-1">
                    <p className="type-body-sm">{l.text}</p>
                    {applied.has(groupOfLine(l)!) && <Tag tone="neutral">Already on the card</Tag>}
                  </div>
                </li>
              ))}
            </ul>
            {allApplied && <p className="type-caption mt-3 text-ink-muted">These rules are already on {dependentName}'s card.</p>}
            <div className="mt-5 flex gap-2">
              <PillButton size="sm" variant="outline" className="flex-1" icon={<Pencil className="size-4" aria-hidden="true" />} onClick={() => setPhase('compose')} data-testid="button-edit-rules">
                Edit
              </PillButton>
              <PillButton size="sm" className="flex-1" icon={<Check className="size-4" aria-hidden="true" />} onClick={confirm} disabled={revealed < reviewLines.length} data-testid="button-confirm-rules">
                Looks right
              </PillButton>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

/** Timed stages: a spinner on the current one, a check on those done. */
function StepList({ steps, current, testId }: { steps: string[]; current: number; testId: string }) {
  return (
    <ol className="mt-5 flex flex-col gap-3 rounded-card-sm bg-surface-alt p-5" aria-live="polite" data-testid={testId}>
      {steps.slice(0, current + 1).map((s, i) => {
        const done = i < current;
        return (
          <li key={s} className={cn('flex items-center gap-3', motion.itemIn)} data-testid={done ? 'step-done' : 'step-active'}>
            <span className={cn('grid size-7 shrink-0 place-items-center rounded-full', done ? 'bg-approved-bg text-approved' : 'bg-tint text-primary')}>
              {done ? <Check className="size-4" strokeWidth={2.6} aria-hidden="true" /> : <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
            </span>
            <span className={cn('type-body-sm', done ? 'text-ink-muted' : 'text-ink')}>{s}</span>
          </li>
        );
      })}
    </ol>
  );
}
