import { and, eq, ne, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
  authorizationsTable,
  bankAccountsTable,
  bankDepositsTable,
  bucketsTable,
  chainEventsTable,
  contributionsTable,
  db,
  type ChainStatus,
  type DbExecutor,
} from "@workspace/db";

/**
 * Tables whose rows are mirrored on chain and carry the shared chain columns.
 * Later slices add their tables here (and to `updateOwnerChainStatus`).
 * `authorization_captures` is not a table of its own: it is an authorization
 * row's second set of chain columns (`capture_chain_*`), for its capture.
 */
export const CHAIN_OWNER_TABLES = [
  "authorizations",
  "authorization_captures",
  "bank_accounts",
  "bank_deposits",
  "buckets",
  "contributions",
] as const;
export type ChainOwnerTable = (typeof CHAIN_OWNER_TABLES)[number];

export interface DecodedChainEvent {
  eventName: string;
  contractAddress: string;
  logIndex: number;
  /** Decoded arguments. Bigints are stored as decimal strings. */
  args: Record<string, unknown>;
  /** The Postgres row this event mirrors, if any. */
  owner?: { table: ChainOwnerTable; id: number } | null;
}

export interface ReceiptEvents {
  txHash: string;
  blockNumber: number | bigint;
  /** When the block was confirmed (block timestamp). */
  confirmedAt: Date;
  events: DecodedChainEvent[];
  /**
   * The row the whole transaction mirrors. Marked confirmed even when the
   * receipt decoded no events.
   */
  owner?: { table: ChainOwnerTable; id: number } | null;
}

const TX_HASH = /^0x[0-9a-fA-F]{64}$/;
const ADDRESS = /^0x[0-9a-fA-F]{40}$/;

/** Converts decoded event values into JSON that Postgres jsonb can store. */
export function toJsonSafe(value: unknown): unknown {
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(toJsonSafe);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, toJsonSafe(v)]),
    );
  }
  if (typeof value === "function" || typeof value === "symbol") {
    throw new Error(`Cannot store a ${typeof value} in chain event args.`);
  }
  return value;
}

export interface OwnerChainUpdate {
  chainStatus: ChainStatus;
  chainTxHash?: string | null;
  chainConfirmedAt?: Date | null;
}

function ownerWhere(
  table: { id: AnyPgColumn; chainStatus: AnyPgColumn },
  id: number,
  keepConfirmed: boolean,
): SQL | undefined {
  return keepConfirmed
    ? and(eq(table.id, id), ne(table.chainStatus, "confirmed"))
    : eq(table.id, id);
}

/**
 * Sets the chain columns of the row a transaction mirrors and returns how
 * many rows changed. With `keepConfirmed`, a row already confirmed is left
 * alone, so a late failure or retry can never un-verify it.
 */
export async function updateOwnerChainStatus(
  executor: DbExecutor,
  owner: { table: ChainOwnerTable; id: number },
  set: OwnerChainUpdate,
  options: { keepConfirmed?: boolean } = {},
): Promise<number> {
  const keep = options.keepConfirmed ?? false;
  switch (owner.table) {
    case "authorizations":
      return (
        await executor
          .update(authorizationsTable)
          .set(set)
          .where(ownerWhere(authorizationsTable, owner.id, keep))
          .returning({ id: authorizationsTable.id })
      ).length;
    case "authorization_captures":
      return (
        await executor
          .update(authorizationsTable)
          .set({
            captureChainStatus: set.chainStatus,
            ...(set.chainTxHash !== undefined && { captureChainTxHash: set.chainTxHash }),
            ...(set.chainConfirmedAt !== undefined && {
              captureChainConfirmedAt: set.chainConfirmedAt,
            }),
          })
          .where(
            keep
              ? and(
                  eq(authorizationsTable.id, owner.id),
                  ne(authorizationsTable.captureChainStatus, "confirmed"),
                )
              : eq(authorizationsTable.id, owner.id),
          )
          .returning({ id: authorizationsTable.id })
      ).length;
    case "bank_accounts":
      return (
        await executor
          .update(bankAccountsTable)
          .set(set)
          .where(ownerWhere(bankAccountsTable, owner.id, keep))
          .returning({ id: bankAccountsTable.id })
      ).length;
    case "bank_deposits":
      return (
        await executor
          .update(bankDepositsTable)
          .set(set)
          .where(ownerWhere(bankDepositsTable, owner.id, keep))
          .returning({ id: bankDepositsTable.id })
      ).length;
    case "buckets":
      return (
        await executor
          .update(bucketsTable)
          .set(set)
          .where(ownerWhere(bucketsTable, owner.id, keep))
          .returning({ id: bucketsTable.id })
      ).length;
    case "contributions":
      return (
        await executor
          .update(contributionsTable)
          .set(set)
          .where(ownerWhere(contributionsTable, owner.id, keep))
          .returning({ id: contributionsTable.id })
      ).length;
    default: {
      const unknownTable: never = owner.table;
      throw new Error(`Unknown chain owner table: ${String(unknownTable)}`);
    }
  }
}

/**
 * Stores the decoded events from one confirmed transaction receipt and marks
 * each owning row `confirmed` with the transaction hash, in one transaction.
 *
 * Re-indexing the same receipt is safe: `(tx_hash, log_index)` is unique, so
 * existing events are skipped. An owner that doesn't exist rolls the whole
 * batch back. Called by `submitInBackground` once a write is mined.
 */
export async function recordReceiptEvents(
  receipt: ReceiptEvents,
  executor: DbExecutor = db,
): Promise<{ inserted: number; ownersConfirmed: number }> {
  if (!TX_HASH.test(receipt.txHash)) {
    throw new Error(`Invalid transaction hash: ${receipt.txHash}`);
  }
  const blockNumber = Number(receipt.blockNumber);
  if (!Number.isSafeInteger(blockNumber) || blockNumber < 0) {
    throw new Error(`Invalid block number: ${String(receipt.blockNumber)}`);
  }
  const txHash = receipt.txHash.toLowerCase();

  const owners = new Map<string, { table: ChainOwnerTable; id: number }>();
  if (receipt.owner) {
    if (!CHAIN_OWNER_TABLES.includes(receipt.owner.table)) {
      throw new Error(`Unknown chain owner table: ${receipt.owner.table}`);
    }
    owners.set(`${receipt.owner.table}:${receipt.owner.id}`, receipt.owner);
  }
  const rows = receipt.events.map((event) => {
    if (!ADDRESS.test(event.contractAddress)) {
      throw new Error(`Invalid contract address: ${event.contractAddress}`);
    }
    if (!Number.isInteger(event.logIndex) || event.logIndex < 0) {
      throw new Error(`Invalid log index: ${event.logIndex}`);
    }
    if (event.owner) {
      if (!CHAIN_OWNER_TABLES.includes(event.owner.table)) {
        throw new Error(`Unknown chain owner table: ${event.owner.table}`);
      }
      owners.set(`${event.owner.table}:${event.owner.id}`, event.owner);
    }
    return {
      eventName: event.eventName,
      contractAddress: event.contractAddress.toLowerCase(),
      txHash,
      blockNumber,
      logIndex: event.logIndex,
      args: toJsonSafe(event.args) as Record<string, unknown>,
      ownerTable: event.owner?.table ?? null,
      ownerId: event.owner?.id ?? null,
    };
  });

  return executor.transaction(async (tx) => {
    const inserted =
      rows.length === 0
        ? []
        : await tx
            .insert(chainEventsTable)
            .values(rows)
            .onConflictDoNothing({
              target: [chainEventsTable.txHash, chainEventsTable.logIndex],
            })
            .returning({ id: chainEventsTable.id });

    for (const owner of owners.values()) {
      const updated = await updateOwnerChainStatus(tx, owner, {
        chainStatus: "confirmed",
        chainTxHash: txHash,
        chainConfirmedAt: receipt.confirmedAt,
      });
      if (updated === 0) {
        throw new Error(
          `Chain event owner ${owner.table} #${owner.id} does not exist.`,
        );
      }
    }

    return { inserted: inserted.length, ownersConfirmed: owners.size };
  });
}
