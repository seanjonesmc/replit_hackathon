import { pool } from "@workspace/db";

/**
 * Empties every table, so a test starts from nothing. The `api-server-db`
 * project points the shared `db` at the test database (vitest.config.ts);
 * this still refuses to run on any database whose name doesn't end in
 * `_test`, so it can never wipe the development data.
 */
export async function resetTestDatabase(): Promise<void> {
  const client = await pool.connect();
  try {
    const { rows } = await client.query<{ name: string }>("SELECT current_database() AS name");
    const name = rows[0]?.name ?? "";
    if (!name.endsWith("_test")) {
      throw new Error(`Refusing to empty "${name}": it isn't the test database.`);
    }
    const tables = await client.query<{ tablename: string }>(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public'",
    );
    if (tables.rows.length === 0) return;
    const list = tables.rows.map((t) => `"${t.tablename.replace(/"/g, '""')}"`).join(", ");
    await client.query(`TRUNCATE ${list} RESTART IDENTITY CASCADE`);
  } finally {
    client.release();
  }
}
