import { pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

/** The single demo family. Its name comes from BRAND.demo at seed time. */
export const familiesTable = pgTable("families", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Family = typeof familiesTable.$inferSelect;
export type InsertFamily = typeof familiesTable.$inferInsert;
