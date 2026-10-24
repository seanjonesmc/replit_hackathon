import { describe, expect, it } from 'vitest';
import type { ChainRecord } from '@workspace/api-client-react';
import { chainStatusOf, isChainInFlight } from './chain';

const record = (over: Partial<ChainRecord>): ChainRecord => ({
  status: 'not_submitted',
  txHash: null,
  confirmedAt: null,
  explorerUrl: null,
  ...over,
});

describe('chainStatusOf', () => {
  it('links to the explorer only for a confirmed record that has a link', () => {
    const href = 'https://explorer.example/tx/0xabc';
    expect(chainStatusOf(record({ status: 'confirmed', txHash: '0xabc', explorerUrl: href }))).toEqual({ state: 'verified', href });
    expect(chainStatusOf(record({ status: 'confirmed', txHash: '0xabc' }))).toEqual({ state: 'sent' });
  });

  it('never reads as on chain while in flight, failed or unsent', () => {
    expect(chainStatusOf(record({ status: 'submitted', txHash: '0xabc' }))).toEqual({ state: 'confirming' });
    expect(chainStatusOf(record({ status: 'failed', txHash: '0xabc' }))).toEqual({ state: 'failed' });
    expect(chainStatusOf(record({}))).toEqual({ state: 'offchain' });
  });

  it('keeps polling only while a write is in flight', () => {
    expect(isChainInFlight(record({ status: 'submitted' }))).toBe(true);
    expect(isChainInFlight(record({ status: 'confirmed' }))).toBe(false);
    expect(isChainInFlight(record({ status: 'not_submitted' }))).toBe(false);
  });
});
