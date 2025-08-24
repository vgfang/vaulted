import { metadataTable, passwordsTable } from "./schema";

// drizzle inferred types for select operations
export type VaultMetadata = typeof metadataTable.$inferSelect;
export type Password = typeof passwordsTable.$inferSelect;

// drizzle inferred types for insert operations
export type NewVaultMetadata = typeof metadataTable.$inferInsert;
export type NewPassword = typeof passwordsTable.$inferInsert;

// vault state types
export type VaultState = "locked" | "unlocked" | "not created";
