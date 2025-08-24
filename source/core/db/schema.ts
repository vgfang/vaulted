import { sql } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const metadataTable = sqliteTable("metadata", {
  id: int().primaryKey().default(0),
  name: text().notNull(),
  description: text(),
  createdAt: int(),
  updatedAt: int(),
  lastPasswordChange: int(),
  enableTimestamps: int().notNull().default(1),
});

export const passwordsTable = sqliteTable("passwords", {
  id: int().primaryKey({ autoIncrement: true }),
  password: text().notNull(),
  createdAt: int()
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: int()
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  name: text().notNull(),
  description: text(),
  email: text(),
  isFavorite: int().notNull().default(0),
});
