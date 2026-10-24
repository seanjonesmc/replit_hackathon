// @vitest-environment happy-dom
import { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { BRAND } from '@brand/brand.config';
import type { Decision } from '@/lib/domain';
import { Store } from 'lucide-react';
import { ActivityRow } from './activity-row';
import { DecisionResultCard } from './decision-result-card';
import { MerchantTile } from './merchant-tile';
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

  it('shows who decided, the measured time and the swipe note when given', () => {
    render(
      <DecisionResultCard {...props} decision="pending" decidedBy="ai_guard" aiConfidence={0.64} decisionMs={812.6} swipeNote="swiped at 2:10am" />,
    );
    expect(byTestId('text-decided-by')?.textContent).toBe('AI guard · 64% sure');
    expect(byTestId('text-decision-ms')?.textContent).toBe('813 ms');
    expect(host.textContent).toContain('swiped at 2:10am');
  });

  it('hides the decided-by and time rows when unknown, never inventing a time', () => {
    render(<DecisionResultCard {...props} decision="approved" decidedBy="rule" />);
    expect(byTestId('text-decided-by')?.textContent).toBe('Rule');
    expect(byTestId('text-decision-ms')).toBeNull();
  });

  it('shows a sent request instead of Ask Parent while a parent decides', () => {
    render(<DecisionResultCard {...props} decision="pending" ask="sent" askedName="Sample Parent" />);
    expect(byTestId('button-ask-parent')).toBeNull();
    expect(byTestId('state-ask-sent')?.textContent).toBe(`${BRAND.copy.askParentLabel} · request sent to Sample Parent`);
  });

  it('can rename the decision and hide the ask step after a parent answered', () => {
    render(<DecisionResultCard {...props} decision="rejected" label="Parent declined" ask="hidden" />);
    expect(byTestId('text-decision-label')?.textContent).toBe('Parent declined');
    expect(byTestId('button-ask-parent')).toBeNull();
    expect(byTestId('state-ask-sent')).toBeNull();
  });

  it('keeps Ask Parent visible but disabled without a handler', () => {
    render(<DecisionResultCard {...props} decision="rejected" />);
    expect((byTestId('button-ask-parent') as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('MerchantTile', () => {
  it('shows the name, category with MCC, price and time, and swipes on tap', () => {
    const onSwipe = vi.fn();
    render(<MerchantTile name="Sample Ride" category="rideshare" mcc="4121" amountCents={2200} timeNote="at 2:10am" icon={Store} onSwipe={onSwipe} data-testid="tile" />);
    const tile = byTestId('tile') as HTMLButtonElement;
    expect(tile.textContent).toContain('Rideshare · MCC 4121');
    expect(tile.textContent).toContain('$22.00');
    expect(byTestId('text-merchant-time')?.textContent).toBe('at 2:10am');
    expect(tile.getAttribute('aria-label')).toBe('Swipe at Sample Ride for $22.00, at 2:10am');
    act(() => tile.click());
    expect(onSwipe).toHaveBeenCalledTimes(1);
  });

  it('ignores taps while its swipe is in flight but keeps focus', () => {
    const onSwipe = vi.fn();
    render(<MerchantTile name="Shop" category="grocery" mcc="5411" amountCents={100} icon={Store} loading onSwipe={onSwipe} data-testid="tile" />);
    const tile = byTestId('tile') as HTMLButtonElement;
    expect(tile.disabled).toBe(false);
    expect(tile.getAttribute('aria-busy')).toBe('true');
    act(() => tile.click());
    expect(onSwipe).not.toHaveBeenCalled();
  });

  it('is disabled when there is no purchase to send', () => {
    render(<MerchantTile name="Shop" category="grocery" mcc="5411" amountCents={null} icon={Store} data-testid="tile" />);
    expect((byTestId('tile') as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('VirtualCard', () => {
  it('prints a debit card face with only the last four digits', () => {
    render(<VirtualCard holderName="Sample Holder" last4="1234" expiryMonth={3} expiryYear={2031} data-testid="card" />);
    expect(byTestId('text-app-name')?.textContent).toContain(BRAND.appName);
    expect(byTestId('text-card-holder')?.textContent).toBe('Sample Holder');
    expect(byTestId('text-card-number')?.textContent).toBe('•••• •••• •••• 1234');
    expect(byTestId('text-card-last4')?.textContent).toBe('1234');
    expect(host.textContent?.replace(/\D/g, '')).toBe('1234' + '0331');
    expect(byTestId('text-card-expiry')?.textContent).toBe('03/31');
    expect(host.textContent).toContain('Valid thru 03/31');
    expect(byTestId('text-card-type')?.textContent).toBe('Debit');
    expect(byTestId('text-card-note')?.textContent).toBe('Simulated card');
    expect(byTestId('img-card-chip')).not.toBeNull();
    expect(byTestId('img-contactless')).not.toBeNull();
    expect(byTestId('card')?.className).toContain('card-face');
    expect(byTestId('card')?.className).not.toContain('bg-signature');
    expect(byTestId('card')?.getAttribute('aria-label')).toBe(
      'Simulated card for Sample Holder, debit card ending in 1234, valid thru 03/31',
    );
    expect(byTestId('state-card-frozen')).toBeNull();
  });

  it('marks a frozen card on the art and in its label', () => {
    render(<VirtualCard holderName="Sample" last4="0000" expiryMonth={12} expiryYear={2030} frozen data-testid="card" />);
    expect(byTestId('state-card-frozen')?.textContent).toBe('Frozen');
    expect(byTestId('card')?.getAttribute('aria-label')).toMatch(/, frozen$/);
    expect(byTestId('text-card-number')?.textContent).toBe('•••• •••• •••• 0000');
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
