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
