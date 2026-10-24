/**
 * Motion presets from DESIGN.md (App layer -> Motion): 150–250ms, ease-out.
 * Apply to an element on mount; remount it (change its `key`) to replay.
 * Reduced-motion users get the final state with no animation.
 */
export const motion = {
  /** Decision result card: scales in from 0.95. */
  decisionIn: 'animate-in fade-in zoom-in-95 duration-200 ease-out motion-reduce:animate-none',
  /** Virtual card: rises and scales in after "Accept card". */
  cardIn: 'animate-in fade-in zoom-in-95 slide-in-from-bottom-6 duration-250 ease-out motion-reduce:animate-none',
} as const;
