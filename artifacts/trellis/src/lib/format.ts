/** Formats integer cents as US dollars, e.g. 1840 -> "$18.40", -1840 -> "-$18.40". */
export const formatCents = (cents: number) =>
  (cents < 0 ? '-' : '') +
  '$' +
  (Math.abs(cents) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Like formatCents, but money in gets an explicit plus sign: 5000 -> "+$50.00". */
export const formatSignedCents = (cents: number) => (cents > 0 ? '+' : '') + formatCents(cents);

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/**
 * Short, friendly decision time: "Today at 12:41 PM", "Yesterday at 9:05 AM"
 * or "Oct 22 at 6:30 PM".
 */
export function formatDecisionTime(at: Date, now: Date = new Date()): string {
  const time = at.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (sameDay(at, now)) return `Today at ${time}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(at, yesterday)) return `Yesterday at ${time}`;
  const day = at.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${day} at ${time}`;
}

/** Measured decision time: 0.4 -> "under 1 ms", 3.27 -> "3.3 ms", 812.6 -> "813 ms", 1520 -> "1.5 s". */
export function formatDurationMs(ms: number): string {
  if (ms < 1) return 'under 1 ms';
  if (Math.round(ms * 10) < 100) return `${(Math.round(ms * 10) / 10).toFixed(1)} ms`;
  if (Math.round(ms) < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

/** Up to two initials from a display name: "Dana Rivera" -> "DR". */
export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).map((p) => p[0]).slice(-2).join('').toUpperCase();

/** Activity time from an ISO string: "Today, 2:41 PM", "Yesterday, 9:05 AM", or "Mon, Oct 19". */
export function formatWhen(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (sameDay(date, now)) return `Today, ${time}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(date, yesterday)) return `Yesterday, ${time}`;
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/** Card expiry as "10/29". */
export const formatExpiry = (month: number, year: number) =>
  `${String(month).padStart(2, '0')}/${String(year % 100).padStart(2, '0')}`;

/** Whole dollars drop their cents: 5000 -> "$50", 1250 -> "$12.50". */
export const formatCentsShort = (cents: number) =>
  cents % 100 === 0 ? (cents < 0 ? '-' : '') + '$' + Math.abs(cents / 100).toLocaleString('en-US') : formatCents(cents);

/** Cents as the matching USDC amount (1 USD = 1 USDC): 5000 -> "50 USDC", 1250 -> "12.50 USDC". */
export const formatUsdc = (cents: number) => formatCentsShort(cents).replace('$', '') + ' USDC';

/**
 * Parses a typed dollar amount into whole cents: "50" -> 5000, "$12.5" -> 1250.
 * Returns null for anything that isn't a positive amount with at most two decimals.
 */
export function parseDollarsToCents(input: string): number | null {
  const cleaned = input.trim().replace(/^\$/, '').replace(/,/g, '');
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null;
  const [whole = '0', frac = ''] = cleaned.split('.');
  const cents = Number(whole) * 100 + Number(frac.padEnd(2, '0'));
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}
