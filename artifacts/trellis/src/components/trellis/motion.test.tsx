// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Decision } from '@/lib/domain';
import { AnimatedCents } from './animated-cents';
import { BucketCard } from './bucket-card';
import { DecisionResultCard } from './decision-result-card';
import { DURATION, easeSettle, motion, stagger } from './motion';
import { ChainBadge } from './primitives';
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
  vi.restoreAllMocks();
});

function render(ui: React.ReactNode) {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(ui));
  return host;
}
const rerender = (ui: React.ReactNode) => act(() => root!.render(ui));
const byTestId = (id: string) => host.querySelector<HTMLElement>(`[data-testid="${id}"]`);
const wait = (ms: number) => act(async () => new Promise((resolve) => setTimeout(resolve, ms)));

/** Makes the browser report the user's reduced-motion setting. */
function prefersReducedMotion(reduce: boolean) {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) =>
      ({
        matches: reduce && query.includes('prefers-reduced-motion: reduce'),
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList,
  );
}

describe('motion presets', () => {
  it('use only the one curve and the three durations', () => {
    for (const preset of Object.values(motion)) {
      expect(preset).toContain('ease-settle');
      const durations = [...preset.matchAll(/duration-(\d+)/g)].map((m) => Number(m[1]));
      expect(durations.length).toBeGreaterThan(0);
      for (const d of durations) expect([350, 600, 900]).toContain(d);
      expect(preset).not.toMatch(/repeat-infinite|animate-(spin|pulse|bounce|ping)/);
    }
  });

  it('switch off for reduced-motion users: entries show the final state, transitions jump', () => {
    for (const [name, preset] of Object.entries(motion)) {
      if (preset.includes('animate-in')) expect(preset, name).toContain('motion-reduce:animate-none');
      if (preset.includes('transition-')) expect(preset, name).toContain('motion-reduce:transition-none');
    }
    expect(motion.press).toContain('motion-reduce:active:scale-100');
  });

  it('staggers items with a short delay each', () => {
    expect(stagger(0)).toEqual({ animationDelay: '0ms' });
    expect(stagger(2, 100)).toEqual({ animationDelay: '280ms' });
  });

  it('eases along ease-settle: fast start, no overshoot', () => {
    expect(easeSettle(0)).toBe(0);
    expect(easeSettle(1)).toBe(1);
    expect(easeSettle(0.25)).toBeGreaterThan(0.5);
    for (let t = 0; t <= 1; t += 0.05) expect(easeSettle(t)).toBeLessThanOrEqual(1);
  });
});

describe('balances counting to a new value', () => {
  it('count over the slow duration when motion is allowed', async () => {
    prefersReducedMotion(false);
    render(<AnimatedCents cents={50_00} />);
    expect(host.textContent).toBe('$50.00');

    rerender(<AnimatedCents cents={100_00} />);
    await wait(50);
    const midway = Number(host.textContent!.replace(/[$,]/g, ''));
    expect(midway).toBeGreaterThanOrEqual(50);
    expect(midway).toBeLessThan(100);

    await wait(DURATION.slow + 100);
    expect(host.textContent).toBe('$100.00');
  });

  it('show the new value at once with reduced motion', () => {
    prefersReducedMotion(true);
    render(<AnimatedCents cents={50_00} from={0} />);
    expect(host.textContent).toBe('$50.00');
    rerender(<AnimatedCents cents={12_50} />);
    expect(host.textContent).toBe('$12.50');
  });

  it('can count up from an old balance on mount (money just arrived)', async () => {
    prefersReducedMotion(false);
    render(<AnimatedCents cents={80_00} from={30_00} />);
    expect(host.textContent).toBe('$30.00');
    await wait(DURATION.slow + 100);
    expect(host.textContent).toBe('$80.00');
  });
});

describe('demo-screen state changes', () => {
  it('fades a chain badge to its new state only when it changes', () => {
    render(<ChainBadge status={{ state: 'confirming' }} animateChange />);
    expect(byTestId('badge-chain-changed')).toBeNull();
    rerender(<ChainBadge status={{ state: 'verified', href: 'https://example.test/tx' }} animateChange />);
    const changed = byTestId('badge-chain-changed');
    expect(changed?.className).toContain('motion-reduce:animate-none');
    expect(changed?.querySelector('[data-testid="link-verified"]')).not.toBeNull();
  });

  it('leaves chain badges still unless asked', () => {
    render(<ChainBadge status={{ state: 'confirming' }} />);
    rerender(<ChainBadge status={{ state: 'sent' }} />);
    expect(byTestId('badge-chain-changed')).toBeNull();
  });

  it("keeps a decision result in place when it changes, fading in the new badge and details", () => {
    const card = (decision: Decision, label?: string) => (
      <DecisionResultCard
        decision={decision}
        label={label}
        merchant="Sample Store"
        amountCents={22_00}
        reason="Sample reason."
        reasonCode="sample"
        decidedAt={new Date('2026-01-01T12:00:00Z')}
        chain={{ state: 'offchain' }}
        trace={[
          { label: 'Asked', state: 'done' },
          { label: 'Checked', state: 'done' },
        ]}
      />
    );
    render(card('pending'));
    const section = host.querySelector('section')!;
    const lines = [...byTestId('list-decision-trace')!.querySelectorAll('li')];
    expect(lines.map((li) => li.style.animationDelay)).toEqual(['200ms', '290ms']);
    expect(lines[0]!.className).toContain('motion-reduce:animate-none');

    rerender(card('rejected', 'Parent declined'));
    // Same card element, not a fresh screen.
    expect(host.querySelector('section')).toBe(section);
    expect(byTestId('text-decision-label')?.textContent).toBe('Parent declined');
    expect(byTestId('text-decision-label')?.className).toContain('animate-in');
    expect(byTestId('text-decision-reason')?.parentElement?.parentElement?.className).toContain('fade-in');
  });

  it('hides the frozen overlay without removing it, so it can fade out', () => {
    const card = (frozen: boolean) => <VirtualCard holderName="Sample" last4="0000" expiryMonth={1} expiryYear={2030} frozen={frozen} />;
    render(card(true));
    const overlay = byTestId('state-card-frozen')!;
    expect(overlay.className).toContain('opacity-100');
    rerender(card(false));
    expect(byTestId('state-card-frozen')).toBeNull();
    expect(overlay.className).toContain('opacity-0');
    expect(overlay.getAttribute('aria-hidden')).toBe('true');
  });

  it('collapses the held line once a bucket settles, and eases the bar', () => {
    const bucket = (heldCents: number) => (
      <BucketCard name="Food" availableCents={40_00} totalCents={100_00} heldCents={heldCents} data-testid="bucket" />
    );
    render(bucket(18_40));
    expect(byTestId('bucket-held')?.textContent).toContain('Held $18.40');
    expect(host.querySelector('[role="img"] > div')?.className).toContain('transition-[width]');
    rerender(bucket(0));
    expect(byTestId('bucket-held')).toBeNull();
    expect(host.textContent).toContain('Held $18.40');
    expect(host.querySelector('[aria-hidden="true"].grid-rows-\\[0fr\\]')).not.toBeNull();
  });
});
