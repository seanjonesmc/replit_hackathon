import type { CSSProperties } from 'react';

/**
 * Motion presets from DESIGN.md (Motion). Motion explains what just happened
 * on the demo screens: money moving, a decision landing, Monad confirming, a
 * request leaving the list. One easing curve (`ease-settle`, defined in
 * index.css), three durations (350 / 600 / 900ms), short distances, no
 * overshoot, nothing loops.
 * Apply an entry preset to an element on mount; remount it (change its `key`)
 * to replay. Reduced-motion users get the final state with no animation.
 * Motion never holds back a decision or a button: entries only fade content
 * in, they never block a tap.
 */
export const motion = {
  /** Decision result card: fades in and rises a few pixels (base, 600ms). */
  decisionIn: 'animate-in fade-in slide-in-from-bottom-1.5 duration-600 ease-settle motion-reduce:animate-none',
  /** Virtual card: rises and settles from 97% after "Accept card" (base, 600ms). */
  cardIn: 'animate-in fade-in zoom-in-97 slide-in-from-bottom-1.5 duration-600 ease-settle motion-reduce:animate-none',
  /** A rule line arriving on the policy card after the builder confirms (base, 600ms). */
  ruleIn: 'animate-in fade-in slide-in-from-bottom-1.5 duration-600 ease-settle motion-reduce:animate-none',
  /** Small items (chips, builder steps, review lines) arriving one by one (quick, 350ms). */
  itemIn: 'animate-in fade-in zoom-in-97 slide-in-from-bottom-1 duration-350 ease-settle motion-reduce:animate-none',
  /**
   * A block in a sequence (sign-in cards, money-sent steps, settlement steps):
   * fades in and rises (base, 600ms). Pair with `stagger(i)`; the backwards
   * fill keeps it hidden until its turn.
   */
  riseIn: 'animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards duration-600 ease-settle motion-reduce:animate-none',
  /** A small line in a sequence (decision badge, step-trace lines), with `stagger(i)` (quick, 350ms). */
  lineIn: 'animate-in fade-in slide-in-from-bottom-1 fill-mode-backwards duration-350 ease-settle motion-reduce:animate-none',
  /** Content that changed in place (a pending result answered, an empty state): fades in, no rise (quick, 350ms). */
  fadeIn: 'animate-in fade-in fill-mode-backwards duration-350 ease-settle motion-reduce:animate-none',
  /** A chain badge reaching its new state (slow, 900ms). */
  chainIn: 'animate-in fade-in duration-900 ease-settle motion-reduce:animate-none',
  /** A tappable tile pressing down slightly (quick, 350ms; the curve front-loads it). */
  press:
    'transition-[background-color,transform,opacity] duration-350 ease-settle active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100',
  /** A surface whose color changes with its state, e.g. a result header going from pending to approved (base, 600ms). */
  colorShift: 'transition-colors duration-600 ease-settle motion-reduce:transition-none',
  /** An overlay fading in and out with its state, e.g. the frozen card (quick, 350ms). */
  overlay: 'transition-[opacity,visibility] duration-350 ease-settle motion-reduce:transition-none',
  /** A progress bar changing width as money moves (slow, 900ms). */
  barWidth: 'transition-[width] duration-900 ease-settle motion-reduce:transition-none',
  /** A row collapsing away as money settles (base, 600ms). */
  collapse: 'grid transition-[grid-template-rows,opacity] duration-600 ease-settle motion-reduce:transition-none',
} as const;

/** The three durations, in ms, for motion driven from script (count-ups, exits). */
export const DURATION = { quick: 350, base: 600, slow: 900 } as const;

/** The `ease-settle` curve as cubic-bezier control points, for script-driven motion. */
export const EASE_SETTLE = [0.2, 0.8, 0.2, 1] as const;

/** Gap between items in a staggered sequence. Short, so nothing waits long. */
export const STAGGER_MS = 90;

/** Delays the `i`th item of a sequence (use with `riseIn`, `lineIn` or `fadeIn`). */
export function stagger(i: number, offsetMs = 0, stepMs = STAGGER_MS): CSSProperties {
  return { animationDelay: `${offsetMs + i * stepMs}ms` };
}

/** Evaluates a CSS cubic-bezier(x1, y1, x2, y2) easing at progress `t` (0–1). */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  const sample = (a: number, b: number, s: number) => 3 * a * (1 - s) ** 2 * s + 3 * b * (1 - s) * s ** 2 + s ** 3;
  return (t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    // Find the curve parameter whose x is t (bisection: x rises monotonically).
    let lo = 0;
    let hi = 1;
    let s = t;
    for (let i = 0; i < 24; i++) {
      s = (lo + hi) / 2;
      if (sample(x1, x2, s) < t) lo = s;
      else hi = s;
    }
    return sample(y1, y2, s);
  };
}

/** `ease-settle` as a function, for script-driven motion. */
export const easeSettle = cubicBezier(...EASE_SETTLE);
