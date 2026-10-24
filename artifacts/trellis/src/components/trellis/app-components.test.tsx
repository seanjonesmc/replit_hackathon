// @vitest-environment happy-dom
import { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { BRAND } from '@brand/brand.config';
import type { Decision } from '@/lib/domain';
import { ActivityRow } from './activity-row';
import { DecisionResultCard } from './decision-result-card';
import { ChoicePills, OnboardingStep } from './onboarding-step';
import { VirtualCard } from './virtual-card';

let root: Root | null = null;
let host: HTMLElement;

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  host?.remove();
});

function render(ui: React.ReactNode) {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(ui));
  return host;
}

const byTestId = (id: string) => host.querySelector<HTMLElement>(`[data-testid="${id}"]`);

describe('DecisionResultCard', () => {
  const props = {
    merchant: 'Sample Store',
    amountCents: 3200,
    reason: 'Plain-English reason.',
    reasonCode: 'sample_code',
    decidedAt: new Date(),
    chain: { state: 'preview' } as const,
  };

  it.each<[Decision, string, boolean]>([
    ['approved', 'Approved', false],
    ['rejected', 'Declined', true],
    ['pending', 'Pending', true],
  ])('%s shows its label, reason, code, time and preview chain status', (decision, label, asks) => {
    const onAskParent = vi.fn();
    render(<DecisionResultCard {...props} decision={decision} onAskParent={onAskParent} />);

    expect(byTestId('text-decision-label')?.textContent).toBe(label);
    expect(byTestId('text-decision-reason')?.textContent).toBe(props.reason);
    expect(byTestId('text-reason-code')?.textContent).toBe(props.reasonCode);
    expect(byTestId('text-decision-time')?.textContent).toMatch(/^Today at /);
    expect(byTestId('badge-preview')?.textContent).toContain('Preview, not on chain');
    expect(host.textContent).not.toContain(BRAND.copy.verifiedLabel);
    expect(host.querySelector('a')).toBeNull();

    const ask = byTestId('button-ask-parent');
    if (!asks) {
      expect(ask).toBeNull();
      return;
    }
    expect(ask?.textContent).toBe(BRAND.copy.askParentLabel);
    act(() => ask!.click());
    expect(onAskParent).toHaveBeenCalledTimes(1);
  });
});

describe('VirtualCard', () => {
  it('shows the app wordmark, holder and only the last four digits', () => {
    render(<VirtualCard holderName={BRAND.demo.dependent} last4={BRAND.demo.cardLast4} />);
    expect(byTestId('text-app-name')?.textContent).toContain(BRAND.appName);
    expect(host.textContent).toContain(BRAND.demo.dependent);
    expect(byTestId('text-card-last4')?.textContent).toBe(`•••• ${BRAND.demo.cardLast4}`);
  });
});

describe('ActivityRow', () => {
  it('signs money in and strikes through a declined amount', () => {
    render(
      <ul>
        <ActivityRow who="A" sentence="Money in" amountCents={5000} status="approved" when="Mon" data-testid="in" />
        <ActivityRow who="B" sentence="Declined" amountCents={-3200} status="rejected" when="Mon" data-testid="no" />
      </ul>,
    );
    expect(byTestId('in')?.textContent).toContain('+$50.00');
    expect(byTestId('no')?.querySelector('.line-through')?.textContent).toBe('-$32.00');
  });
});

describe('OnboardingStep', () => {
  function Sample({ onContinue }: { onContinue: () => void }) {
    const [value, setValue] = useState<string | null>(null);
    return (
      <OnboardingStep step={2} totalSteps={4} question="Pick one" onContinue={onContinue} continueDisabled={!value} onSkip={() => {}} onBack={() => {}}>
        <ChoicePills label="Pick one" value={value} onChange={setValue} options={[{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]} />
      </OnboardingStep>
    );
  }

  it('enables continue after a single tap on an answer', () => {
    const onContinue = vi.fn();
    render(<Sample onContinue={onContinue} />);
    const cont = byTestId('button-onboarding-continue') as HTMLButtonElement;

    expect(host.textContent).toContain('Step 2 of 4');
    expect(byTestId('button-onboarding-skip')?.textContent).toBe('Skip to demo');
    expect(cont.disabled).toBe(true);

    act(() => byTestId('choice-b')!.click());
    expect(byTestId('choice-b')?.getAttribute('aria-checked')).toBe('true');
    expect(byTestId('choice-a')?.getAttribute('aria-checked')).toBe('false');
    expect(cont.disabled).toBe(false);

    act(() => cont.click());
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
