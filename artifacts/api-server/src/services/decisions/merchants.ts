import { asc } from "drizzle-orm";
import {
  db,
  merchantsTable,
  type DbExecutor,
  type Merchant,
} from "@workspace/db";

/** The seeded merchants, in seed order, for the swipe grid. */
export async function listMerchants(
  executor: DbExecutor = db,
): Promise<Merchant[]> {
  return executor
    .select()
    .from(merchantsTable)
    .orderBy(asc(merchantsTable.id));
}
