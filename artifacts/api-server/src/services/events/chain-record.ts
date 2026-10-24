import type { ChainRecord } from "@workspace/api-zod";
import type { ChainStatus } from "@workspace/db";
import { chainTxUrl } from "../blockchain";

/**
 * A row's chain columns as the API's ChainRecord. The explorer link is set
 * only for a confirmed transaction, so nothing links to the explorer (or
 * reads as verified) unless it was really mined.
 */
export function toChainRecord(row: {
  chainStatus: ChainStatus;
  chainTxHash: string | null;
  chainConfirmedAt: Date | null;
}): ChainRecord {
  const confirmed = row.chainStatus === "confirmed" && row.chainTxHash !== null;
  return {
    status: row.chainStatus,
    txHash: row.chainTxHash,
    confirmedAt: row.chainConfirmedAt,
    explorerUrl: confirmed ? chainTxUrl(row.chainTxHash!) : null,
  };
}
