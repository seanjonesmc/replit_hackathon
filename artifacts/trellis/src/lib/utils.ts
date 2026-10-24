import { extendTailwindMerge } from 'tailwind-merge';
import { BRAND } from '@brand/brand.config';

import { clsx, type ClassValue } from 'clsx';

const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());

// Teach tailwind-merge the brand radius names (rounded-pill, rounded-card, ...)
// so a later rounded-* class overrides an earlier one instead of both applying.
const twMerge = extendTailwindMerge({
  extend: { theme: { radius: Object.keys(BRAND.radius).map(kebab) } },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
