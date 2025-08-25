import {sql} from 'drizzle-orm';
import {Client} from '@libsql/client';
import {int, sqliteTable, text} from 'drizzle-orm/sqlite-core';

export const metadataTable = sqliteTable('metadata', {
	id: int().primaryKey().default(0),
	name: text().notNull(),
	description: text(),
	createdAt: int(),
	updatedAt: int(),
	lastPasswordChange: int(),
	enableTimestamps: int().notNull().default(1),
});

export const passwordsTable = sqliteTable('passwords', {
	id: int().primaryKey({autoIncrement: true}),
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

// unfortunately, drizzle-orm is not suited for programmatic table creation, we need to duplicate the schema here, but the schema will be static anyway
export const createTables = async (client: Client) => {
	await client.execute(`
    CREATE TABLE IF NOT EXISTS metadata (
      id INTEGER PRIMARY KEY DEFAULT 0,
      name TEXT NOT NULL,
      description TEXT,
      createdAt INTEGER,
      updatedAt INTEGER,
      lastPasswordChange INTEGER,
      enableTimestamps INTEGER NOT NULL DEFAULT 1
    )
  `);

	await client.execute(`
    CREATE TABLE IF NOT EXISTS passwords (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      password TEXT NOT NULL,
      createdAt INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP,
      name TEXT NOT NULL,
      description TEXT,
      email TEXT,
      isFavorite INTEGER NOT NULL DEFAULT 0
    )
  `);
};
