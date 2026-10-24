/**
 * Motion presets from DESIGN.md (Motion). Motion only happens when money
 * moves, a decision lands, or Monad confirms. One easing curve (`ease-settle`,
 * defined in index.css), three durations (350 / 600 / 900ms), short distances,
 * no overshoot, nothing loops.
 * Apply to an element on mount; remount it (change its `key`) to replay.
 * Reduced-motion users get the final state with no animation.
 */
export const motion = {
  /** Decision result card: fades in and rises a few pixels (base, 600ms). */
  decisionIn: 'animate-in fade-in slide-in-from-bottom-1.5 duration-600 ease-settle motion-reduce:animate-none',
  /** Virtual card: rises and settles from 97% after "Accept card" (base, 600ms). */
  cardIn: 'animate-in fade-in zoom-in-97 slide-in-from-bottom-1.5 duration-600 ease-settle motion-reduce:animate-none',
} as const;
