import type { Card, Merchant, SwipeRequest } from '@workspace/api-client-react';

/**
 * What the swipe simulator sends for each seeded merchant. The server decides
 * every swipe; nothing here predicts or fakes a result.
 *
 * The first six are the product spec's demo swipes, in the spec's order. The
 * rest give the other seeded merchants a realistic purchase. Matched to the
 * API's merchants by name, which the seed keeps unique.
 */
export interface SwipePreset {
  merchantName: string;
  amountCents: number;
  items: string[];
  location: string;
  /**
   * Family-clock time ("HH:MM") the swipe is simulated at, e.g. "02:10" for
   * the late-night ride. Without it the swipe happens now.
   */
  clock?: string;
  /** One of the spec's six demo swipes. */
  spec: boolean;
}

export const SWIPE_PRESETS: readonly SwipePreset[] = [
  { merchantName: "Trader Joe's", amountCents: 18_40, items: ['bananas', 'oat milk', 'pasta'], location: 'Westwood, Los Angeles', spec: true },
  { merchantName: 'Campus Bookstore', amountCents: 24_00, items: ['lab notebook', 'graph paper'], location: 'On campus', spec: true },
  { merchantName: 'The Tipsy Tavern', amountCents: 32_00, items: ['burger', 'fries'], location: 'Westwood, Los Angeles', spec: true },
  { merchantName: 'Steam', amountCents: 14_99, items: ['indie game'], location: 'Online', spec: true },
  { merchantName: 'Uber', amountCents: 22_00, items: ['ride home'], location: 'Westwood, Los Angeles', clock: '02:10', spec: true },
  { merchantName: 'Apple Store', amountCents: 129_00, items: ['wireless earbuds'], location: 'Century City, Los Angeles', spec: true },
  { merchantName: 'AMC', amountCents: 16_50, items: ['movie ticket'], location: 'Century City, Los Angeles', spec: false },
  { merchantName: 'Liquor Barn', amountCents: 21_50, items: ['bottle of wine'], location: 'Westwood, Los Angeles', spec: false },
  { merchantName: 'Lucky Star Casino', amountCents: 50_00, items: ['casino chips'], location: 'Downtown Los Angeles', spec: false },
];

const presetByName = new Map(SWIPE_PRESETS.map((p, i) => [p.merchantName, { preset: p, order: i }]));

export interface MerchantSwipe {
  merchant: Merchant;
  /** Null for a merchant the simulator has no purchase for. */
  preset: SwipePreset | null;
}

/** The merchants in grid order: the spec's six first, then the rest, then any without a preset. */
export function arrangeMerchants(merchants: readonly Merchant[]): MerchantSwipe[] {
  const order = (m: Merchant) => presetByName.get(m.name)?.order ?? Number.MAX_SAFE_INTEGER;
  return merchants
    .map((merchant, seedIndex) => ({ merchant, seedIndex }))
    .sort((a, b) => order(a.merchant) - order(b.merchant) || a.seedIndex - b.seedIndex)
    .map(({ merchant }) => ({ merchant, preset: presetByName.get(merchant.name)?.preset ?? null }));
}

/** "02:10" -> "2:10am", "14:00" -> "2pm". */
export function formatClock(hhmm: string): string {
  const [h = 0, m = 0] = hhmm.split(':').map(Number);
  const suffix = h < 12 ? 'am' : 'pm';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12}${suffix}` : `${h12}:${String(m).padStart(2, '0')}${suffix}`;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Today's date and the minutes since midnight on the family's clock. */
function familyNow(now: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get('year'), month: get('month'), day: get('day'), minutes: get('hour') * 60 + get('minute') };
}

/**
 * The most recent moment the family's clock read `hhmm`, as a family-local
 * timestamp without an offset (the API reads it on the family's clock).
 * Always in the past or now, so the swipe never lands in the future.
 */
export function lastFamilyClockTime(hhmm: string, now: Date, timeZone: string): string {
  const [h = 0, m = 0] = hhmm.split(':').map(Number);
  const today = familyNow(now, timeZone);
  const daysBack = today.minutes >= h * 60 + m ? 0 : 1;
  const date = new Date(Date.UTC(today.year, today.month - 1, today.day - daysBack));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(h)}:${pad(m)}:00`;
}

/** The API payload for swiping the card at a seeded merchant. */
export function buildSwipeRequest({
  card,
  merchant,
  preset,
  now,
  timeZone,
}: {
  card: Pick<Card, 'id' | 'dependentId'>;
  merchant: Merchant;
  preset: SwipePreset;
  now: Date;
  /** The family's IANA time zone, for presets with a clock time. */
  timeZone: string;
}): SwipeRequest {
  return {
    cardId: card.id,
    dependentId: card.dependentId,
    merchantId: merchant.id,
    merchantName: merchant.name,
    mcc: merchant.mcc,
    merchantCategory: merchant.category,
    items: preset.items,
    amount: preset.amountCents,
    location: preset.location,
    timestamp: preset.clock ? lastFamilyClockTime(preset.clock, now, timeZone) : now.toISOString(),
  };
}

// ---- Custom purchases --------------------------------------------------------

/** A category the presenter can pick for a custom purchase, with its MCC. */
export interface PurchaseCategory {
  category: string;
  label: string;
  mcc: string;
}

/**
 * Categories for a custom purchase at a typed store. The server's rules decide
 * what each one may buy; categories without a bucket go to the AI guard.
 */
export const PURCHASE_CATEGORIES: readonly PurchaseCategory[] = [
  { category: 'grocery', label: 'Grocery', mcc: '5411' },
  { category: 'restaurant', label: 'Restaurant', mcc: '5812' },
  { category: 'bookstore', label: 'Bookstore', mcc: '5942' },
  { category: 'school supplies', label: 'School supplies', mcc: '5943' },
  { category: 'electronics', label: 'Electronics', mcc: '5732' },
  { category: 'movies', label: 'Movies', mcc: '7832' },
  { category: 'concerts', label: 'Concerts', mcc: '7922' },
  { category: 'bowling', label: 'Bowling', mcc: '7933' },
  { category: 'rideshare', label: 'Rideshare', mcc: '4121' },
  { category: 'transit', label: 'Transit', mcc: '4111' },
  { category: 'clothing', label: 'Clothing', mcc: '5651' },
  { category: 'bar', label: 'Bar', mcc: '5813' },
  { category: 'liquor', label: 'Liquor store', mcc: '5921' },
  { category: 'gambling', label: 'Gambling', mcc: '7995' },
  { category: 'gaming', label: 'Gaming', mcc: '5816' },
  { category: 'other', label: 'Other', mcc: '5999' },
];

/** What the presenter filled in on the custom purchase sheet. */
export interface CustomPurchase {
  /** The store's name as typed or picked. */
  storeName: string;
  /** Used when the name isn't a seeded store. */
  category: PurchaseCategory;
  items: string[];
  amountCents: number;
  /** Family-clock time ("HH:MM"); without it the swipe happens now. */
  clock?: string;
}

/** A seeded merchant whose name matches, ignoring case and outer spaces. */
export function findMerchantByName(merchants: readonly Merchant[], name: string): Merchant | undefined {
  const wanted = name.trim().toLowerCase();
  return wanted ? merchants.find((m) => m.name.toLowerCase() === wanted) : undefined;
}

/** "bananas, oat milk ,, pasta" -> ["bananas", "oat milk", "pasta"], capped at the API's limits. */
export function parseItems(text: string): string[] {
  return text
    .split(/[,\n]/)
    .map((s) => s.trim().slice(0, 80))
    .filter(Boolean)
    .slice(0, 20);
}

/**
 * The API payload for a custom purchase. A seeded store (picked, or typed
 * with the same name) swipes as that merchant, so the server uses its stored
 * category and MCC; any other name is a custom swipe with the chosen category.
 */
export function buildCustomSwipeRequest({
  card,
  merchants,
  purchase,
  now,
  timeZone,
}: {
  card: Pick<Card, 'id' | 'dependentId'>;
  merchants: readonly Merchant[];
  purchase: CustomPurchase;
  now: Date;
  timeZone: string;
}): SwipeRequest {
  const seeded = findMerchantByName(merchants, purchase.storeName);
  return {
    cardId: card.id,
    dependentId: card.dependentId,
    merchantId: seeded?.id ?? null,
    merchantName: seeded?.name ?? purchase.storeName.trim().slice(0, 120),
    mcc: seeded?.mcc ?? purchase.category.mcc,
    merchantCategory: seeded?.category ?? purchase.category.category,
    items: purchase.items,
    amount: purchase.amountCents,
    location: 'Los Angeles',
    timestamp: purchase.clock ? lastFamilyClockTime(purchase.clock, now, timeZone) : now.toISOString(),
  };
}
