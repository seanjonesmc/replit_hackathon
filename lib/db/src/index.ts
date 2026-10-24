import { drizzle, type NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import type { PgDatabase } from "drizzle-orm/pg-core";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

/**
 * Either the shared `db` or a transaction opened from it. Services take one so
 * they can run on their own or inside a caller's transaction (as a savepoint).
 */
export type DbExecutor = PgDatabase<NodePgQueryResultHKT, typeof schema>;

export * from "./schema";
