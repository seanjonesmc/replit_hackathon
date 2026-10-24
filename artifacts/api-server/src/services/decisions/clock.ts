/**
 * Time helpers for the decision engine. Time windows are read on the family's
 * clock (an IANA time zone such as "America/Los_Angeles"), whatever offset the
 * swipe's timestamp was written in.
 */

export interface SwipeTime {
  /** The absolute moment of the swipe. */
  instant: Date;
  /** Minutes since midnight on the family's clock. */
  localMinutes: number;
  /** The same moment written in family-local time with its offset. */
  localIso: string;
}

interface ClockParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const ISO_TIMESTAMP =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,9})?)?(Z|[+-]\d{2}:\d{2})?$/i;

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

/** True for a time zone this runtime knows, e.g. "America/Los_Angeles". */
export function isValidTimeZone(timeZone: string): boolean {
  try {
    formatterFor(timeZone);
    return true;
  } catch {
    return false;
  }
}

/** The family-clock date and time of an instant. */
export function zonedParts(instant: Date, timeZone: string): ClockParts {
  const parts = formatterFor(timeZone).formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

/** The zone's offset from UTC, in minutes, at an instant. */
function offsetMinutes(instant: Date, timeZone: string): number {
  const p = zonedParts(instant, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  const wholeSeconds = Math.floor(instant.getTime() / 1000) * 1000;
  return Math.round((asUtc - wholeSeconds) / 60_000);
}

/** The instant a family-clock date and time happens. */
export function zonedTimeToInstant(parts: ClockParts, timeZone: string): Date {
  const guess = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  const first = offsetMinutes(new Date(guess), timeZone);
  const instant = guess - first * 60_000;
  // Near a daylight-saving change the offset can differ once corrected.
  const second = offsetMinutes(new Date(instant), timeZone);
  return new Date(second === first ? instant : guess - second * 60_000);
}

const pad = (n: number) => String(n).padStart(2, "0");

/** e.g. 2026-10-24T02:10:00-07:00, on the family's clock. */
export function toLocalIso(instant: Date, timeZone: string): string {
  const p = zonedParts(instant, timeZone);
  const offset = offsetMinutes(instant, timeZone);
  const sign = offset < 0 ? "-" : "+";
  const abs = Math.abs(offset);
  return (
    `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}` +
    `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
  );
}

/**
 * Reads a swipe timestamp (ISO 8601). With an offset ("Z" or ±HH:MM) it is an
 * exact moment; without one it is read as the family's local time. Returns
 * null when the text isn't a real date and time.
 */
export function parseSwipeTime(
  timestamp: string,
  timeZone: string,
): SwipeTime | null {
  const match = ISO_TIMESTAMP.exec(timestamp.trim());
  if (!match) return null;
  const [, y, mo, d, h, mi, s, offset] = match;
  const parts: ClockParts = {
    year: Number(y),
    month: Number(mo),
    day: Number(d),
    hour: Number(h),
    minute: Number(mi),
    second: Number(s ?? 0),
  };
  const calendar = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  if (
    calendar.getUTCMonth() !== parts.month - 1 ||
    calendar.getUTCDate() !== parts.day ||
    parts.hour > 23 ||
    parts.minute > 59 ||
    parts.second > 59
  ) {
    return null;
  }

  const instant = offset
    ? new Date(timestamp.trim())
    : zonedTimeToInstant(parts, timeZone);
  if (Number.isNaN(instant.getTime())) return null;

  const local = zonedParts(instant, timeZone);
  return {
    instant,
    localMinutes: local.hour * 60 + local.minute,
    localIso: toLocalIso(instant, timeZone),
  };
}

/** Minutes since midnight for "HH:MM". */
export function clockToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** "23:00" → "11pm", "06:30" → "6:30am". */
export function formatClock(hhmm: string): string {
  const minutes = clockToMinutes(hhmm);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h < 12 ? "am" : "pm";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12}${suffix}` : `${h12}:${pad(m)}${suffix}`;
}
