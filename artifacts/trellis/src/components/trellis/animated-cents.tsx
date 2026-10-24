import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { formatCents } from '@/lib/format';
import { DURATION, easeSettle } from './motion';

interface CountUpOptions {
  /** Start from this value on mount instead of showing `target` at once. */
  from?: number;
  /** Wait this long before counting (only for the count from `from`). */
  delayMs?: number;
  durationMs?: number;
}

/**
 * Counts a number up or down to `target` along `ease-settle` whenever it
 * changes (slow, 900ms by default). Shows `target` at once on mount unless
 * `from` is given, and always for reduced-motion users.
 */
export function useCountUp(target: number, { from, delayMs = 0, durationMs = DURATION.slow }: CountUpOptions = {}): number {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(() => (reduced || from === undefined ? target : from));
  const shownRef = useRef(shown);
  shownRef.current = shown;
  // The opening delay applies once, to the count from `from`.
  const pendingDelay = useRef(from === undefined ? 0 : delayMs);

  useEffect(() => {
    const delay = pendingDelay.current;
    const start = shownRef.current;
    if (reduced || start === target || typeof requestAnimationFrame !== 'function') {
      setShown(target);
      return;
    }
    let frame = 0;
    let began: number | null = null;
    const tick = (now: number) => {
      if (began === null) began = now + delay;
      const t = Math.min(1, Math.max(0, (now - began) / durationMs));
      if (t > 0) pendingDelay.current = 0;
      setShown(t >= 1 ? target : Math.round(start + (target - start) * easeSettle(t)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, reduced, durationMs]);

  return reduced ? target : shown;
}

/** A dollar amount that counts to its new value when it changes. */
export function AnimatedCents({ cents, ...options }: { cents: number } & CountUpOptions) {
  return <>{formatCents(useCountUp(cents, options))}</>;
}
