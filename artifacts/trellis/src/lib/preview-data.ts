import { BRAND } from '@brand/brand.config';
import type { BucketIcon, Decision } from './domain';

export type { BucketIcon, Decision } from './domain';

/**
 * Illustrative sample data for the Phase 0 design preview.
 * Nothing here is real money, a real decision, or an on-chain record.
 * Person and bank names always come from BRAND.demo.
 */

export const demo = BRAND.demo;
export const grandparent = demo.funders[0] ?? 'Funder';
export const coParent = demo.funders[1] ?? demo.funders[0] ?? 'Funder';

export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).map((p) => p[0]).slice(-2).join('').toUpperCase();

export interface PreviewBucket {
  id: string;
  name: string;
  purpose: string;
  icon: BucketIcon;
  total: number;
  available: number;
  held: number;
  spentThisWeek: number;
  fundedBy: string;
}

export const buckets: PreviewBucket[] = [
  { id: 'food', name: 'Food', purpose: 'Groceries and meals out', icon: 'food', total: 15000, available: 9420, held: 0, spentThisWeek: 5580, fundedBy: grandparent },
  { id: 'school', name: 'School', purpose: 'Books and supplies', icon: 'school', total: 20000, available: 15200, held: 0, spentThisWeek: 4800, fundedBy: demo.parent },
  { id: 'social', name: 'Social', purpose: 'Movies, bowling, concerts', icon: 'social', total: 6000, available: 2850, held: 1200, spentThisWeek: 1950, fundedBy: coParent },
];

export const potTotal = buckets.reduce((s, b) => s + b.available + b.held, 0);

export interface ChainStep { label: string; status: Decision | 'settled' }

export interface PreviewActivity {
  id: string;
  who: string;
  sentence: string;
  amount: number;
  status: Decision;
  bucket: string;
  when: string;
  chainSteps?: ChainStep[];
}

export const activity: PreviewActivity[] = [
  { id: 'a1', who: demo.dependent, sentence: `${demo.dependent} spent $18.40 on groceries at Trader Joe's, paid from Food (${grandparent}'s contribution)`, amount: -1840, status: 'approved', bucket: 'Food', when: 'Today, 12:41' },
  { id: 'a2', who: demo.dependent, sentence: `${demo.dependent} tried The Tipsy Tavern. Bars are off-limits, so it was declined.`, amount: -3200, status: 'rejected', bucket: 'Social', when: 'Today, 11:05' },
  {
    id: 'a3', who: demo.dependent, sentence: `${demo.dependent} bought a lab kit at Campus Bookstore after ${demo.parent} said yes`, amount: -11480, status: 'approved', bucket: 'School', when: 'Yesterday',
    chainSteps: [
      { label: 'Pending', status: 'pending' },
      { label: `${demo.parent} approved`, status: 'approved' },
      { label: 'Approved', status: 'approved' },
      { label: 'Settled', status: 'settled' },
    ],
  },
  { id: 'a4', who: grandparent, sentence: `${grandparent} added $50.00 to Food`, amount: 5000, status: 'approved', bucket: 'Food', when: 'Mon' },
  { id: 'a5', who: demo.dependent, sentence: `${demo.dependent} is waiting on an OK for Apple Store`, amount: -12900, status: 'pending', bucket: 'School', when: 'Mon' },
];

export interface PreviewMerchant {
  id: string;
  name: string;
  category: string;
  mcc: string;
  amount: number;
  note?: string;
  outcome: Decision;
  code: string;
  reason: string;
  bucket: string;
}

export const merchants: PreviewMerchant[] = [
  { id: 'tj', name: "Trader Joe's", category: 'Grocery', mcc: '5411', amount: 1840, outcome: 'approved', code: 'within_bucket_limit', reason: 'Groceries come out of Food, and you have plenty left.', bucket: 'Food' },
  { id: 'book', name: 'Campus Bookstore', category: 'Bookstore', mcc: '5942', amount: 2400, outcome: 'approved', code: 'within_bucket_limit', reason: 'Books are covered by your School bucket.', bucket: 'School' },
  { id: 'tavern', name: 'The Tipsy Tavern', category: 'Bar', mcc: '5813', amount: 3200, outcome: 'rejected', code: 'blocked_category', reason: 'Bars are off-limits on this card.', bucket: 'Social' },
  { id: 'steam', name: 'Steam', category: 'Gaming', mcc: '5816', amount: 1499, outcome: 'rejected', code: 'blocked_category', reason: 'Gaming purchases are turned off for now.', bucket: 'Social' },
  { id: 'uber', name: 'Uber', category: 'Rideshare', mcc: '4121', amount: 2200, note: 'at 2:10am', outcome: 'pending', code: 'outside_hours', reason: `Late-night purchases need a quick OK from ${demo.parent}.`, bucket: 'Transit' },
  { id: 'apple', name: 'Apple Store', category: 'Electronics', mcc: '5732', amount: 12900, outcome: 'pending', code: 'needs_approval', reason: `Anything over $75 needs a quick OK from ${demo.parent}.`, bucket: 'School' },
];

/** Sample decisions for the decision result card, one per outcome. */
export interface PreviewDecision {
  merchant: PreviewMerchant;
  decidedAt: Date;
}

const minutesAgo = (n: number) => new Date(Date.now() - n * 60_000);

const sampleFor = (id: string) => {
  const m = merchants.find((x) => x.id === id);
  if (!m) throw new Error(`Unknown preview merchant: ${id}`);
  return m;
};

export const decisionSamples: Record<Decision, PreviewDecision> = {
  approved: { merchant: sampleFor('tj'), decidedAt: minutesAgo(2) },
  rejected: { merchant: sampleFor('tavern'), decidedAt: minutesAgo(38) },
  pending: { merchant: sampleFor('apple'), decidedAt: minutesAgo(5) },
};

export const policyLines = [
  { kind: 'block' as const, text: 'Bars, liquor stores and casinos are off-limits' },
  { kind: 'block' as const, text: 'No gaming purchases' },
  { kind: 'ask' as const, text: `Purchases over $75 need a quick OK from ${demo.parent}` },
  { kind: 'time' as const, text: 'Nothing between 11pm and 6am without an OK' },
  { kind: 'limit' as const, text: 'Food: $150 a week, up to $60 per purchase' },
];

export const blockedCategories = ['Bar', 'Liquor', 'Gambling', 'Nightclub', 'Gaming'];
