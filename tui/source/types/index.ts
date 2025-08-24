import {metadataTable, passwordsTable} from '@core/db/schema';

// drizzle inferred types for select operations
export type VaultMetadata = typeof metadataTable.$inferSelect;
export type Password = typeof passwordsTable.$inferSelect;

// drizzle inferred types for insert operations
export type NewVaultMetadata = typeof metadataTable.$inferInsert;
export type NewPassword = typeof passwordsTable.$inferInsert;

// re-export core types for convenience
export type {VaultState} from '@core/db/types';
