import {metadataTable, passwordsTable} from '../core/db/schema';

// drizzle inferred types for select operations
export type VaultMetadata = typeof metadataTable.$inferSelect & {
	filePath: string; // full path to the vault file
};
export type Password = typeof passwordsTable.$inferSelect;

// drizzle inferred types for insert operations
export type NewVaultMetadata = typeof metadataTable.$inferInsert;
export type NewPassword = typeof passwordsTable.$inferInsert;

// vault state types
export type VaultState = 'locked' | 'unlocked' | 'not created';
