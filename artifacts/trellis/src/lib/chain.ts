import type { ChainRecord } from '@workspace/api-client-react';
import type { ChainStatus } from './domain';

/**
 * Maps a record's on-chain state from the API to what the badge shows.
 * There is no explorer link yet, so a confirmed record is "sent", never
 * "verified"; a failed or unsent one is "not on chain yet".
 */
export function chainStatusOf(chain: ChainRecord): ChainStatus {
  switch (chain.status) {
    case 'submitted':
      return { state: 'confirming' };
    case 'confirmed':
      return { state: 'sent' };
    default:
      return { state: 'offchain' };
  }
}
