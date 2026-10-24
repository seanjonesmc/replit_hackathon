import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { DecisionResultCard } from '@/components/trellis/decision-result-card';
import { ChoicePills, OnboardingStep } from '@/components/trellis/onboarding-step';
import { PillButton } from '@/components/trellis/primitives';
import type { Decision } from '@/lib/domain';
import { decisionSamples, demo } from '@/lib/preview-data';
import { PhoneFrame, PreviewSection, SampleLabel, usePreviewNotice } from './preview-kit';

const decisions: { value: Decision; label: string }[] = [
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Declined' },
  { value: 'pending', label: 'Pending' },
];

const cardUses = [
  { value: 'food', label: 'Food & groceries' },
  { value: 'school', label: 'School supplies' },
  { value: 'transit', label: 'Getting around' },
  { value: 'social', label: 'Going out' },
];

function OnboardingSample() {
  const [answer, setAnswer] = useState<string | null>(null);
  const [notify, notice] = usePreviewNotice();
  const question = `What will ${demo.dependent} use the card for most?`;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="type-label px-1 text-ink-muted">Onboarding step</h3>
      <p className="type-caption flex min-h-10 items-center px-1 text-ink-muted">Tap an answer to enable Continue.</p>
      <PhoneFrame label="Sample onboarding step">
          <OnboardingStep
            step={2}
            totalSteps={4}
            question={question}
            helper="Pick one. You can change it later."
            titleAs="h4"
            onBack={() => notify('Back')}
            onContinue={() => notify('Continue')}
            continueDisabled={!answer}
            onSkip={() => notify('Skip to demo')}
            footer={notice}
          >
            <ChoicePills label={question} options={cardUses} value={answer} onChange={setAnswer} />
          </OnboardingStep>
      </PhoneFrame>
    </div>
  );
}

function DecisionSample() {
  const [decision, setDecision] = useState<Decision>('rejected');
  const [replay, setReplay] = useState(0);
  const [notify, notice, clearNotice] = usePreviewNotice();
  const sample = decisionSamples[decision];

  const show = (d: Decision) => {
    setDecision(d);
    setReplay((r) => r + 1);
    clearNotice();
  };

  return (
    <div className="flex flex-col gap-3">
      <h3 className="type-label px-1 text-ink-muted">Decision result card</h3>
      <div className="flex min-h-10 flex-wrap items-center gap-2 px-1">
        <div role="group" aria-label="Decision variant" className="flex gap-1">
          {decisions.map((d) => (
            <PillButton
              key={d.value}
              size="sm"
              variant={d.value === decision ? 'primary' : 'outline'}
              aria-pressed={d.value === decision}
              onClick={() => show(d.value)}
              className="px-3"
              data-testid={`button-decision-${d.value}`}
            >
              {d.label}
            </PillButton>
          ))}
        </div>
        <PillButton
          variant="tint"
          size="sm"
          icon={<RotateCcw className="size-4" aria-hidden="true" />}
          onClick={() => show(decision)}
          className="px-3"
          data-testid="button-replay-decision"
        >
          Replay
        </PillButton>
      </div>
      <PhoneFrame label="Sample decision result">
        <DecisionResultCard
          key={`${decision}-${replay}`}
          decision={decision}
          merchant={sample.merchant.name}
          amountCents={sample.merchant.amount}
          bucket={sample.merchant.bucket}
          reason={sample.merchant.reason}
          reasonCode={sample.merchant.code}
          decidedAt={sample.decidedAt}
          chain={{ state: 'preview' }}
          titleAs="h4"
          onAskParent={() => notify(`${demo.parent} was not asked`)}
          onDone={() => notify('Done')}
          footer={notice}
        />
      </PhoneFrame>
    </div>
  );
}

/** Full-screen components shown at phone size. */
export function FlowsSection() {
  return (
    <PreviewSection id="flows" title="Onboarding & decisions" note={<SampleLabel />}>
      <div className="grid gap-8 lg:grid-cols-2">
        <OnboardingSample />
        <DecisionSample />
      </div>
    </PreviewSection>
  );
}
