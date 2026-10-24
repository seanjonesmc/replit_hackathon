import type { ChainRecord } from '@workspace/api-client-react';
import type { ChainStatus } from './domain';

/**
 * Maps a record's on-chain state from the API to what the badge shows. Only a
 * confirmed record with an explorer link reads as verified; a confirmed one
 * without a link is "sent". A failed write says so, and an unsent one is
 * "not on chain yet".
 */
export function chainStatusOf(chain: ChainRecord): ChainStatus {
  switch (chain.status) {
    case 'submitted':
      return { state: 'confirming' };
    case 'confirmed':
      return chain.explorerUrl ? { state: 'verified', href: chain.explorerUrl } : { state: 'sent' };
    case 'failed':
      return { state: 'failed' };
    default:
      return { state: 'offchain' };
  }
}

/** True while a record's chain write is still in flight, so screens keep polling. */
export const isChainInFlight = (chain: ChainRecord) => chain.status === 'submitted';
